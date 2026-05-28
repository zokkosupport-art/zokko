$backend = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"
Set-Location -LiteralPath $backend
if (Get-Command python -ErrorAction SilentlyContinue) {
    python -m uvicorn server:app --reload --port 8000
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    py -3 -m uvicorn server:app --reload --port 8000
} else {
    python3 -m uvicorn server:app --reload --port 8000
}
