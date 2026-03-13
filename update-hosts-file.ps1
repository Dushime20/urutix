# PowerShell script to update Windows hosts file with tenant subdomains
# Run as Administrator: Right-click PowerShell -> Run as Administrator

$hostsPath = "C:\Windows\System32\drivers\etc\hosts"

# Tenant subdomains to add
$subdomains = @(
    "daviduruti.localhost",
    "isimbiruti.localhost",
    "deburutix.localhost",
    "debbiurutix.localhost",
    "deb.localhost",
    "debbie.localhost",
    "deborahurutix.localhost",
    "davidurutix.localhost",
    "deborah.urutixcom.localhost",
    "urutix.localhost",
    "demo-b.localhost",
    "gasa.localhost",
    "admin.localhost"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URUTIX SUBDOMAIN HOSTS FILE UPDATER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click PowerShell" -ForegroundColor Yellow
    Write-Host "2. Select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host "3. Navigate to this directory and run the script again" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Reading current hosts file..." -ForegroundColor Yellow
$hostsContent = Get-Content $hostsPath

# Backup hosts file
$backupPath = "$hostsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $hostsPath $backupPath
Write-Host "Backup created: $backupPath" -ForegroundColor Green
Write-Host ""

# Check which entries already exist
$existingEntries = @()
$newEntries = @()

foreach ($subdomain in $subdomains) {
    $entry = "127.0.0.1 $subdomain"
    $exists = $hostsContent | Where-Object { $_ -match [regex]::Escape($subdomain) }
    
    if ($exists) {
        $existingEntries += $subdomain
    } else {
        $newEntries += $entry
    }
}

if ($existingEntries.Count -gt 0) {
    Write-Host "Already configured ($($existingEntries.Count)):" -ForegroundColor Green
    foreach ($entry in $existingEntries) {
        Write-Host "  ✓ $entry" -ForegroundColor Gray
    }
    Write-Host ""
}

if ($newEntries.Count -eq 0) {
    Write-Host "All subdomain entries already exist in hosts file!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now access tenants at:" -ForegroundColor Cyan
    foreach ($subdomain in $subdomains) {
        Write-Host "  http://$subdomain:5173" -ForegroundColor White
    }
} else {
    Write-Host "Adding new entries ($($newEntries.Count)):" -ForegroundColor Yellow
    
    # Add Urutix section marker if not exists
    if (-not ($hostsContent | Where-Object { $_ -match "# Urutix Tenant Subdomains" })) {
        Add-Content $hostsPath "`n# Urutix Tenant Subdomains"
    }
    
    # Add new entries
    foreach ($entry in $newEntries) {
        Add-Content $hostsPath $entry
        Write-Host "  + $entry" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Hosts file updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now access tenants at:" -ForegroundColor Cyan
    foreach ($subdomain in $subdomains) {
        Write-Host "  http://$subdomain:5173" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Restart backend: cd backend; npm run start:dev" -ForegroundColor Yellow
Write-Host "2. Start frontend: cd frontend; npm run dev" -ForegroundColor Yellow
Write-Host "3. Test subdomain: http://gasa.localhost:5173" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
