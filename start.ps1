Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MYTHISOFT CRM - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project folder: $root" -ForegroundColor Gray
Write-Host ""

# Free stuck ports from old runs
foreach ($port in 5000, 5173) {
  $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique
  foreach ($procId in $pids) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Write-Host "Freed port $port (was PID $procId)" -ForegroundColor Yellow
  }
}
Start-Sleep -Seconds 2

# Check Atlas config
$envFile = Join-Path $root "server\.env"
if (Test-Path $envFile) {
  $envContent = Get-Content $envFile -Raw
  if ($envContent -notmatch 'MONGODB_ATLAS_CLUSTER=cluster') {
    Write-Host "NOTE: MONGODB_ATLAS_CLUSTER may be empty - check server\.env" -ForegroundColor Yellow
    Write-Host ""
  }
}

Write-Host "Opening backend terminal (port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; Write-Host 'BACKEND - port 5000' -ForegroundColor Cyan; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Opening frontend terminal (port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; Write-Host 'FRONTEND - port 5173' -ForegroundColor Cyan; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Open: http://localhost:5173" -ForegroundColor Green
Write-Host "  Login: admin@mythisoft.com / admin123" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host 'IMPORTANT: Always run from E:\Myprojects\mythisoft-crm' -ForegroundColor Yellow
Write-Host '  NOT from E:\Myprojects (wrong folder)' -ForegroundColor Yellow
Write-Host ""
