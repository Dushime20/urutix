# Open SQLite Database Script
Write-Host "🗄️ Opening SQLite Database..." -ForegroundColor Green

$databasePath = "$PWD\backend\database.sqlite"

if (Test-Path $databasePath) {
    Write-Host "✅ Database found at: $databasePath" -ForegroundColor Green
    
    # Try to open with DB Browser for SQLite if installed
    $dbBrowserPath = "C:\Program Files\DB Browser for SQLite\DB Browser for SQLite.exe"
    if (Test-Path $dbBrowserPath) {
        Write-Host "🚀 Opening with DB Browser for SQLite..." -ForegroundColor Yellow
        Start-Process $dbBrowserPath -ArgumentList "`"$databasePath`""
    } else {
        Write-Host "📋 DB Browser for SQLite not found. Please install it first:" -ForegroundColor Yellow
        Write-Host "1. Go to: https://sqlitebrowser.org/dl/" -ForegroundColor Cyan
        Write-Host "2. Download 'DB Browser for SQLite' for Windows" -ForegroundColor White
        Write-Host "3. Run the installer" -ForegroundColor White
        Write-Host "4. Run this script again" -ForegroundColor White
        
        Write-Host "`n📊 Database contains these tables:" -ForegroundColor Magenta
        Write-Host "  - invoice" -ForegroundColor White
        Write-Host "  - invoice_item" -ForegroundColor White
        Write-Host "  - expense" -ForegroundColor White
        Write-Host "  - payment" -ForegroundColor White
        Write-Host "  - financial_report" -ForegroundColor White
        Write-Host "  - budget" -ForegroundColor White
        Write-Host "  - tax_record" -ForegroundColor White
        
        Write-Host "`n📍 Database location: $databasePath" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ Database not found at: $databasePath" -ForegroundColor Red
    Write-Host "Please run the migration first: node backend/run-migration-simple.js" -ForegroundColor Yellow
} 