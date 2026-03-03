# Install export dependencies for Driver Dashboard
Write-Host "Installing export dependencies..." -ForegroundColor Green

# Navigate to frontend directory
Set-Location -Path "urutix/frontend"

# Install xlsx for Excel export
npm install xlsx

Write-Host "`nDependencies installed successfully!" -ForegroundColor Green
Write-Host "- xlsx: Excel file generation" -ForegroundColor Cyan
Write-Host "- jspdf: Already installed (PDF generation)" -ForegroundColor Cyan
Write-Host "- jspdf-autotable: Already installed (PDF tables)" -ForegroundColor Cyan

Write-Host "`nYou can now use the enhanced export features!" -ForegroundColor Yellow
