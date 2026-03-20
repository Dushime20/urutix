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
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
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

    // Fix 1: The ';;' or '`;' or '";' being stripped to single quote.
    // The previous script replaced `'';` with `';`
    // This affects lines where an empty string was intended before a semicolon.
    // E.g., const x = ';
    // Match common assignment/operators before ';
    content = content.replace(/([=:\?\(\|\[\{,]\s*)';/g, "$1'';");
    content = content.replace(/([=:\?\(\|\[\{,]\s*)";/g, '$1"";');
    content = content.replace(/([=:\?\(\|\[\{,]\s*)`;/g, "$1``;");
    content = content.replace(/return\s+';/g, "return '';");
    
    // Fix 2: The catastrophic regex from quote_repair.ps1
    // `from '... \n const ...';`
    // Let's find any `from '` followed by newlines and code, ending in `';`
    // and replace it back to `from ` without quotes, or just remove the quotes!
    // Since `from ` can be part of a comment: `// Extract loadId from 'params or body\n ...';`
    content = content.replace(/from\s+'((?:\w+[-_\.\s\w]*)(?:\r?\n)(?:[^']*?))';/g, (match, p1) => {
        // We ensure p1 has a newline, so it's the multiline corruption
        return `from ${p1};`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
        console.log(`Repaired corruption in: ${file}`);
    }
}
console.log(`Modified ${filesModified} files.`);
