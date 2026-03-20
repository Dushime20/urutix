# PowerShell script to fix missing loadType column in production database
# Run this script on your production server

Write-Host "🔧 Fixing missing loadType column in production database..." -ForegroundColor Yellow

# Check if we're in the backend directory
if (-not (Test-Path "fix-missing-loadtype-column.sql")) {
    Write-Host "❌ Error: fix-missing-loadtype-column.sql not found. Make sure you're in the backend directory." -ForegroundColor Red
    exit 1
}

# Get database connection details from environment or prompt
$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_NAME = $env:DB_NAME
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD

if (-not $DB_HOST) {
    $DB_HOST = Read-Host "Enter database host (default: localhost)"
    if (-not $DB_HOST) { $DB_HOST = "localhost" }
}

if (-not $DB_PORT) {
    $DB_PORT = Read-Host "Enter database port (default: 5432)"
    if (-not $DB_PORT) { $DB_PORT = "5432" }
}

if (-not $DB_NAME) {
    $DB_NAME = Read-Host "Enter database name"
}

if (-not $DB_USER) {
    $DB_USER = Read-Host "Enter database user"
}

if (-not $DB_PASSWORD) {
    $DB_PASSWORD = Read-Host "Enter database password" -AsSecureString
    $DB_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($DB_PASSWORD))
}

Write-Host "📊 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME" -ForegroundColor Blue

# Set PGPASSWORD environment variable
$env:PGPASSWORD = $DB_PASSWORD

try {
    # First, check if the column exists
    Write-Host "🔍 Checking if loadType column exists..." -ForegroundColor Blue
    $checkResult = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'loadType';"
    
    if ($checkResult -match "loadType") {
        Write-Host "✅ loadType column already exists!" -ForegroundColor Green
        exit 0
    }
    
    Write-Host "❌ loadType column is missing. Applying fix..." -ForegroundColor Yellow
    
    # Run the fix script
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "fix-missing-loadtype-column.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Successfully added loadType column!" -ForegroundColor Green
        
        # Verify the fix
        Write-Host "🔍 Verifying the fix..." -ForegroundColor Blue
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'loadType';"
        
        Write-Host "🎉 Database fix completed successfully!" -ForegroundColor Green
        Write-Host "💡 You can now restart your application server." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Failed to apply database fix. Check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clear the password from environment
    $env:PGPASSWORD = $null
}