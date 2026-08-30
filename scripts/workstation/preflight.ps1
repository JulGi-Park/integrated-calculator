[CmdletBinding()]
param()

# Read-only repository preflight. The only state-changing operation is git fetch.
$ErrorActionPreference = 'Stop'

$ExitCodes = @{
    SYNCED                    = 0
    REMOTE_AHEAD              = 10
    LOCAL_AHEAD               = 11
    DIRTY                     = 12
    DIVERGED                  = 13
    NO_UPSTREAM               = 14
    DETACHED_HEAD             = 15
    WORKSTATION_MARKER_MISSING = 20
    WORKSTATION_MARKER_INVALID  = 21
    WORKSTATION_MISMATCH      = 22
    FETCH_FAILED              = 30
    GIT_ERROR                 = 40
    NO_ORIGIN                 = 41
}

function Get-TextOrDash([object] $Value) {
    if ($null -eq $Value -or [string]::IsNullOrWhiteSpace([string]$Value)) { return '-' }
    return ([string]$Value).Trim()
}

function Invoke-Git([string[]] $Arguments) {
    $previousPreference = $ErrorActionPreference
    try {
        # Native command stderr is captured as output so an expected non-zero Git
        # result (for example, no upstream) does not become a PowerShell exception.
        $ErrorActionPreference = 'Continue'
        $output = @(& git @Arguments 2>&1)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    [pscustomobject]@{ Output = (($output | ForEach-Object { [string]$_ }) -join "`n").Trim(); ExitCode = $exitCode }
}

function Mask-Remote([string] $Remote) {
    if ([string]::IsNullOrWhiteSpace($Remote)) { return '-' }
    try {
        $uri = [Uri]$Remote
        if ($uri.UserInfo) {
            return '{0}://***@{1}{2}' -f $uri.Scheme, $uri.Host, $uri.PathAndQuery
        }
    } catch {
        # Non-URI remotes (for example SSH scp syntax) are masked below.
    }
    if ($Remote -match '^(?<prefix>[^:]+://)?(?<user>[^/@:]+)@(?<host>[^/:]+)(?<rest>[:/].*)?$') {
        return '{0}***@{1}{2}' -f $Matches.prefix, $Matches.host, $Matches.rest
    }
    return ($Remote -replace '(?i)(https?://)([^/@]+)@', '$1***@')
}

function Get-MarkerValue([object] $Marker, [string[]] $Names) {
    foreach ($name in $Names) {
        $property = $Marker.PSObject.Properties | Where-Object { $_.Name -ieq $name } | Select-Object -First 1
        if ($null -ne $property -and $null -ne $property.Value -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
            return ([string]$property.Value).Trim()
        }
    }
    return $null
}

function Normalize-Path([string] $Path) {
    if ([string]::IsNullOrWhiteSpace($Path)) { return '' }
    return ([IO.Path]::GetFullPath($Path).TrimEnd('\')).ToLowerInvariant()
}

$markerPath = Join-Path $env:USERPROFILE '.gyesanbox\workstation.json'
$workstation = '-'
$markerState = 'OK'
$markerComputerName = $null

if (-not (Test-Path -LiteralPath $markerPath -PathType Leaf)) {
    $markerState = 'WORKSTATION_MARKER_MISSING'
} else {
    try {
        $marker = Get-Content -LiteralPath $markerPath -Raw | ConvertFrom-Json
        $workstation = Get-MarkerValue $marker @('workstation', 'workstationName', 'name', 'role', 'machine')
        $markerComputerName = Get-MarkerValue $marker @('computerName', 'COMPUTERNAME', 'computer', 'pcName', 'hostname')
        if ([string]::IsNullOrWhiteSpace($workstation)) { $workstation = '-' }
        if ([string]::IsNullOrWhiteSpace($markerComputerName) -and $workstation -eq '-') {
            $markerState = 'WORKSTATION_MARKER_INVALID'
        }
    } catch {
        $markerState = 'WORKSTATION_MARKER_INVALID'
    }
}

$computerName = Get-TextOrDash $env:COMPUTERNAME
$mismatch = $false
if ($markerState -eq 'OK' -and -not [string]::IsNullOrWhiteSpace($markerComputerName) -and $computerName -ne '-' -and $markerComputerName -ine $computerName) {
    $mismatch = $true
}

$gitRoot = '-'
$worktree = '-'
$branch = '-'
$head = '-'
$origin = '-'
$upstream = '-'
$staged = 0
$unstaged = 0
$untracked = 0
$ahead = 0
$behind = 0
$fetchFailed = $false
$gitFailure = $false
$notGitRepository = $false

try {
    $rootResult = Invoke-Git @('rev-parse', '--show-toplevel')
    if ($rootResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($rootResult.Output)) {
        $notGitRepository = $true
    } else {
        $gitRoot = $rootResult.Output.Split("`n")[0].Trim()

        $worktreeResult = Invoke-Git @('worktree', 'list', '--porcelain')
        if ($worktreeResult.ExitCode -ne 0) {
            $worktree = 'UNKNOWN (WORKTREE_INFO_FAILED)'
            $gitFailure = $true
        } else {
            $currentRoot = Normalize-Path $gitRoot
            $worktreePaths = @($worktreeResult.Output -split "`r?`n" | Where-Object { $_ -like 'worktree *' } | ForEach-Object { $_.Substring(9).Trim() })
            $matchedPath = $worktreePaths | Where-Object { (Normalize-Path $_) -eq $currentRoot } | Select-Object -First 1
            if ($matchedPath) {
                $leaf = Split-Path -Leaf $matchedPath
                if ($leaf -match '^(Cal|Cal-AIT)$') { $worktree = $leaf } else { $worktree = "OTHER ($leaf)" }
            } else {
                $worktree = 'UNKNOWN'
            }
        }

        $branchResult = Invoke-Git @('branch', '--show-current')
        if ($branchResult.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($branchResult.Output)) { $branch = $branchResult.Output.Split("`n")[0].Trim() }

        $headResult = Invoke-Git @('rev-parse', 'HEAD')
        if ($headResult.ExitCode -eq 0 -and $headResult.Output -match '(?m)^[0-9a-fA-F]{40}$') { $head = $headResult.Output.Split("`n")[0].Trim() } else { $gitFailure = $true }

        $originResult = Invoke-Git @('remote', 'get-url', 'origin')
        if ($originResult.ExitCode -eq 0) { $origin = Mask-Remote ($originResult.Output.Split("`n")[0].Trim()) }

        $statusResult = Invoke-Git @('status', '--porcelain')
        if ($statusResult.ExitCode -ne 0) {
            $gitFailure = $true
        } elseif (-not [string]::IsNullOrWhiteSpace($statusResult.Output)) {
            foreach ($line in @($statusResult.Output -split "`r?`n" | Where-Object { $_.Length -ge 2 })) {
                $index = $line.Substring(0, 1)
                $workTreeCode = $line.Substring(1, 1)
                if ($index -eq '?' -and $workTreeCode -eq '?') { $untracked++ }
                else {
                    if ($index -ne ' ' -and $index -ne '?') { $staged++ }
                    if ($workTreeCode -ne ' ' -and $workTreeCode -ne '?') { $unstaged++ }
                }
            }
        }

        if ($origin -ne '-') {
            $fetchResult = Invoke-Git @('fetch', 'origin', '--prune')
            if ($fetchResult.ExitCode -ne 0) { $fetchFailed = $true }
        }

        $upstreamResult = Invoke-Git @('rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}')
        if ($upstreamResult.ExitCode -eq 0 -and -not [string]::IsNullOrWhiteSpace($upstreamResult.Output)) {
            $upstream = $upstreamResult.Output.Split("`n")[0].Trim()
            if (-not $fetchFailed) {
                $countsResult = Invoke-Git @('rev-list', '--left-right', '--count', 'HEAD...@{upstream}')
                if ($countsResult.ExitCode -eq 0 -and $countsResult.Output -match '^\s*(\d+)\s+(\d+)\s*$') {
                    $ahead = [int]$Matches[1]
                    $behind = [int]$Matches[2]
                } else { $gitFailure = $true }
            }
        }
    }
} catch {
    if ($_.Exception.Message -match 'not recognized|cannot find the file') { $gitFailure = $true } else { $gitFailure = $true }
}

$workingTreeDirty = ($staged + $unstaged + $untracked) -gt 0
$status = 'SYNCED'
if ($notGitRepository) { $status = 'NOT_GIT_REPOSITORY' }
elseif ($mismatch) { $status = 'WORKSTATION_MISMATCH' }
elseif ($markerState -ne 'OK') { $status = $markerState }
elseif ($fetchFailed) { $status = 'FETCH_FAILED' }
elseif ($gitFailure) { $status = 'GIT_ERROR' }
elseif ($origin -eq '-') { $status = 'NO_ORIGIN' }
elseif ($branch -eq '-') { $status = 'DETACHED_HEAD' }
elseif ($workingTreeDirty) { $status = 'DIRTY' }
elseif ($upstream -eq '-') { $status = 'NO_UPSTREAM' }
elseif ($ahead -gt 0 -and $behind -gt 0) { $status = 'DIVERGED' }
elseif ($ahead -gt 0) { $status = 'LOCAL_AHEAD' }
elseif ($behind -gt 0) { $status = 'REMOTE_AHEAD' }

$safe = if ($status -eq 'SYNCED') { 'YES' } else { 'NO' }
$exitCode = if ($ExitCodes.ContainsKey($status)) { $ExitCodes[$status] } else { 40 }

Write-Output '=== WORKSTATION PREFLIGHT ==='
Write-Output ('WORKSTATION: {0}' -f (Get-TextOrDash $workstation))
Write-Output ('COMPUTERNAME: {0}' -f $computerName)
Write-Output ('GIT_ROOT: {0}' -f $gitRoot)
Write-Output ('WORKTREE: {0}' -f $worktree)
Write-Output ('BRANCH: {0}' -f $branch)
Write-Output ('HEAD: {0}' -f $head)
Write-Output ('ORIGIN: {0}' -f $origin)
Write-Output ('UPSTREAM: {0}' -f $upstream)
Write-Output ('STAGED: {0}' -f $staged)
Write-Output ('UNSTAGED: {0}' -f $unstaged)
Write-Output ('UNTRACKED: {0}' -f $untracked)
Write-Output ('AHEAD: {0}' -f $ahead)
Write-Output ('BEHIND: {0}' -f $behind)
Write-Output ('STATUS: {0}' -f $status)
Write-Output ('SAFE_TO_CONTINUE: {0}' -f $safe)
Write-Output ('EXIT_CODE: {0}' -f $exitCode)
exit $exitCode
