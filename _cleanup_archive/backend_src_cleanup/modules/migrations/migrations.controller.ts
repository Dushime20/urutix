import { Controller, Post, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Controller('migrations')
export class MigrationsController {
    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) { }

    @Get('rbac-status')
    async checkRBACStatus() {
        const queryRunner = this.connection.createQueryRunner();

        try {
            const checkTables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
        ORDER BY table_name
      `);

            const existingTables = checkTables.map((r: any) => r.table_name);
            const allTablesExist = existingTables.length === 4;

            let stats = null;

            if (allTablesExist) {
                const permCount = await queryRunner.query('SELECT COUNT(*) as count FROM permissions');
                const roleMappingCount = await queryRunner.query('SELECT COUNT(*) as count FROM role_permissions');
                const userPermCount = await queryRunner.query('SELECT COUNT(*) as count FROM user_permissions');

                stats = {
                    permissions: parseInt(permCount[0].count),
                    roleMappings: parseInt(roleMappingCount[0].count),
                    userPermissions: parseInt(userPermCount[0].count),
                };
            }

            return {
                success: true,
                data: {
                    migrationComplete: allTablesExist,
                    existingTables,
                    missingTables: ['permissions', 'role_permissions', 'user_permissions', 'permission_audit_log']
                        .filter(t => !existingTables.includes(t)),
                    stats,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: 'Failed to check migration status',
                message: error.message,
            };
        } finally {
            await queryRunner.release();
        }
    }

    @Post('run-rbac')
    async runRBACMigration() {
        const queryRunner = this.connection.createQueryRunner();

        try {
            console.log('🚀 Starting RBAC Migration via API...');

            // Check if tables already exist
            const checkTables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
      `);

            if (checkTables.length === 4) {
                return {
                    success: false,
                    error: 'Migration already run',
                    message: 'All RBAC tables already exist. Migration has been previously executed.',
                    existingTables: checkTables.map((r: any) => r.table_name),
                };
            }

            // Read migration file
            const migrationPath = path.join(process.cwd(), 'migrations', '003_rbac_permissions_system.sql');

            if (!fs.existsSync(migrationPath)) {
                return {
                    success: false,
                    error: 'Migration file not found',
                    message: `Migration file not found at: ${migrationPath}`,
                };
            }

            const sql = fs.readFileSync(migrationPath, 'utf8');

            // Execute migration
            await queryRunner.query(sql);

            // Verify tables were created
            const tablesResult = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('permissions', 'role_permissions', 'user_permissions', 'permission_audit_log')
        ORDER BY table_name
      `);

            // Count permissions
            const permCount = await queryRunner.query('SELECT COUNT(*) as count FROM permissions');
            const roleMappingCount = await queryRunner.query('SELECT COUNT(*) as count FROM role_permissions');

            // Get role breakdown
            const roleBreakdown = await queryRunner.query(`
        SELECT role, COUNT(*) as permission_count
        FROM role_permissions
        GROUP BY role
        ORDER BY role
      `);

            console.log('✅ RBAC Migration completed successfully via API');

            return {
                success: true,
                message: 'RBAC migration completed successfully',
                data: {
                    tablesCreated: tablesResult.map((r: any) => r.table_name),
                    permissionsSeeded: parseInt(permCount[0].count),
                    roleMappings: parseInt(roleMappingCount[0].count),
                    roleBreakdown: roleBreakdown,
                },
            };

        } catch (error: any) {
            console.error('❌ Migration failed:', error);

            return {
                success: false,
                error: 'Migration failed',
                message: error.message,
                detail: error.detail || null,
                hint: error.hint || null,
            };
        } finally {
            await queryRunner.release();
        }
    }
}
