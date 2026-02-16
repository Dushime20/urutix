# Clear All Caches - Broker Dashboard Fix
# Run this script to clear all frontend caches

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CLEARING ALL FRONTEND CACHES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = ".\frontend"

# Check if frontend directory exists
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    Write-Host "Please run this script from the urutix root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "📁 Working directory: $frontendPath" -ForegroundColor Green
Write-Host ""

# Function to safely remove directory
function Remove-DirectorySafely {
    param($path, $name)
    
    if (Test-Path $path) {
        Write-Host "🗑️  Removing $name..." -ForegroundColor Yellow
        try {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            Write-Host "✅ $name cleared successfully" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Warning: Could not remove $name - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  $name not found (already clean)" -ForegroundColor Gray
    }
}

# Clear Vite cache in frontend root
Remove-DirectorySafely "$frontendPath\.vite" "Vite cache (.vite)"

# Clear Vite cache in node_modules
Remove-DirectorySafely "$frontendPath\node_modules\.vite" "Vite cache (node_modules/.vite)"

# Clear dist folder
Remove-DirectorySafely "$frontendPath\dist" "Build output (dist)"

# Clear .turbo cache if exists
Remove-DirectorySafely "$frontendPath\.turbo" "Turbo cache (.turbo)"

# Clear TypeScript build info
Remove-DirectorySafely "$frontendPath\tsconfig.tsbuildinfo" "TypeScript build info"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CACHE CLEARING COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Clear your browser cache:" -ForegroundColor White
Write-Host "   - Press Ctrl + Shift + Delete" -ForegroundColor Gray
Write-Host "   - Select 'Cached images and files'" -ForegroundColor Gray
Write-Host "   - Click 'Clear data'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Or do a hard refresh:" -ForegroundColor White
Write-Host "   - Press Ctrl + Shift + R" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Or use Incognito mode:" -ForegroundColor White
Write-Host "   - Press Ctrl + Shift + N" -ForegroundColor Gray
Write-Host "   - Navigate to http://localhost:5173/dashboard/broker" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Restart the dev server if needed:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ The broker dashboard has been updated from dev branch!" -ForegroundColor Green
Write-Host "   You should now see the modern UI with gradient headers." -ForegroundColor Green
Write-Host ""
