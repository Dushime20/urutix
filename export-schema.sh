#!/bin/bash

# Export Database Schema Script
# This script exports the complete database schema from a running Docker container

echo "================================================================================"
echo "DATABASE SCHEMA EXPORT"
echo "================================================================================"
echo ""

# Check if docker-compose is running
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "urutix_db_dev"; then
    echo "❌ Error: Development database container is not running"
    echo "   Please start it with: docker-compose -f docker-compose.dev.yml up -d"
    exit 1
fi

echo "📤 Exporting schema from development database..."
echo ""

# Export schema (structure only, no data)
docker-compose -f docker-compose.dev.yml exec -T postgres pg_dump \
    -U postgres \
    -d urutix \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-comments \
    > database/init/01-init.sql

if [ $? -eq 0 ]; then
    # Count tables
    TABLE_COUNT=$(grep -c "CREATE TABLE" database/init/01-init.sql)
    FILE_SIZE=$(wc -l < database/init/01-init.sql)
    
    echo "✅ Schema exported successfully!"
    echo ""
    echo "📊 Statistics:"
    echo "   - Tables: $TABLE_COUNT"
    echo "   - SQL lines: $FILE_SIZE"
    echo "   - Output: database/init/01-init.sql"
    echo ""
    echo "Next steps:"
    echo "1. Review the schema file"
    echo "2. Test: docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up"
    echo "3. Commit: git add database/init/01-init.sql"
else
    echo "❌ Error exporting schema"
    exit 1
fi
