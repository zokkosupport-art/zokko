# Vérifie que zokko.net est prêt après déploiement + config Twilio.
param(
    [string]$BaseUrl = "https://zokko.net/api"
)

$ErrorActionPreference = "Continue"
Write-Host "`n=== Zokko — vérification lancement ===" -ForegroundColor Cyan

# 1. Stats publiques
try {
    $stats = Invoke-RestMethod -Uri "$BaseUrl/public/stats" -TimeoutSec 15
    Write-Host "[OK] /public/stats -> users=$($stats.users), listings=$($stats.listings)" -ForegroundColor Green
} catch {
    Write-Host "[!!] /public/stats absent ou erreur (redéployer le backend)" -ForegroundColor Yellow
    Write-Host "     $($_.Exception.Message)"
}

# 2. OTP ne doit plus exposer 123456 universel en prod
try {
    $otp = Invoke-RestMethod -Uri "$BaseUrl/auth/request-otp" -Method POST `
        -ContentType "application/json" `
        -Body '{"phone":"612516488","country":"GN"}' `
        -TimeoutSec 15
    if ($otp.dev_otp) {
        Write-Host "[!!] Mode démo actif (dev_otp visible) — mettre OTP_DEV_MODE=false en prod" -ForegroundColor Yellow
    } elseif ($otp.sms_sent) {
        Write-Host "[OK] SMS envoyé (Twilio configuré)" -ForegroundColor Green
    } else {
        Write-Host "[!!] OTP généré mais SMS non envoyé — vérifier Twilio" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[!!] request-otp erreur: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Badge Emergent retiré du HTML
try {
    $html = (Invoke-WebRequest -Uri "https://zokko.net" -UseBasicParsing -TimeoutSec 15).Content
    if ($html -match "Made with Emergent|emergent-main\.js") {
        Write-Host "[!!] Badge/script Emergent encore présent — redéployer le frontend" -ForegroundColor Yellow
    } else {
        Write-Host "[OK] Pas de badge Emergent sur la page d'accueil" -ForegroundColor Green
    }
} catch {
    Write-Host "[!!] Impossible de lire zokko.net: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nConnexion admin après déploiement:" -ForegroundColor Cyan
Write-Host "  Guinée : pays GN, numéro 612516488"
Write-Host "  France : pays FR, numéro 659497111"
Write-Host ""
