const fs = require('fs');
try {
    const data = fs.readFileSync('startup.log');
    const content = data.toString('utf16le');
    const lines = content.split('\n');
    console.log('Last 200 lines:');
    console.log(lines.slice(-200).join('\n'));
} catch (e) {
    console.error(e);
}
