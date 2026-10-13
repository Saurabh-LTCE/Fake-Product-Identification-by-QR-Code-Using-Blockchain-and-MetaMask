# Starts everything in the correct order, in separate windows, and stops with an error
# if any step does not come up. Run from the project root:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot
Assert-Node

function Start-Window([string]$title, [string]$script) {
    $argList = @("-NoExit", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $PSScriptRoot $script))
    Start-Process powershell -ArgumentList $argList -WorkingDirectory $script:ProjectRoot | Out-Null
    Write-Ok "Opened window: $title"
}

Write-Step "1/4 Blockchain"
if ($null -eq (Get-RpcChainId)) {
    Start-Window "Blockchain" "start-blockchain.ps1"
    if (-not (Wait-Until { $null -ne (Get-RpcChainId) } 90)) { Stop-WithError "The blockchain did not start within 90 seconds. Look at the Blockchain window for the error." }
}
Write-Ok "Blockchain is answering on port 8545"

Write-Step "2/4 Deploy contract"
& "$PSScriptRoot\deploy-contract.ps1"
if ($LASTEXITCODE -ne 0) { Stop-WithError "Deployment failed - not starting the backend or frontend." }

Write-Step "3/4 Backend"
if (-not (Test-Http "http://localhost:5000/api/health")) {
    Start-Window "Backend" "start-backend.ps1"
    if (-not (Wait-Until { Test-Http "http://localhost:5000/api/health" } 45)) {
        Stop-WithError "The backend did not start within 45 seconds. Look at the Backend window (most likely MongoDB is not running)."
    }
}
$health = Invoke-RestMethod "http://localhost:5000/api/health"
if (-not $health.database) { Stop-WithError "Backend is up but MongoDB is not connected." }
Write-Ok "Backend is running and connected to MongoDB"

Write-Step "4/4 Frontend"
if (-not (Test-Http "http://localhost:5173")) {
    Start-Window "Frontend" "start-frontend.ps1"
    if (-not (Wait-Until { Test-Http "http://localhost:5173" } 60)) { Stop-WithError "The frontend did not start within 60 seconds. Look at the Frontend window." }
}
Write-Ok "Frontend is running at http://localhost:5173"

Start-Process "http://localhost:5173"
Write-Host ""
Write-Ok "Everything is running. Remember: restarting the blockchain erases it - run deploy-contract.ps1 again afterwards."
