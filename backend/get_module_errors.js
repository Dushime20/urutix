const fs = require('fs');
const content = fs.readFileSync('tsc_errors.log', 'utf8');
const lines = content.split('\n');
const files = new Set();

for (const line of lines) {
   if (line.includes('error TS') && line.includes('Cannot find module')) {
       // match file path: src/app.module.ts(7,36):
       const match = line.match(/^([^\(]+)/);
       if (match) files.add(match[1]);
   }
}
console.log(Array.from(files).join('\n'));
