# Replace listing photos with images that match each ad (verified stock sources).
param(
    [string]$BaseUrl = "https://zokko.net/api",
    [string]$AdminPhone = "620000000",
    [string]$Otp = "123456",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$tempDir = Join-Path $env:TEMP "zokko-photos"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# keyword -> URL + label (for logs)
$photoMap = [ordered]@{
    "Toyota" = @{
        Url = "https://images.unsplash.com/photo-1623869674694-dcd959eca434?auto=format&fit=crop&w=1200&q=80"
        Label = "Berline noire (type Corolla)"
    }
    "Appartement" = @{
        Url = "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200"
        Label = "Salon appartement meuble"
    }
    "iPhone" = @{
        Url = "https://images.pexels.com/photos/4158/apple-iphone-smartphone-desk.jpg?auto=compress&cs=tinysrgb&w=1200"
        Label = "iPhone sur bureau"
    }
    "Coiffure" = @{
        Url = "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80"
        Label = "Salon coiffure / mariage"
    }
    "Bazin" = @{
        Url = "https://images.pexels.com/photos/29168547/pexels-photo-29168547.jpeg?auto=compress&cs=tinysrgb&w=1200"
        Label = "Robe africaine wax / mode"
    }
    "Livraison" = @{
        Url = "https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=1200"
        Label = "Livreur avec cartons"
    }
    "Riz" = @{
        Url = "https://images.unsplash.com/photo-1586201375767-2b532b21d645?auto=format&fit=crop&w=1200&q=80"
        Label = "Sacs de riz au marche"
    }
    "Chauffeur" = @{
        Url = "https://unsplash.com/photos/mZh5etL4D_I/download?force=true&w=1200"
        Label = "Chauffeur taxi au volant"
    }
}

Write-Host "Logging in..."
$login = Invoke-RestMethod -Uri "$BaseUrl/auth/verify-otp" -Method POST `
    -ContentType "application/json" `
    -Body (@{ phone = $AdminPhone; otp = $Otp } | ConvertTo-Json)
$token = $login.access_token

$listings = (Invoke-RestMethod -Uri "$BaseUrl/listings?limit=50").items
Write-Host "Found $($listings.Count) listing(s)."

foreach ($listing in $listings) {
    if (-not $Force -and $listing.photos -and $listing.photos.Count -gt 0) {
        Write-Host "  Skip (already has photo): $($listing.title)"
        continue
    }

    $match = $null
    foreach ($key in $photoMap.Keys) {
        if ($listing.title -like "*$key*") {
            $match = $photoMap[$key]
            break
        }
    }
    if (-not $match) {
        Write-Host "  No mapping: $($listing.title)"
        continue
    }

    $safeName = ($listing.title -replace '[^\w\-]', '_').Substring(0, [Math]::Min(40, ($listing.title -replace '[^\w\-]', '_').Length))
    $localFile = Join-Path $tempDir "$safeName.jpg"

    Write-Host "  $($listing.title)"
    Write-Host "    -> $($match.Label)"
    Invoke-WebRequest -Uri $match.Url -OutFile $localFile -UseBasicParsing

    $curlOut = curl.exe -s -X POST "$BaseUrl/upload" `
        -H "Authorization: Bearer $token" `
        -F "file=@$localFile;type=image/jpeg"
    $upload = $curlOut | ConvertFrom-Json
    if (-not $upload.path) {
        throw "Upload failed: $curlOut"
    }

    $body = @{ photos = @($upload.path) } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/listings/$($listing.id)" -Method PATCH `
        -Headers @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" } `
        -Body $body | Out-Null

    Write-Host "    OK"
}

Write-Host ""
Write-Host "Photos mises a jour."
