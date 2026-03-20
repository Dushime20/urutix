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

    // Match the multiline corruption caused by `(?ms)from\s+([^\s'""].+?);` wrapped in `from '$1';`
    // It looks like `from '...stuff including spaces or newlines...';`
    // Legitimate imports are usually `from './path';` or `from 'module';`
    // Legitimate imports do NOT contain newlines, spaces (other than inside the quote maybe but usually paths don't),
    // and especially not 'const ', 'let ', '//'.
    
    // We find ANY occurrence of `from '` ... `';`
    content = content.replace(/from\s+'([\s\S]+?)';/g, (match, p1) => {
        // If it contains a newline, or contains 'const ', 'let ', 'class ', '//', '/*', it's corrupted.
        // Wait, a path could be like `from './my path'` but that's super rare.
        if (p1.includes('\n') || p1.includes('//') || p1.includes('/*') || p1.includes('const ') || /[\(\)\{\}\=]/.test(p1)) {
            // It's definitely corrupted. Remove the leading and trailing quote that was added.
            // i.e., replace `from '${p1}';` with `from ${p1};`
            return `from ${p1};`;
        }
        // Otherwise, leave it as is (it's a valid import string)
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
        console.log(`Repaired multiline from-corruption in: ${file}`);
    }
}
console.log(`Modified ${filesModified} files.`);
