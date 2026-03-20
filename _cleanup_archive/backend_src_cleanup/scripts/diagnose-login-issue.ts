import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { config } from 'dotenv';

config();

async function diagnoseLoginIssue() {
  // Store config values for logging
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5433', 10);
  const dbUsername = process.env.DB_USERNAME || 'postgres';
  const dbPassword = process.env.DB_PASSWORD || '123456';
  const dbName = process.env.DB_NAME || 'urutix';

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: dbName,
    synchronize: false,
    logging: false,
    entities: [User],
  });

  try {
    console.log('🔍 Diagnosing Login Issue...\n');
    console.log('📡 Testing database connection...');
    console.log(`   Host: ${dbHost}`);
    console.log(`   Port: ${dbPort}`);
    console.log(`   Database: ${dbName}`);
    console.log(`   Username: ${dbUsername}\n`);

    await dataSource.initialize();
    console.log('✅ Database connection successful!\n');

    const userRepository = dataSource.getRepository(User);

    // Get email from command line argument or use default
    const email = process.argv[2] || null;

    if (email) {
      console.log(`🔍 Checking user: ${email}\n`);
      const user = await userRepository.findOne({
        where: { email },
        relations: ['profile'],
      });

      if (!user) {
        console.log('❌ User not found in database');
        console.log('\n💡 Possible solutions:');
        console.log('   1. User may not exist - try registering first');
        console.log('   2. Check if email is correct');
        console.log('   3. Verify database contains user data');
      } else {
        console.log('✅ User found!\n');
        console.log('📋 User Details:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Email Verified: ${user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : 'Not verified'}`);
        console.log(`   Login Attempts: ${user.loginAttempts}`);
        console.log(`   Locked Until: ${user.lockedUntil ? user.lockedUntil.toISOString() : 'Not locked'}`);
        console.log(`   Has Password Hash: ${!!user.passwordHash}`);
        console.log(`   Tenant ID: ${user.tenantId}`);
        if (user.profile) {
          console.log(`   Profile: ${user.profile.firstName} ${user.profile.lastName}`);
        }

        if (user.status !== 'ACTIVE') {
          console.log('\n⚠️  WARNING: User status is not ACTIVE');
          console.log('   This user cannot login until the account is activated.');
          console.log('   Status:', user.status);
          if (user.status === 'PENDING_VERIFICATION') {
            console.log('   Solution: User needs to verify their email address');
          }
        }

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          const remainingMinutes = Math.ceil(
            (user.lockedUntil.getTime() - Date.now()) / 1000 / 60,
          );
          console.log(`\n🔒 Account is locked for ${remainingMinutes} more minutes`);
        }

        if (!user.passwordHash) {
          console.log('\n⚠️  WARNING: User has no password hash');
          console.log('   This user cannot login. Password needs to be set.');
        }
      }
    } else {
      console.log('📊 Listing all users in database...\n');
      const users = await userRepository.find({
        relations: ['profile'],
        take: 20, // Limit to first 20 users
      });

      if (users.length === 0) {
        console.log('❌ No users found in database');
        console.log('\n💡 Solution: Create a user by registering or using a seed script');
      } else {
        console.log(`✅ Found ${users.length} user(s):\n`);
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email}`);
          console.log(`   Status: ${user.status}`);
          console.log(`   Role: ${user.role}`);
          console.log(`   Has Password: ${!!user.passwordHash}`);
          if (user.profile) {
            console.log(`   Name: ${user.profile.firstName} ${user.profile.lastName}`);
          }
          console.log('');
        });
      }
    }

    await dataSource.destroy();
    console.log('✅ Diagnosis complete!');
  } catch (error: any) {
    console.error('\n❌ Error during diagnosis:');
    console.error(`   Message: ${error.message}`);
    
    if (error.message?.includes('ECONNREFUSED')) {
      console.error('\n💡 Database connection refused. Check:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. Database credentials in .env file');
      console.error('   3. Database host and port are correct');
    } else if (error.message?.includes('password authentication failed')) {
      console.error('\n💡 Authentication failed. Check:');
      console.error('   1. DB_PASSWORD in .env file is correct');
      console.error('   2. PostgreSQL user has correct permissions');
    } else if (error.message?.includes('database') && error.message?.includes('does not exist')) {
      console.error('\n💡 Database does not exist. Check:');
      console.error('   1. DB_NAME in .env file is correct');
      console.error('   2. Database has been created');
    }
    
    process.exit(1);
  }
}

diagnoseLoginIssue();

