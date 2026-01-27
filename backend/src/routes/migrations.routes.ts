import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const router = Router();

// This should be protected with admin authentication in production
export function createMigrationRouter(pool: Pool) {
    /**
     * POST /api/migrations/run-rbac
     * Run the RBAC migration
     * WARNING: This should only be accessible to SUPER_ADMIN users
     */
    router.post('/run-rbac', async (req: Request, res: Response) => {
        const client = await pool.connect();

        try {
            console.log('🚀 Starting RBAC Migration via API...');

            // Check if tables already exist
            const checkTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      `);

            if (checkTables.rows.length === 4) {
                return res.status(400).json({
                    success: false,
                    error: 'Migration already run',
                    message: 'All RBAC tables already exist. Migration has been previously executed.',
                    existingTables: checkTables.rows.map(r => r.table_name),
                });
            }

            // Read migration file
            const migrationPath = path.join(__dirname, '..', '..', '..', 'migrations', '003_rbac_permissions_system.sql');

            if (!fs.existsSync(migrationPath)) {
                return res.status(500).json({
                    success: false,
                    error: 'Migration file not found',
                    message: `Migration file not found at: ${migrationPath}`,
                });
            }

            const sql = fs.readFileSync(migrationPath, 'utf8');

            // Execute migration
            await client.query(sql);

            // Verify tables were created
            const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
        ORDER BY table_name
      `);

            // Count permissions
            const permCount = await client.query('SELECT COUNT(*) as count FROM permissions');
            const roleMappingCount = await client.query('SELECT COUNT(*) as count FROM role_permissions');

            // Get role breakdown
            const roleBreakdown = await client.query(`
        SELECT role, COUNT(*) as permission_count
        FROM role_permissions
        GROUP BY role
        ORDER BY role
      `);

            console.log('✅ RBAC Migration completed successfully via API');

            return res.status(200).json({
                success: true,
                message: 'RBAC migration completed successfully',
                data: {
                    tablesCreated: tablesResult.rows.map(r => r.table_name),
                    permissionsSeeded: parseInt(permCount.rows[0].count),
                    roleMappings: parseInt(roleMappingCount.rows[0].count),
                    roleBreakdown: roleBreakdown.rows,
                },
            });

        } catch (error: any) {
            console.error('❌ Migration failed:', error);

            return res.status(500).json({
                success: false,
                error: 'Migration failed',
                message: error.message,
                detail: error.detail || null,
                hint: error.hint || null,
            });
        } finally {
            client.release();
        }
    });

    /**
     * GET /api/migrations/rbac-status
     * Check RBAC migration status
     */
    router.get('/rbac-status', async (req: Request, res: Response) => {
        const client = await pool.connect();

        try {
            const checkTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
        ORDER BY table_name
      `);

            const existingTables = checkTables.rows.map(r => r.table_name);
            const allTablesExist = existingTables.length === 4;

            let stats = null;

            if (allTablesExist) {
                const permCount = await client.query('SELECT COUNT(*) as count FROM permissions');
                const roleMappingCount = await client.query('SELECT COUNT(*) as count FROM role_permissions');
                const userPermCount = await client.query('SELECT COUNT(*) as count FROM user_permissions');

                stats = {
                    permissions: parseInt(permCount.rows[0].count),
                    roleMappings: parseInt(roleMappingCount.rows[0].count),
                    userPermissions: parseInt(userPermCount.rows[0].count),
                };
            }

            return res.status(200).json({
                success: true,
                data: {
                    migrationComplete: allTablesExist,
                    existingTables,
                    missingTables: ['permissions', 'role_permissions', 'user_permissions', 'permission_audit_log']
                        .filter(t => !existingTables.includes(t)),
                    stats,
                },
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to check migration status',
                message: error.message,
            });
        } finally {
            client.release();
        }
    });

    return router;
}
