
const http = require('http');

function checkUrl(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, data: data.substring(0, 500) }); // First 500 chars
            });
        }).on('error', (err) => {
            resolve({ error: err.message });
        });
    });
}

async function run() {
    const ports = [3000, 3002];
    const paths = [
        '/api/admin/health',
        '/api/admin/tenant-management',
        '/api/tenants'
    ];

    for (const port of ports) {
        console.log(`\n--- Checking Port ${port} ---`);
        for (const path of paths) {
            const url = `http://localhost:${port}${path}`;
            console.log(`Fetching ${url}...`);
            const result = await checkUrl(url);
            if (result.error) {
                console.log(`Failed: ${result.error}`);
            } else {
                console.log(`Status: ${result.statusCode}`);
                console.log(`Body: ${result.data}`);
            }
        }
    }
}

run();
