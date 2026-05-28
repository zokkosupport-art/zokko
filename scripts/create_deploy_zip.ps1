# Crée zokko-deploy.zip avec les fichiers à envoyer sur Emergent.
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$root\backend\server.py")) {
    throw "Projet Zokko introuvable: $root"
}
$zip = Join-Path $root "zokko-deploy.zip"
$staging = Join-Path $env:TEMP "zokko-deploy-$(Get-Date -Format 'yyyyMMddHHmmss')"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null

$be = Join-Path $staging "backend"
New-Item -ItemType Directory -Path $be | Out-Null
@("server.py", "sms.py", "phone_utils.py", "rate_limit.py", "cinetpay.py", "requirements.txt") | ForEach-Object {
    Copy-Item (Join-Path $root "backend\$_") $be
}

$fe = Join-Path $staging "frontend"
foreach ($dir in @("src\pages", "src\components", "src\lib", "public")) {
    New-Item -ItemType Directory -Path (Join-Path $fe $dir) -Force | Out-Null
}
Copy-Item "$root\frontend\src\App.js" "$fe\src\"
Copy-Item "$root\frontend\src\pages\*.jsx" "$fe\src\pages\"
Copy-Item "$root\frontend\src\components\Layout.jsx" "$fe\src\components\"
Copy-Item "$root\frontend\src\lib\*" "$fe\src\lib\" -Recurse
Copy-Item "$root\frontend\public\index.html" "$fe\public\"
Copy-Item "$root\frontend\.env" $fe
@("package.json", "craco.config.js") | ForEach-Object {
    $p = Join-Path $root "frontend\$_"
    if (Test-Path $p) { Copy-Item $p $fe }
}

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "$staging\*" -DestinationPath $zip -Force
Write-Host "OK: $zip ($([math]::Round((Get-Item $zip).Length/1KB)) KB)" -ForegroundColor Green
