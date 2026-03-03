const http = require('http');

const data = JSON.stringify({
    role: 'DRIVER',
    permission: 'fleet:view'
});

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/admin/permissions/roles/grant',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Response Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
