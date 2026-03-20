const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\HP\\Desktop\\urutix\\urutix\\frontend\\src\\pages\\broker';

const replacements = [
  { regex: /\bVector\b/gi, replacement: 'Record' },
  { regex: /\bVectors\b/gi, replacement: 'Records' },
  { regex: /\bAlpha\b/gi, replacement: '' },
  { regex: /\bProtocol\b/g, replacement: 'Contract' },
  { regex: /\bProtocols\b/g, replacement: 'Contracts' },
  { regex: /\bprotocol\b/g, replacement: 'contract' },
  { regex: /\bprotocols\b/g, replacement: 'contracts' },
  { regex: /\bSynthesis\b/gi, replacement: 'Creation' },
  { regex: /\bSynthesize\b/gi, replacement: 'Generate' },
  { regex: /\bsynthesized\b/gi, replacement: 'generated' },
  { regex: /\bMatrix\b/gi, replacement: 'System' },
  { regex: /  +/g, replacement: ' ' }, // cleanup double spaces left by removing Alpha
];

fs.readdir(dir, (err, files) => {
  if (err) throw err;
  files.forEach(file => {
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const filePath = path.join(dir, file);
      const original = fs.readFileSync(filePath, 'utf8');
      let updated = original;
      
      replacements.forEach(r => {
        updated = updated.replace(r.regex, r.replacement);
      });
      
      if (updated !== original) {
        fs.writeFileSync(filePath, updated, 'utf8');
        console.log(`Updated ${file}`);
      }
    }
  });
});
