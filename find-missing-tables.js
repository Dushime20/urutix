const fs = require('fs');
const path = require('path');
const migrationsDir = 'backend/src/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.ts'));

let createdTables = new Set();
let usedTables = new Set();

files.forEach(file => {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        const createMatch = line.match(/CREATE TABLE(?: IF NOT EXISTS)? \"([^\"]+)\"/);
        if (createMatch) createdTables.add(createMatch[1]);
        
        if (file.includes('ConsolidatedBaseline')) {
            const alterMatch = line.match(/ALTER TABLE \"([^\"]+)\"/);
            if (alterMatch) usedTables.add(alterMatch[1]);
            
            const indexMatch = line.match(/CREATE (?:UNIQUE )?INDEX.*?ON \"([^\"]+)\"/);
            if (indexMatch) usedTables.add(indexMatch[1]);
            
            const commentMatch = line.match(/COMMENT ON TABLE \"([^\"]+)\"/);
            if (commentMatch) usedTables.add(commentMatch[1]);
        }
    });
});

const missingTables = [];
Array.from(usedTables).forEach(t => {
    if (!createdTables.has(t)) {
        missingTables.push(t);
    }
});

console.log(JSON.stringify(missingTables, null, 2));
