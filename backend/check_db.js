
const { createConnection } = require('typeorm');
const path = require('path');

async function checkUsers() {
  try {
    // We'll try to connect to the database using the environment variables
    // Since we don't have direct access to process.env in the script easily without loading it,
    // we'll try to find the ormconfig or env file.
    // However, it's easier to just run a raw SQL query if we can find the connection details.
    
    // Let's look for .env file first
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', '..', '..', '.env');
    if (!fs.existsSync(envPath)) {
        console.log('No .env found at', envPath);
        return;
    }
    
    const env = fs.readFileSync(envPath, 'utf8');
    const dbUrl = env.match(/DATABASE_URL=(.*)/)?.[1];
    
    if (!dbUrl) {
        console.log('No DATABASE_URL found in .env');
        // Try individual components
        const host = env.match(/DB_HOST=(.*)/)?.[1];
        const port = env.match(/DB_PORT=(.*)/)?.[1];
        const user = env.match(/DB_USERNAME=(.*)/)?.[1];
        const pass = env.match(/DB_PASSWORD=(.*)/)?.[1];
        const name = env.match(/DB_DATABASE=(.*)/)?.[1];
        
        console.log(`DB Info: ${host}:${port}, User: ${user}, DB: ${name}`);
    } else {
        console.log('DB URL found');
    }
  } catch (err) {
    console.error(err);
  }
}

checkUsers();
