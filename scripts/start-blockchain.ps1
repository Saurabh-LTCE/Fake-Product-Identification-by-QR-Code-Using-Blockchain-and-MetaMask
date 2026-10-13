# Starts the local Hardhat blockchain. Keep this window open while you use the app.
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot

Assert-Node
if (-not (Test-Path "node_modules\hardhat")) { Stop-WithError "Dependencies are missing. Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1" }
if ($null -ne (Get-RpcChainId)) { Stop-WithError "Something is already answering on http://127.0.0.1:8545 (a blockchain is probably already running). Close it first, or just use it." }

Write-Step "Starting Hardhat local blockchain on http://127.0.0.1:8545 (chain ID 31337)"
Write-Host "Account #0 below is the authorized manufacturer. These keys are PUBLIC test keys - never use them on a real network." -ForegroundColor Yellow
npx hardhat node
exit $LASTEXITCODE
