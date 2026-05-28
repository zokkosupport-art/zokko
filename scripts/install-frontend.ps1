# Installe les dependances frontend (a lancer une fois)
$env:Path = "C:\Program Files\nodejs;" + $env:Path
$frontend = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"
Set-Location -LiteralPath $frontend
Write-Host "Installation npm (~2 min)..." -ForegroundColor Cyan
npm install --legacy-peer-deps
Write-Host "[OK] Termine. Lancez start-frontend.ps1 ou setup-local.ps1" -ForegroundColor Green
