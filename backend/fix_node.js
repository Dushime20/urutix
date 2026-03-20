const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        if (filePath.includes('__tests__') || filePath.includes('node_modules')) continue;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            getFiles(filePath, files);
        } else if (filePath.endsWith('.ts')) {
            files.push(filePath);
        }
    }
    return files;
}

const srcDir = path.join(__dirname, 'src');
const files = getFiles(srcDir);

let filesModified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const relPath = path.relative(srcDir, file).replace(/\\/g, '/');
    const depth = relPath.split('/').length - 1;

    let prefix = '';
    for (let i = 0; i < depth; i++) prefix += '../';
    if (depth === 0) prefix = './';

    // Find `from <something>;`
    // where <something> might be `../../entities/foo'` (missing start quote)
    // or `@/user.entity';`
    // or `@entities/foo.entity` (missing both)
    
    content = content.replace(/from\s+([^'"][^;]*?)(['"]?)\s*;/g, (match, pathPart, endQuote) => {
        // If it starts with a quote, it didn't match the regex (the regex excludes starting with quote).
        // Wait, `[^'"]` means the first char is NOT a quote.
        // pathPart is the path.
        let cleanPath = pathPart.trim();
        // Remove trailing quote if it was part of pathPart accidentally
        if (cleanPath.endsWith("'") || cleanPath.endsWith('"')) {
            cleanPath = cleanPath.slice(0, -1);
        }

        // Now we have the clean path. Let's map it to a valid relative path if it uses weird prefixes.
        if (cleanPath.startsWith('@/')) {
            // Usually this was meant to be `@entities/`, `@common/`, etc., or it was `./modules/`?
            // Let's guess based on the file name end
            if (cleanPath.endsWith('.entity')) {
                cleanPath = cleanPath.replace('@/', prefix + 'entities/');
            } else if (cleanPath.endsWith('.service')) {
                // Wait, if it's `from @/permission.service`, is it in `src/services/`?
                cleanPath = cleanPath.replace('@/', prefix + 'services/');
            } else {
                // it might be a module or something in src
                // For app.module.ts, it was `@/auth/enhanced-auth.module`
                // Let's replace `@/` with something logical, but wait!
                // We should check if the file exists!
                cleanPath = cleanPath.replace('@/', prefix);
                // We'll refine this later if it's broken
            }
        } 
        
        // Map other @ aliases that were left broken
        if (cleanPath.startsWith('@entities/')) cleanPath = cleanPath.replace('@entities/', prefix + 'entities/');
        if (cleanPath.startsWith('@common/')) cleanPath = cleanPath.replace('@common/', prefix + 'common/');
        if (cleanPath.startsWith('@services/')) cleanPath = cleanPath.replace('@services/', prefix + 'services/');
        if (cleanPath.startsWith('@modules/')) cleanPath = cleanPath.replace('@modules/', prefix + 'modules/');
        
        // Also map missing quotes for simple relative paths: `from ../../entities/user.entity`
        return `from '${cleanPath}';`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
        console.log(`Fixed Quotes & Aliases: ${relPath}`);
    }
}
console.log(`Modified ${filesModified} files.`);
