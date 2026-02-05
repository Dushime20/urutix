#!/bin/bash
# Backup and Migrate Script
# Safely runs migrations with automatic backup and rollback capability

set -e

echo "🔄 Backup and Migration Script"
echo "=============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pre-migration-$TIMESTAMP.sql"
ROLLBACK_FILE="$BACKUP_DIR/rollback-$TIMESTAMP.sql"

# Check environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}❌ Database environment variables not set!${NC}"
    echo "Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo -e "${BLUE}📊 Database: $DB_NAME@$DB_HOST${NC}"
echo ""

# Step 1: Create backup
echo "💾 Step 1: Creating database backup..."
export PGPASSWORD="$DB_PASSWORD"

if pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
    --format=custom --file="$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   Size: $BACKUP_SIZE"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Show pending migrations
echo "📋 Step 2: Checking pending migrations..."
npm run migration:show
echo ""

# Step 3: Confirm before proceeding
if [ "$AUTO_CONFIRM" != "true" ]; then
    echo -e "${YELLOW}⚠️  Ready to run migrations. Continue? (y/N)${NC}"
    read -r CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        echo "Migration cancelled by user"
        exit 0
    fi
fi

# Step 4: Run migrations
echo "🚀 Step 3: Running migrations..."
if npm run migration:run; then
    echo -e "${GREEN}✅ Migrations completed successfully!${NC}"
    MIGRATION_SUCCESS=true
else
    echo -e "${RED}❌ Migration failed!${NC}"
    MIGRATION_SUCCESS=false
fi
echo ""

# Step 5: Verify schema
if [ "$MIGRATION_SUCCESS" = true ]; then
    echo "🔍 Step 4: Verifying database schema..."
    if node scripts/check-migrations.js; then
        echo -e "${GREEN}✅ Schema verification passed!${NC}"
    else
        echo -e "${RED}❌ Schema verification failed!${NC}"
        MIGRATION_SUCCESS=false
    fi
    echo ""
fi

# Step 6: Handle failure
if [ "$MIGRATION_SUCCESS" = false ]; then
    echo -e "${YELLOW}⚠️  Migration failed. Do you want to rollback? (y/N)${NC}"
    
    if [ "$AUTO_ROLLBACK" = "true" ]; then
        ROLLBACK="y"
    else
        read -r ROLLBACK
    fi
    
    if [ "$ROLLBACK" = "y" ] || [ "$ROLLBACK" = "Y" ]; then
        echo "🔙 Rolling back database..."
        
        if pg_restore -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \
            --clean --if-exists "$BACKUP_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Rollback completed${NC}"
        else
            echo -e "${RED}❌ Rollback failed! Manual intervention required.${NC}"
            echo "Backup file: $BACKUP_FILE"
        fi
    else
        echo "Rollback skipped. Backup available at: $BACKUP_FILE"
    fi
    
    exit 1
fi

# Step 7: Create rollback script
echo "📝 Step 5: Creating rollback script..."
cat > "$ROLLBACK_FILE" << EOF
#!/bin/bash
# Rollback script for migration: $TIMESTAMP
# Created: $(date)

echo "Rolling back to backup: $BACKUP_FILE"

export PGPASSWORD="$DB_PASSWORD"
pg_restore -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" \\
    --clean --if-exists "$BACKUP_FILE"

if [ \$? -eq 0 ]; then
    echo "✅ Rollback completed successfully"
else
    echo "❌ Rollback failed"
    exit 1
fi
EOF

chmod +x "$ROLLBACK_FILE"
echo -e "${GREEN}✅ Rollback script created: $ROLLBACK_FILE${NC}"
echo ""

# Step 8: Cleanup old backups
echo "🧹 Step 6: Cleaning up old backups..."
KEEP_BACKUPS=10
OLD_BACKUPS=$(ls -t "$BACKUP_DIR"/pre-migration-*.sql 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)))

if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | xargs rm -f
    echo -e "${GREEN}✅ Cleaned up old backups (keeping last $KEEP_BACKUPS)${NC}"
else
    echo "No old backups to clean"
fi
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
echo "=============================="
echo ""
echo "📁 Files created:"
echo "   Backup: $BACKUP_FILE"
echo "   Rollback script: $ROLLBACK_FILE"
echo ""
echo "💡 To rollback if needed:"
echo "   ./$ROLLBACK_FILE"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your application"
echo "   2. Test critical functionality"
echo "   3. Monitor logs for errors"
echo ""

unset PGPASSWORD
