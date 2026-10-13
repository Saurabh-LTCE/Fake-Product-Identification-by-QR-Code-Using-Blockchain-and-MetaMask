# Starts the React (Vite) frontend on http://localhost:5173
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot

Assert-Node
if (-not (Test-Path "frontend\node_modules")) { Stop-WithError "Frontend dependencies are missing. Run: powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1" }
if (-not (Test-Path "frontend\.env")) { Stop-WithError "frontend\.env is missing. Run setup.ps1 or copy frontend\.env.example to frontend\.env" }

Write-Step "Starting frontend at http://localhost:5173"
Set-Location frontend
npm run dev
exit $LASTEXITCODE
