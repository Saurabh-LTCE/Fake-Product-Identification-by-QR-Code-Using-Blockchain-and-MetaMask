# Shared helpers for the project's PowerShell scripts (dot-sourced by the other scripts).
$ErrorActionPreference = "Stop"
$script:ProjectRoot = Split-Path -Parent $PSScriptRoot

function Write-Step([string]$m) { Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host "[OK]   $m" -ForegroundColor Green }
function Write-Warn([string]$m) { Write-Host "[WARN] $m" -ForegroundColor Yellow }
function Write-Fail([string]$m) { Write-Host "[FAIL] $m" -ForegroundColor Red }
function Stop-WithError([string]$m) { Write-Fail $m; exit 1 }

function Assert-Node {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Stop-WithError "Node.js was not found. Install Node.js LTS from https://nodejs.org/en/download , then close and reopen VS Code."
    }
    $version = (node -v).TrimStart("v")
    $major = [int]($version.Split(".")[0])
    if ($major -lt 18) { Stop-WithError "Node.js $version is too old. Install the current LTS from https://nodejs.org/en/download" }
    Write-Ok "Node.js v$version"
}

function Get-RpcChainId([string]$url = "http://127.0.0.1:8545") {
    try {
        $body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
        $r = Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body -TimeoutSec 3
        return $r.result
    } catch { return $null }
}

function Test-Http([string]$url) {
    try { $null = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3; return $true } catch { return $false }
}

function Wait-Until([scriptblock]$condition, [int]$timeoutSeconds) {
    $end = (Get-Date).AddSeconds($timeoutSeconds)
    while ((Get-Date) -lt $end) {
        if (& $condition) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}
