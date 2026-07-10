param(
  [string]$Branch,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Fail($Message) {
  Write-Error $Message
  exit 1
}

function RunGit([string[]]$GitArgs, [switch]$AllowFailure) {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git @GitArgs 2>&1
    $code = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($code -ne 0 -and -not $AllowFailure) {
    $text = ($output | Out-String).Trim()
    if ($text) {
      Fail "git $($GitArgs -join ' ') failed: $text"
    }
    Fail "git $($GitArgs -join ' ') failed with exit code $code"
  }
  return [pscustomobject]@{ Code = $code; Output = @($output) }
}

function GitText([string[]]$GitArgs) {
  return ((RunGit $GitArgs).Output | Out-String).Trim()
}

function Get-ComputerSlug {
  $name = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { "unknown-device" }
  return ($name -replace "[^A-Za-z0-9._-]", "-").ToLowerInvariant()
}

function Sanitize-BranchPart([string]$Name) {
  if ([string]::IsNullOrWhiteSpace($Name)) { return "detached" }
  return ($Name -replace "[^A-Za-z0-9._/-]", "-").Trim("/")
}

function Test-SensitivePath([string]$Path) {
  $normalized = $Path -replace "\\", "/"
  $leaf = [System.IO.Path]::GetFileName($normalized)
  if ($leaf -match "^\.env(\..*)?$") { return $true }
  if ($normalized -match "(^|/)\.env(\..*)?$") { return $true }
  if ($normalized -match "(^|/)(id_rsa|id_dsa|id_ecdsa|id_ed25519|known_hosts|credentials|token|tokens)(\.|$|/)") { return $true }
  if ($normalized -match "\.(pem|key|p12|pfx|crt|cer)$") { return $true }
  if ($normalized -match "(secret|token|credential|auth)" -and $normalized -match "\.(json|ya?ml|txt|env)$") { return $true }
  return $false
}

try {
  $root = GitText @("rev-parse", "--show-toplevel")
  Set-Location -LiteralPath $root

  $currentBranch = GitText @("branch", "--show-current")
  if ([string]::IsNullOrWhiteSpace($Branch)) {
    if ([string]::IsNullOrWhiteSpace($currentBranch)) {
      Fail "복구 브랜치 인수가 없고 현재 HEAD가 detached 상태입니다."
    }
    $Branch = $currentBranch
  }

  Write-Host "Repository: $root"
  Write-Host "Current branch: $currentBranch"
  Write-Host "Target branch: $Branch"
  if ($DryRun) { Write-Host "DryRun: enabled" }

  RunGit @("fetch", "origin", "--prune") | Out-Null
  $remoteCheck = RunGit @("show-ref", "--verify", "--quiet", "refs/remotes/origin/$Branch") -AllowFailure
  if ($remoteCheck.Code -ne 0) {
    Fail "대상 원격 브랜치가 없습니다: origin/$Branch"
  }

  $statusLines = @((RunGit @("status", "--porcelain=v1", "-uall")).Output)
  if ($statusLines.Count -gt 0) {
    Write-Host "Local changes found. Creating backup branch before restore:"
    $statusLines | ForEach-Object { Write-Host "  $_" }

    $candidatePaths = @()
    foreach ($line in $statusLines) {
      if ($line.Length -lt 4) { continue }
      $path = $line.Substring(3).Trim()
      if ($path -match " -> ") {
        $path = ($path -split " -> ")[-1]
      }
      $candidatePaths += $path.Trim('"')
    }
    $sensitive = @($candidatePaths | Where-Object { Test-SensitivePath $_ })
    if ($sensitive.Count -gt 0) {
      Fail "민감 파일은 백업 커밋 대상이 될 수 없습니다: $($sensitive -join ', ')"
    }

    $computer = Get-ComputerSlug
    $safeCurrent = Sanitize-BranchPart $currentBranch
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupBranch = "backup/$computer/$safeCurrent/$stamp"
    $message = "wip($computer): checkpoint $(Get-Date -Format 'yyyy-MM-dd HH:mm')"

    if ($DryRun) {
      Write-Host "[DryRun] git switch -c $backupBranch"
      Write-Host "[DryRun] git add -A"
      Write-Host "[DryRun] git commit -m `"$message`""
      Write-Host "[DryRun] git push -u origin $backupBranch"
    } else {
      RunGit @("switch", "-c", $backupBranch) | Out-Null
      RunGit @("add", "-A") | Out-Null
      $staged = @((RunGit @("diff", "--cached", "--name-only")).Output)
      $stagedSensitive = @($staged | Where-Object { Test-SensitivePath $_ })
      if ($stagedSensitive.Count -gt 0) {
        Fail "민감 파일이 staged 대상에 포함되어 중단합니다: $($stagedSensitive -join ', ')"
      }
      RunGit @("commit", "-m", $message) | Out-Null
      RunGit @("push", "-u", "origin", $backupBranch) | Out-Null
      RunGit @("fetch", "origin", "--prune") | Out-Null
      $backupLocal = GitText @("rev-parse", "HEAD")
      $backupRemote = GitText @("rev-parse", "origin/$backupBranch")
      if ($backupLocal -ne $backupRemote) {
        Fail "백업 push 확인 실패: local=$backupLocal remote=$backupRemote"
      }
      Write-Host "Backup branch pushed: $backupBranch $backupLocal"
    }
  }

  $localTarget = RunGit @("show-ref", "--verify", "--quiet", "refs/heads/$Branch") -AllowFailure
  if ($DryRun) {
    if ($localTarget.Code -eq 0) {
      Write-Host "[DryRun] git switch $Branch"
    } else {
      Write-Host "[DryRun] git switch --track -c $Branch origin/$Branch"
    }
    Write-Host "[DryRun] git pull --ff-only"
    exit 0
  }

  if ($localTarget.Code -eq 0) {
    RunGit @("switch", $Branch) | Out-Null
  } else {
    RunGit @("switch", "--track", "-c", $Branch, "origin/$Branch") | Out-Null
  }

  $upstream = RunGit @("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}") -AllowFailure
  if ($upstream.Code -ne 0) {
    RunGit @("branch", "--set-upstream-to", "origin/$Branch", $Branch) | Out-Null
  }
  RunGit @("pull", "--ff-only") | Out-Null

  $localHead = GitText @("rev-parse", "HEAD")
  $remoteHead = GitText @("rev-parse", "origin/$Branch")
  $finalStatus = @((RunGit @("status", "--porcelain=v1", "-uall")).Output)
  Write-Host "Restore complete."
  Write-Host "Local HEAD: $localHead"
  Write-Host "Remote HEAD: $remoteHead"
  Write-Host "Working tree clean: $(if ($finalStatus.Count -eq 0) { 'yes' } else { 'no' })"
  if ($localHead -ne $remoteHead) {
    Fail "복구 후 로컬 HEAD와 원격 HEAD가 다릅니다."
  }
  exit 0
} catch {
  Write-Error $_
  exit 1
}
