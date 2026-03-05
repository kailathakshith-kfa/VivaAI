# VivaAI – Development Startup Script
# Run this from the project root: .\start.ps1

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  VivaAI – AI Video Explanation Evaluator" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# ── Backend ──────────────────────────────────────────────────────────────────
Write-Host "`n[1/2] Starting FastAPI backend..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"

if (-not (Test-Path "$backendPath\venv")) {
    Write-Host "     Creating Python virtual environment..." -ForegroundColor Gray
    python -m venv "$backendPath\venv"
}

$pip    = "$backendPath\venv\Scripts\pip.exe"
$uvicorn = "$backendPath\venv\Scripts\uvicorn.exe"

if (-not (Test-Path $uvicorn)) {
    Write-Host "     Installing Python dependencies (this may take a few minutes on first run)..." -ForegroundColor Gray
    & $pip install -r "$backendPath\requirements.txt" --quiet
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .\venv\Scripts\uvicorn.exe main:app --reload --host 0.0.0.0 --port 8000" -WindowStyle Normal

Write-Host "     ✓ Backend starting at http://localhost:8000" -ForegroundColor Green

# ── Frontend ─────────────────────────────────────────────────────────────────
Write-Host "`n[2/2] Starting Next.js frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host "     ✓ Frontend starting at http://localhost:3000" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  App will be ready at: http://localhost:3000" -ForegroundColor White
Write-Host "  API docs available at: http://localhost:8000/docs" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
