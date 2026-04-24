# Clear Vite Cache Script
# Run this script to fix module export errors

Write-Host "Clearing Vite Cache..." -ForegroundColor Cyan

# Check if frontend directory exists
if (Test-Path "frontend") {
    # Clear Vite cache
    if (Test-Path "frontend/node_modules/.vite") {
        Write-Host "Removing frontend/node_modules/.vite..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "frontend/node_modules/.vite"
        Write-Host "Vite cache cleared!" -ForegroundColor Green
    } else {
        Write-Host "No Vite cache found (already clean)" -ForegroundColor Gray
    }
    
    # Clear dist folder if it exists
    if (Test-Path "frontend/dist") {
        Write-Host "Removing frontend/dist..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "frontend/dist"
        Write-Host "Dist folder cleared!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Cache cleared successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. cd frontend" -ForegroundColor White
    Write-Host "2. npm run dev" -ForegroundColor White
    Write-Host "3. Hard refresh your browser (Ctrl+Shift+R)" -ForegroundColor White
    
} else {
    Write-Host "Error: frontend directory not found!" -ForegroundColor Red
    Write-Host "Make sure you are running this script from the project root." -ForegroundColor Yellow
}
