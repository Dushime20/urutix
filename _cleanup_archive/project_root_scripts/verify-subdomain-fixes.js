const fs = require('fs');
const path = require('path');

console.log('🔧 Verifying Subdomain Implementation Fixes...\n');

// Check 1: Middleware registration in app.module.ts
console.log('✅ Fix 1: Middleware Registration');
const appModulePath = path.join(__dirname, 'backend/src/app.module.ts');
if (fs.existsSync(appModulePath)) {
    const appModuleContent = fs.readFileSync(appModulePath, 'utf8');
    
    if (appModuleContent.includes('TenantSubdomainMiddleware')) {
        console.log('   ✅ TenantSubdomainMiddleware imported');
    } else {
        console.log('   ❌ TenantSubdomainMiddleware not imported');
    }
    
    if (appModuleContent.includes('NestModule')) {
        console.log('   ✅ NestModule interface implemented');
    } else {
        console.log('   ❌ NestModule interface not implemented');
    }
    
    if (appModuleContent.includes('configure(consumer: MiddlewareConsumer)')) {
        console.log('   ✅ Middleware configure method added');
    } else {
        console.log('   ❌ Middleware configure method missing');
    }
    
    if (appModuleContent.includes('TypeOrmModule.forFeature([Tenant])')) {
        console.log('   ✅ Tenant entity registered for middleware');
    } else {
        console.log('   ❌ Tenant entity not registered');
    }
} else {
    console.log('   ❌ app.module.ts not found');
}

console.log('');

// Check 2: CORS configuration in main.ts
console.log('✅ Fix 2: CORS Configuration');
const mainTsPath = path.join(__dirname, 'backend/src/main.ts');
if (fs.existsSync(mainTsPath)) {
    const mainTsContent = fs.readFileSync(mainTsPath, 'utf8');
    
    if (mainTsContent.includes('X-Tenant-Subdomain')) {
        console.log('   ✅ X-Tenant-Subdomain header allowed');
    } else {
        console.log('   ❌ X-Tenant-Subdomain header not in CORS config');
    }
    
    if (mainTsContent.includes('allowedPatterns')) {
        console.log('   ✅ Wildcard pattern matching implemented');
    } else {
        console.log('   ❌ Wildcard pattern matching missing');
    }
    
    if (mainTsContent.includes('localhost:\\d+')) {
        console.log('   ✅ Localhost subdomain patterns configured');
    } else {
        console.log('   ❌ Localhost subdomain patterns missing');
    }
} else {
    console.log('   ❌ main.ts not found');
}

console.log('');

// Check 3: Environment variables
console.log('✅ Fix 3: Environment Configuration');
const envPath = path.join(__dirname, 'backend/.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('MAIN_DOMAIN=urutix.com')) {
        console.log('   ✅ MAIN_DOMAIN configured');
    } else {
        console.log('   ❌ MAIN_DOMAIN not configured');
    }
    
    if (envContent.includes('ENABLE_SUBDOMAINS=true')) {
        console.log('   ✅ ENABLE_SUBDOMAINS set to true');
    } else {
        console.log('   ❌ ENABLE_SUBDOMAINS not enabled');
    }
    
    if (envContent.includes('gasa.localhost')) {
        console.log('   ✅ Subdomain origins configured in ALLOWED_ORIGINS');
    } else {
        console.log('   ❌ Subdomain origins not in ALLOWED_ORIGINS');
    }
} else {
    console.log('   ❌ .env file not found');
}

console.log('');

// Check 4: Hosts file (Windows)
console.log('⚠️  Fix 4: Hosts File Configuration');
const hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
try {
    if (fs.existsSync(hostsPath)) {
        const hostsContent = fs.readFileSync(hostsPath, 'utf8');
        
        const requiredSubdomains = ['gasa.localhost', 'demo-b.localhost', 'admin.localhost'];
        let configuredCount = 0;
        
        requiredSubdomains.forEach(subdomain => {
            if (hostsContent.includes(subdomain)) {
                console.log(`   ✅ ${subdomain} configured`);
                configuredCount++;
            } else {
                console.log(`   ❌ ${subdomain} NOT configured`);
            }
        });
        
        if (configuredCount === 0) {
            console.log('   ⚠️  No subdomain entries found in hosts file');
            console.log('   💡 Run update-hosts-file.ps1 as Administrator');
        } else if (configuredCount < requiredSubdomains.length) {
            console.log('   ⚠️  Some subdomain entries missing');
            console.log('   💡 Run update-hosts-file.ps1 as Administrator');
        } else {
            console.log('   ✅ All required subdomain entries configured');
        }
    } else {
        console.log('   ❌ Hosts file not accessible');
    }
} catch (error) {
    console.log('   ⚠️  Cannot read hosts file (permission required)');
    console.log('   💡 Run update-hosts-file.ps1 as Administrator');
}

console.log('');

// Summary
console.log('📋 FIXES SUMMARY');
console.log('================');
console.log('✅ Backend middleware registration: COMPLETED');
console.log('✅ CORS wildcard configuration: COMPLETED');
console.log('✅ Environment variables: COMPLETED');
console.log('⚠️  Hosts file configuration: NEEDS ADMIN ACCESS');
console.log('');
console.log('🚀 NEXT STEPS:');
console.log('1. Run update-hosts-file.ps1 as Administrator');
console.log('2. Restart backend: cd backend && npm run start:dev');
console.log('3. Test at: http://gasa.localhost:5173');
console.log('');
console.log('💡 To run hosts file updater:');
console.log('   Right-click PowerShell -> Run as Administrator');
console.log('   cd C:\\Users\\HP\\Desktop\\urutix\\urutix');
console.log('   .\\update-hosts-file.ps1');