$ErrorActionPreference = "Stop"

Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-NpmCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    & npm.cmd @Arguments

    if ($LASTEXITCODE -ne 0) {
        throw "npm $($Arguments -join ' ') failed."
    }
}

Write-Host ""
Write-Host "[1/4] Running ESLint"
Invoke-NpmCommand @("run", "lint")

Write-Host ""
Write-Host "[2/4] Running TypeScript checks"
Invoke-NpmCommand @("run", "typecheck")

Write-Host ""
Write-Host "[3/4] Running tests"
Invoke-NpmCommand @("test")

Write-Host ""
Write-Host "[4/4] Creating production build"
Invoke-NpmCommand @("run", "build")

Write-Host ""
Write-Host "All checks passed."
Write-Host "Starting the development server. Press Ctrl+C to stop."

$server = Start-Process `
    -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--hostname", "127.0.0.1") `
    -WorkingDirectory (Get-Location) `
    -NoNewWindow `
    -PassThru

try {
    $url = "http://localhost:3000/"
    $ready = $false

    for ($attempt = 0; $attempt -lt 60; $attempt++) {
        if ($server.HasExited) {
            throw "The development server stopped before it was ready."
        }

        try {
            $response = Invoke-WebRequest `
                -Uri $url `
                -UseBasicParsing `
                -TimeoutSec 1

            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }

    if (-not $ready) {
        throw "The development server was not ready within 60 seconds."
    }

    if ($env:START_LOCAL_NO_BROWSER -ne "1") {
        Start-Process $url
    }

    Write-Host ""
    Write-Host "Ready: $url"

    Wait-Process -Id $server.Id
}
finally {
    if (-not $server.HasExited) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
    }
}
