$env:Path = "C:\Program Files\nodejs;" + $env:Path
$frontend = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"
Set-Location -LiteralPath $frontend

if (-not (Test-Path "node_modules\.bin\craco.cmd")) {
    Write-Host "Installation des dependances npm (1ere fois, ~2 min)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}

Set-Content ".env" "REACT_APP_BACKEND_URL=http://localhost:8000" -Encoding UTF8
Write-Host "Demarrage sur http://localhost:3000" -ForegroundColor Green
npm start
