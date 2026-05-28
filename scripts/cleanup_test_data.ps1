# Zokko go-live cleanup — removes TEST listings and fixes admin branding.
# Requires admin OTP access (default demo: phone 620000000, OTP 123456).

param(
    [string]$BaseUrl = "https://zokko.net/api",
    [string]$AdminPhone = "620000000",
    [string]$Otp = "123456"
)

$ErrorActionPreference = "Stop"

Write-Host "Logging in as admin ($AdminPhone)..."
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/verify-otp" -Method POST `
    -ContentType "application/json" `
    -Body (@{ phone = $AdminPhone; otp = $Otp } | ConvertTo-Json)

$headers = @{
    Authorization = "Bearer $($login.access_token)"
    "Content-Type" = "application/json"
}

Write-Host "Renaming admin profile..."
Invoke-RestMethod -Uri "$BaseUrl/auth/me" -Method PATCH -Headers $headers `
    -Body '{"name":"Admin Zokko"}' | Out-Null

$listings = Invoke-RestMethod -Uri "$BaseUrl/admin/listings" -Headers $headers
$testListings = @($listings | Where-Object { $_.title -match '^TEST' })

Write-Host "Found $($testListings.Count) TEST listing(s)."
foreach ($listing in $testListings) {
    Invoke-RestMethod -Uri "$BaseUrl/listings/$($listing.id)" -Method DELETE -Headers $headers | Out-Null
    Write-Host "  Deleted: $($listing.title)"
}

$stats = Invoke-RestMethod -Uri "$BaseUrl/admin/stats" -Headers $headers
Write-Host ""
Write-Host "Done. Stats: $($stats.users) users, $($stats.listings_approved) approved listings."
