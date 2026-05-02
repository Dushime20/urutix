const fs = require('fs');
const path = require('path');
const migrationsDir = 'backend/src/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));

let allCreations = [];
let allAlters = [];

files.forEach(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const lines = content.split('\n');
    let currentQuery = '';
    lines.forEach(line => {
        // Collect column additions
        const addMatch = line.match(/ADD (?:COLUMN )?\"([^\"]+)\"/);
        if (addMatch) allCreations.push(addMatch[1]);
        
        // Collect table creations and their columns
        const createMatch = line.match(/CREATE TABLE.*?\((.*)\)/);
        if (createMatch) {
            const cols = createMatch[1].match(/\"([^\"]+)\"/g);
            if (cols) {
                cols.forEach(c => allCreations.push(c.replace(/\"/g, '')));
            }
        }
        
        // Match ALTER TABLE ... ALTER COLUMN ...
        const alterMatch = line.match(/ALTER TABLE \"([^\"]+)\" ALTER COLUMN \"([^\"]+)\"/);
        if (alterMatch && file.includes('ConsolidatedBaseline')) {
            allAlters.push({table: alterMatch[1], col: alterMatch[2], type: 'ALTER', line: line.trim()});
        }
        
        // Match COMMENT ON COLUMN ...
        const commentMatch = line.match(/COMMENT ON COLUMN \"([^\"]+)\"\.\"([^\"]+)\"/);
        if (commentMatch && file.includes('ConsolidatedBaseline')) {
            allAlters.push({table: commentMatch[1], col: commentMatch[2], type: 'COMMENT', line: line.trim()});
        }
    });
});

const uniqueCreations = new Set(allCreations);
const missing = [];

allAlters.forEach(a => {
    if (!uniqueCreations.has(a.col)) {
        missing.push(a);
    }
});

console.log(JSON.stringify(missing, null, 2));
