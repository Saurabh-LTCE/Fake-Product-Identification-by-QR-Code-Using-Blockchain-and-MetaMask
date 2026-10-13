# Deploys ProductRegistry to the running local blockchain and updates backend + frontend config.
# Re-run this every time you restart the blockchain (a restart erases everything on it).
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot

Assert-Node
if (-not (Test-Path "node_modules\hardhat")) { Stop-WithError "Dependencies are missing. Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1" }

Write-Step "Checking that the blockchain is running"
$chain = Get-RpcChainId
if ($null -eq $chain) { Stop-WithError "No blockchain at http://127.0.0.1:8545. Start it first (in its own terminal): .\scripts\start-blockchain.ps1" }
if ($chain -ne "0x7a69") { Stop-WithError "Unexpected chain ID $chain at port 8545 (expected 0x7a69 = 31337). Is another blockchain using this port?" }
Write-Ok "Hardhat blockchain is running"

Write-Step "Deploying ProductRegistry"
npx hardhat run scripts/deploy.js --network localhost
if ($LASTEXITCODE -ne 0) { Stop-WithError "Deployment failed. Read the error above." }

$deployment = Get-Content "backend\contracts\ProductRegistry.json" -Raw | ConvertFrom-Json
if ([string]::IsNullOrWhiteSpace($deployment.address)) { Stop-WithError "Deployment finished but no contract address was written to backend\contracts\ProductRegistry.json" }
Write-Ok "Contract deployed at $($deployment.address)"
