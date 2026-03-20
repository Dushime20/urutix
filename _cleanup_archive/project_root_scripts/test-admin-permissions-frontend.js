const puppeteer = require('puppeteer');

async function testAdminPermissionsFrontend() {
    console.log('🧪 Testing Admin Permissions Frontend Integration...\n');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false, // Set to true for headless mode
            defaultViewport: { width: 1280, height: 720 }
        });
        
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Browser Error:', msg.text());
            }
        });
        
        // Navigate to login page
        console.log('📍 Navigating to login page...');
        await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
        
        // Login with admin credentials
        console.log('🔐 Logging in with admin credentials...');
        await page.type('input[type="email"]', 'admin2@urutix.com');
        await page.type('input[type="password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        
        // Wait for navigation after login
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('✅ Login successful');
        
        // Navigate to admin permissions page
        console.log('📍 Navigating to admin permissions page...');
        await page.goto('http://localhost:5174/admin/permissions', { waitUntil: 'networkidle0' });
        
        // Wait for the page to load
        await page.waitForSelector('[data-testid="admin-permissions"], .admin-permissions, h1, h2', { timeout: 10000 });
        
        // Check if the page loaded successfully
        const pageTitle = await page.evaluate(() => {
            return document.title || document.querySelector('h1, h2')?.textContent || 'Unknown';
        });
        
        console.log('✅ Admin Permissions page loaded');
        console.log('   📄 Page title:', pageTitle);
        
        // Check for permission matrix tab
        const hasMatrixTab = await page.evaluate(() => {
            return !!document.querySelector('button:contains("Permission Matrix"), [data-tab="matrix"]');
        });
        
        // Check for roles tab
        const hasRolesTab = await page.evaluate(() => {
            return !!document.querySelector('button:contains("Roles"), [data-tab="roles"]');
        });
        
        console.log('   🔍 Permission Matrix tab:', hasMatrixTab ? '✅ Found' : '❌ Not found');
        console.log('   🔍 Roles tab:', hasRolesTab ? '✅ Found' : '❌ Not found');
        
        // Check for any error messages
        const errorMessages = await page.evaluate(() => {
            const errors = Array.from(document.querySelectorAll('.error, .alert-error, [class*="error"]'));
            return errors.map(el => el.textContent).filter(text => text && text.trim());
        });
        
        if (errorMessages.length > 0) {
            console.log('⚠️  Error messages found:');
            errorMessages.forEach(msg => console.log('   -', msg));
        } else {
            console.log('✅ No error messages found');
        }
        
        // Take a screenshot
        await page.screenshot({ path: 'admin-permissions-test.png', fullPage: true });
        console.log('📸 Screenshot saved as admin-permissions-test.png');
        
        console.log('\n🎉 Frontend integration test completed!');
        
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        
        if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            console.log('💡 Make sure the frontend is running on http://localhost:5174');
        }
        
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Check if puppeteer is available
try {
    require('puppeteer');
    testAdminPermissionsFrontend();
} catch (error) {
    console.log('⚠️  Puppeteer not available. Testing with curl instead...\n');
    
    // Fallback to simple HTTP test
    const axios = require('axios');
    
    async function simpleFrontendTest() {
        try {
            const response = await axios.get('http://localhost:5174');
            console.log('✅ Frontend server is running');
            console.log('   📍 URL: http://localhost:5174');
            console.log('   📄 Status:', response.status);
            
            console.log('\n💡 Manual testing steps:');
            console.log('1. Open http://localhost:5174/login in your browser');
            console.log('2. Login with: admin2@urutix.com / Admin@123');
            console.log('3. Navigate to: http://localhost:5174/admin/permissions');
            console.log('4. Verify the permission matrix and roles tabs are working');
            
        } catch (error) {
            console.log('❌ Frontend server not accessible');
            console.log('💡 Make sure to run: npm run dev in the frontend directory');
        }
    }
    
    simpleFrontendTest();
}