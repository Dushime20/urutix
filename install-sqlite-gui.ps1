# SQLite GUI Installer Script
Write-Host "🗄️ Installing DB Browser for SQLite..." -ForegroundColor Green

# Create temp directory
$tempDir = "$env:TEMP\sqlite-gui"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Download URL for the latest version
$downloadUrl = "https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.12.2/DB.Browser.for.SQLite.v3.12.2.x64.msi"
$installerPath = "$tempDir\DB.Browser.for.SQLite.msi"

Write-Host "📥 Downloading DB Browser for SQLite..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath
    Write-Host "✅ Download completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed. Trying alternative method..." -ForegroundColor Red
    
    # Alternative: Download from official website
    $altUrl = "https://sqlitebrowser.org/dl/"
    Write-Host "🌐 Please visit: $altUrl" -ForegroundColor Cyan
    Write-Host "📋 Manual installation steps:" -ForegroundColor Yellow
    Write-Host "1. Go to https://sqlitebrowser.org/dl/" -ForegroundColor White
    Write-Host "2. Download 'DB Browser for SQLite' for Windows" -ForegroundColor White
    Write-Host "3. Run the installer" -ForegroundColor White
    Write-Host "4. Open the database at: $PWD\backend\database.sqlite" -ForegroundColor White
    return
}

# Install the application
Write-Host "🔧 Installing DB Browser for SQLite..." -ForegroundColor Yellow
try {
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installerPath`" /quiet"
    Write-Host "✅ Installation completed!" -ForegroundColor Green
} catch {
    Write-Host "❌ Installation failed. Please install manually." -ForegroundColor Red
}

# Clean up
Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host "📁 Database location: $PWD\backend\database.sqlite" -ForegroundColor Cyan
Write-Host "🚀 To open the database:" -ForegroundColor Yellow
Write-Host "1. Open 'DB Browser for SQLite'" -ForegroundColor White
Write-Host "2. Click 'Open Database'" -ForegroundColor White
Write-Host "3. Navigate to: $PWD\backend\database.sqlite" -ForegroundColor White
Write-Host "4. Click 'Open'" -ForegroundColor White

Write-Host "📊 Tables you can explore:" -ForegroundColor Magenta
Write-Host "  - invoice" -ForegroundColor White
Write-Host "  - invoice_item" -ForegroundColor White
Write-Host "  - expense" -ForegroundColor White
Write-Host "  - payment" -ForegroundColor White
Write-Host "  - financial_report" -ForegroundColor White
Write-Host "  - budget" -ForegroundColor White
Write-Host "  - tax_record" -ForegroundColor White 