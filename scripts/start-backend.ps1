# Starts the Express + MongoDB backend on the port defined in backend\.env (default 5000).
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot

Assert-Node
if (-not (Test-Path "backend\node_modules")) { Stop-WithError "Backend dependencies are missing. Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1" }
if (-not (Test-Path "backend\.env")) { Stop-WithError "backend\.env is missing. Run setup.ps1 or copy backend\.env.example to backend\.env" }

$deployment = Get-Content "backend\contracts\ProductRegistry.json" -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($deployment.address)) { Stop-WithError "The contract is not deployed yet. Run .\scripts\deploy-contract.ps1 first (blockchain must be running)." }

Write-Step "Starting backend (it exits with a clear message if MongoDB is not reachable)"
Set-Location backend
npm start
exit $LASTEXITCODE
