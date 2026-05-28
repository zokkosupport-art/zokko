# Zokko - installation locale automatique
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"
$envFile = Join-Path $backend ".env"

function Get-PythonCmd {
    if (Get-Command python -ErrorAction SilentlyContinue) { return "python" }
    if (Get-Command py -ErrorAction SilentlyContinue) { return "py" }
    if (Get-Command python3 -ErrorAction SilentlyContinue) { return "python3" }
    return $null
}

Write-Host ""
Write-Host "=== Zokko setup local ===" -ForegroundColor Cyan

if (-not (Test-Path $envFile)) {
    Copy-Item (Join-Path $backend ".env.example") $envFile
    Write-Host "[OK] Fichier .env cree" -ForegroundColor Green
    $uri = Read-Host "Collez URI mongodb+srv puis Entree (vide = editer .env apres)"
    if ($uri.Trim()) {
        $lines = Get-Content $envFile
        $lines = $lines | ForEach-Object {
            if ($_ -match "^MONGO_URL=") { 'MONGO_URL="' + $uri.Trim() + '"' } else { $_ }
        }
        $lines | Set-Content $envFile -Encoding UTF8
    }
} else {
    Write-Host "[OK] .env existe deja" -ForegroundColor Green
}

$envRaw = Get-Content $envFile -Raw
if ($envRaw -notmatch "mongodb\+srv://") {
    Write-Host "[!!] MONGO_URL Atlas pas configure dans .env" -ForegroundColor Red
    Write-Host "     Ouvrez $envFile" -ForegroundColor Yellow
    exit 1
}
Write-Host "[OK] MONGO_URL Atlas detecte" -ForegroundColor Green

$python = Get-PythonCmd
if (-not $python) {
    Write-Host "[!!] Python introuvable. Installez Python 3.12 avec Add to PATH." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python trouve" -ForegroundColor Green

Write-Host ""
Write-Host "--- Backend pip ---" -ForegroundColor Cyan
Push-Location $backend
if ($python -eq "py") {
    & py -3 -m pip install -r requirements.txt -q
} else {
    & $python -m pip install -r requirements.txt -q
}
Pop-Location

Write-Host ""
Write-Host "--- Frontend npm ---" -ForegroundColor Cyan
$feEnv = Join-Path $frontend ".env"
Set-Content $feEnv "REACT_APP_BACKEND_URL=http://localhost:8000" -Encoding UTF8
Push-Location $frontend
if (-not (Test-Path "node_modules\.bin\craco.cmd")) {
    Write-Host "Installation npm (1ere fois, ~2 min)..." -ForegroundColor Yellow
    npm install --legacy-peer-deps
}
Pop-Location

Write-Host ""
Write-Host "=== Demarrage ===" -ForegroundColor Cyan

$startBackend = Join-Path $root "scripts\start-backend.ps1"
$startFrontend = Join-Path $root "scripts\start-frontend.ps1"

Start-Process powershell -ArgumentList @("-NoExit", "-File", $startBackend)
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList @("-NoExit", "-File", $startFrontend)

Write-Host "[OK] Deux fenetres ouvertes." -ForegroundColor Green
Write-Host "Ouvrez http://localhost:3000/login" -ForegroundColor Green
Write-Host ""
