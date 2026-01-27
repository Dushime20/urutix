
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';
import { config } from 'dotenv';
import { RolePermissionService } from '../services/permission.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { UserPermissionOverride } from '../entities/user-permission-override.entity';

config();

const dataSource = new DataSource(databaseConfig as any);

async function seed() {
    try {
        console.log('Connecting to database...');
        await dataSource.initialize();
        console.log('Connected!');

        // Manually constructing the service with dependencies
        // Since we are not in NestJS context, we pass the TypeORM repositories directly
        const roleRepo = dataSource.getRepository(Role);
        const permissionRepo = dataSource.getRepository(Permission);
        const overrideRepo = dataSource.getRepository(UserPermissionOverride);

        // We need to mock the RolePermissionService or extract the seed logic.
        // To keep it simple and avoid dependency usage (like DiscoveryService),
        // we will replicate the basic seed logic here using a simplified customized approach.

        console.log('Seeding Permissions...');

        // 1. Create Basic Roles
        const roles = ['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'DISPATCHER', 'DRIVER', 'TRUCK_OWNER', 'CARGO_OWNER'];

        for (const roleName of roles) {
            let role = await roleRepo.findOne({ where: { name: roleName } });
            if (!role) {
                role = roleRepo.create({
                    name: roleName,
                    description: `System role: ${roleName}`,
                    isSystem: true
                });
                await roleRepo.save(role);
                console.log(`Created Role: ${roleName}`);
            } else {
                console.log(`Role exists: ${roleName}`);
            }
        }

        // 2. Create Basic Permissions (Sample set)
        const permissions = [
            { resource: 'users', action: 'create', category: 'user_management' },
            { resource: 'users', action: 'read', category: 'user_management' },
            { resource: 'users', action: 'update', category: 'user_management' },
            { resource: 'users', action: 'delete', category: 'user_management' },
            { resource: 'tenants', action: 'manage', category: 'system' },
            { resource: 'monitoring', action: 'view', category: 'system' },
        ];

        for (const p of permissions) {
            let perm = await permissionRepo.findOne({ where: { resource: p.resource, action: p.action } });
            if (!perm) {
                perm = permissionRepo.create({ ...p, description: `${p.action} ${p.resource}` });
                await permissionRepo.save(perm);
                console.log(`Created Permission: ${p.action} ${p.resource}`);
            }
        }

        // 3. Assign all to SUPER_ADMIN
        const superAdmin = await roleRepo.findOne({ where: { name: 'SUPER_ADMIN' }, relations: ['permissions'] });
        const allPerms = await permissionRepo.find();

        if (superAdmin) {
            superAdmin.permissions = allPerms;
            await roleRepo.save(superAdmin);
            console.log('Assigned all permissions to SUPER_ADMIN');
        }

        console.log('Done!');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}

seed();
