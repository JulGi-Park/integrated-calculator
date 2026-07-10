param(
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

function Get-RemoteBranchRef([string]$Branch) {
  $check = RunGit @("show-ref", "--verify", "--quiet", "refs/remotes/origin/$Branch") -AllowFailure
  if ($check.Code -eq 0) {
    return "origin/$Branch"
  }
  return $null
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

  $branchResult = RunGit @("branch", "--show-current")
  $branch = (($branchResult.Output | Out-String).Trim())
  if ([string]::IsNullOrWhiteSpace($branch)) {
    Fail "Detached HEAD 상태에서는 백업을 중단합니다."
  }
  if ($branch -in @("main", "master")) {
    Fail "main/master 브랜치에서는 WIP 자동 커밋을 하지 않습니다."
  }

  $head = GitText @("rev-parse", "HEAD")
  $remoteUrl = GitText @("remote", "get-url", "origin")

  Write-Host "Repository: $root"
  Write-Host "Branch: $branch"
  Write-Host "HEAD: $head"
  Write-Host "Origin: $remoteUrl"
  if ($DryRun) { Write-Host "DryRun: enabled" }

  RunGit @("fetch", "origin", "--prune") | Out-Null

  $remoteRef = Get-RemoteBranchRef $branch
  if ($remoteRef) {
    $remoteHead = GitText @("rev-parse", $remoteRef)
    $base = GitText @("merge-base", "HEAD", $remoteRef)
    Write-Host "Remote HEAD: $remoteHead"
    if ($base -eq $head -and $head -ne $remoteHead) {
      Fail "원격 브랜치가 로컬보다 앞서 있습니다. 자동 병합하지 않습니다."
    }
    if ($base -ne $head -and $base -ne $remoteHead) {
      Fail "로컬과 원격 브랜치가 갈라졌습니다. 자동 병합하지 않습니다."
    }
  } else {
    Write-Warning "origin/$branch 원격 브랜치가 없습니다. 성공 시 새 원격 브랜치가 생성됩니다."
  }

  $statusLines = @((RunGit @("status", "--porcelain=v1", "-uall")).Output)
  Write-Host "Working tree status:"
  if ($statusLines.Count -eq 0) {
    Write-Host "  clean"
  } else {
    $statusLines | ForEach-Object { Write-Host "  $_" }
  }

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

  if ($statusLines.Count -gt 0) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $computer = Get-ComputerSlug
    $message = "wip($computer): checkpoint $timestamp"
    if ($DryRun) {
      Write-Host "[DryRun] git add -A"
      Write-Host "[DryRun] git commit -m `"$message`""
    } else {
      RunGit @("add", "-A") | Out-Null
      $staged = @((RunGit @("diff", "--cached", "--name-only")).Output)
      $stagedSensitive = @($staged | Where-Object { Test-SensitivePath $_ })
      if ($stagedSensitive.Count -gt 0) {
        Fail "민감 파일이 staged 대상에 포함되어 중단합니다: $($stagedSensitive -join ', ')"
      }
      RunGit @("commit", "-m", $message) | Out-Null
      $head = GitText @("rev-parse", "HEAD")
      Write-Host "Created checkpoint commit: $head"
    }
  } else {
    Write-Host "No local changes. Checkpoint commit skipped."
  }

  if ($DryRun) {
    Write-Host "[DryRun] git push -u origin $branch"
    Write-Host "Restore branch: $branch"
    Write-Host "Restore commit: $head"
    exit 0
  }

  RunGit @("push", "-u", "origin", $branch) | Out-Null
  RunGit @("fetch", "origin", "--prune") | Out-Null
  $localHead = GitText @("rev-parse", "HEAD")
  $remoteHeadAfter = GitText @("rev-parse", "origin/$branch")
  if ($localHead -ne $remoteHeadAfter) {
    Fail "push 후 로컬 HEAD와 원격 HEAD가 다릅니다. local=$localHead remote=$remoteHeadAfter"
  }

  Write-Host "Backup complete."
  Write-Host "Restore branch: $branch"
  Write-Host "Restore commit: $localHead"
  exit 0
} catch {
  Write-Error $_
  exit 1
}
