const fs = require('fs');
const content = fs.readFileSync('tsc_errors.log', 'utf16le');
const lines = content.split('\n');
const errors = new Map();

for (let i = 0; i < Math.min(100, lines.length); i++) {
   if (lines[i].includes('error TS')) {
       console.log(lines[i].trim());
   }
}
