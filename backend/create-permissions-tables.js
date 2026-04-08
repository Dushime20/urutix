const { Client } = require('pg');
require('dotenv').config();

async function createPermissionsTables() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'urutix_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Create permissions table
    console.log('\n📝 Creating permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) UNIQUE NOT NULL,
        resource VARCHAR(100) NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
      );
    `);
    console.log('✅ permissions table created');

    // Create role_permissions table
    console.log('\n📝 Creating role_permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role VARCHAR(50) NOT NULL,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(role, permission_id)
      );
    `);
    console.log('✅ role_permissions table created');

    // Create user_permissions table
    console.log('\n📝 Creating user_permissions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        granted BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, permission_id)
      );
    `);
    console.log('✅ user_permissions table created');

    // Create indexes
    console.log('\n📝 Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
      CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);
      CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
      CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
    `);
    console.log('✅ Indexes created');

    // Insert default permissions
    console.log('\n📝 Inserting default permissions...');
    const defaultPermissions = [
      // Cargo permissions
      { name: 'cargo:create', resource: 'cargo', action: 'create', description: 'Create new cargo', category: 'cargo' },
      { name: 'cargo:view', resource: 'cargo', action: 'view', description: 'View cargo details', category: 'cargo' },
      { name: 'cargo:update', resource: 'cargo', action: 'update', description: 'Update cargo information', category: 'cargo' },
      { name: 'cargo:delete', resource: 'cargo', action: 'delete', description: 'Delete cargo', category: 'cargo' },
      
      // Load permissions
      { name: 'load:create', resource: 'load', action: 'create', description: 'Create new load', category: 'load' },
      { name: 'load:view', resource: 'load', action: 'view', description: 'View load details', category: 'load' },
      { name: 'load:update', resource: 'load', action: 'update', description: 'Update load information', category: 'load' },
      { name: 'load:delete', resource: 'load', action: 'delete', description: 'Delete load', category: 'load' },
      
      // Trip permissions
      { name: 'trip:create', resource: 'trip', action: 'create', description: 'Create new trip', category: 'trip' },
      { name: 'trip:view', resource: 'trip', action: 'view', description: 'View trip details', category: 'trip' },
      { name: 'trip:update', resource: 'trip', action: 'update', description: 'Update trip information', category: 'trip' },
      { name: 'trip:delete', resource: 'trip', action: 'delete', description: 'Delete trip', category: 'trip' },
      
      // User permissions
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create new user', category: 'user' },
      { name: 'user:view', resource: 'user', action: 'view', description: 'View user details', category: 'user' },
      { name: 'user:update', resource: 'user', action: 'update', description: 'Update user information', category: 'user' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete user', category: 'user' },
      
      // Payment permissions
      { name: 'payment:create', resource: 'payment', action: 'create', description: 'Create payment', category: 'payment' },
      { name: 'payment:view', resource: 'payment', action: 'view', description: 'View payment details', category: 'payment' },
      { name: 'payment:approve', resource: 'payment', action: 'approve', description: 'Approve payment', category: 'payment' },
      
      // Report permissions
      { name: 'report:view', resource: 'report', action: 'view', description: 'View reports', category: 'report' },
      { name: 'report:generate', resource: 'report', action: 'generate', description: 'Generate reports', category: 'report' },
      
      // Settings permissions
      { name: 'settings:view', resource: 'settings', action: 'view', description: 'View settings', category: 'settings' },
      { name: 'settings:update', resource: 'settings', action: 'update', description: 'Update settings', category: 'settings' },
    ];

    for (const perm of defaultPermissions) {
      await client.query(`
        INSERT INTO permissions (name, resource, action, description, category)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (name) DO NOTHING
      `, [perm.name, perm.resource, perm.action, perm.description, perm.category]);
    }
    console.log(`✅ Inserted ${defaultPermissions.length} default permissions`);

    // Assign permissions to roles
    console.log('\n📝 Assigning permissions to roles...');
    
    // Get all permission IDs
    const permsResult = await client.query('SELECT id, name FROM permissions');
    const permMap = {};
    permsResult.rows.forEach(row => {
      permMap[row.name] = row.id;
    });

    // CARGO_OWNER permissions
    const cargoOwnerPerms = [
      'cargo:create', 'cargo:view', 'cargo:update', 'cargo:delete',
      'load:view', 'trip:view', 'payment:view', 'report:view', 'settings:view'
    ];
    
    for (const permName of cargoOwnerPerms) {
      if (permMap[permName]) {
        await client.query(`
          INSERT INTO role_permissions (role, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role, permission_id) DO NOTHING
        `, ['CARGO_OWNER', permMap[permName]]);
      }
    }
    console.log('✅ CARGO_OWNER permissions assigned');

    // TRUCK_OWNER permissions
    const truckOwnerPerms = [
      'load:view', 'trip:view', 'trip:update', 'user:view', 'payment:view', 'report:view', 'settings:view'
    ];
    
    for (const permName of truckOwnerPerms) {
      if (permMap[permName]) {
        await client.query(`
          INSERT INTO role_permissions (role, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role, permission_id) DO NOTHING
        `, ['TRUCK_OWNER', permMap[permName]]);
      }
    }
    console.log('✅ TRUCK_OWNER permissions assigned');

    // DRIVER permissions
    const driverPerms = [
      'trip:view', 'trip:update', 'settings:view'
    ];
    
    for (const permName of driverPerms) {
      if (permMap[permName]) {
        await client.query(`
          INSERT INTO role_permissions (role, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (role, permission_id) DO NOTHING
        `, ['DRIVER', permMap[permName]]);
      }
    }
    console.log('✅ DRIVER permissions assigned');

    // Verify tables
    console.log('\n📊 Verifying tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('permissions', 'role_permissions', 'user_permissions')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Count records
    const permCount = await client.query('SELECT COUNT(*) FROM permissions');
    const rolePermCount = await client.query('SELECT COUNT(*) FROM role_permissions');
    
    console.log('\n📊 Records:');
    console.log(`  - Permissions: ${permCount.rows[0].count}`);
    console.log(`  - Role Permissions: ${rolePermCount.rows[0].count}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error creating permissions tables:', error);
    throw error;
  } finally {
    await client.end();
  }
}

createPermissionsTables()
  .then(() => {
    console.log('\n🎉 Permissions tables created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
