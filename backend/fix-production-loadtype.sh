#!/bin/bash
# Bash script to fix missing loadType column in production database

echo "🔧 Fixing missing loadType column in production database..."

# Check if we're in the backend directory
if [ ! -f "fix-missing-loadtype-column.sql" ]; then
    echo "❌ Error: fix-missing-loadtype-column.sql not found. Make sure you're in the backend directory."
    exit 1
fi

# Get database connection details from environment or prompt
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

if [ -z "$DB_NAME" ]; then
    read -p "Enter database name: " DB_NAME
fi

if [ -z "$DB_USER" ]; then
    read -p "Enter database user: " DB_USER
fi

if [ -z "$DB_PASSWORD" ]; then
    read -s -p "Enter database password: " DB_PASSWORD
    echo
fi

echo "📊 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Set PGPASSWORD environment variable
export PGPASSWORD="$DB_PASSWORD"

# First, check if the column exists
echo "🔍 Checking if loadType column exists..."
CHECK_RESULT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'loadType';")

if [[ "$CHECK_RESULT" == *"loadType"* ]]; then
    echo "✅ loadType column already exists!"
    exit 0
fi

echo "❌ loadType column is missing. Applying fix..."

# Run the fix script
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "fix-missing-loadtype-column.sql"; then
    echo "✅ Successfully added loadType column!"
    
    # Verify the fix
    echo "🔍 Verifying the fix..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'loads' AND column_name = 'loadType';"
    
    echo "🎉 Database fix completed successfully!"
    echo "💡 You can now restart your application server."
else
    echo "❌ Failed to apply database fix. Check the error messages above."
    exit 1
fi

# Clear the password from environment
unset PGPASSWORD