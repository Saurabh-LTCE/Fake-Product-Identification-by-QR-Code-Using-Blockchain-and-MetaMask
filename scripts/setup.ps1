# One-time setup: installs all dependencies and creates the .env files.
# Run from the project root:  powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
. "$PSScriptRoot\_common.ps1"
Set-Location $script:ProjectRoot

Write-Step "Checking Node.js"
Assert-Node

foreach ($pair in @(@("backend\.env.example", "backend\.env"), @("frontend\.env.example", "frontend\.env"))) {
    if (-not (Test-Path $pair[1])) {
        Copy-Item $pair[0] $pair[1]
        Write-Ok "Created $($pair[1])"
    } else {
        Write-Ok "$($pair[1]) already exists (left unchanged)"
    }
}

$targets = @(
    @{ Name = "root (Hardhat)"; Dir = "." },
    @{ Name = "backend";        Dir = "backend" },
    @{ Name = "frontend";       Dir = "frontend" }
)
foreach ($t in $targets) {
    Write-Step "Installing dependencies: $($t.Name)"
    Push-Location (Join-Path $script:ProjectRoot $t.Dir)
    npm install
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -ne 0) { Stop-WithError "npm install failed for $($t.Name). Check your internet connection and read the error above." }
    Write-Ok "$($t.Name) dependencies installed"
}

Write-Host ""
Write-Ok "Setup finished. Next: .\scripts\start-all.ps1   (or follow README.md step by step)"
