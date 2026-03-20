const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\HP\\Desktop\\urutix\\urutix\\frontend\\src\\pages\\broker';

const replacements = [
  { regex: /Target Load Vector/gi, replacement: 'Load ID' },
  { regex: /Entry Payload/gi, replacement: 'Created On' },
  { regex: /Payment Matrix/gi, replacement: 'Payment Terms' },
  { regex: /Commission State/gi, replacement: 'Commission Status' },
  { regex: /Verified Cycle/gi, replacement: 'Verified' },
  { regex: /Legal Jurisdiction/gi, replacement: 'Jurisdiction' },
  { regex: /Execution Terms/gi, replacement: 'Terms' },
  { regex: /Protocol Alpha/gi, replacement: 'System' },
  { regex: /Registry Vault/gi, replacement: 'Records' },
  { regex: /Legal Protocol/gi, replacement: 'Contract' },
  { regex: /Activation Vector/gi, replacement: 'Effective Date' },
  { regex: /Temporal End/gi, replacement: 'Expiry Date' },
  { regex: /Verification Archetype/gi, replacement: 'Verification Type' },
  { regex: /Security Identifier/gi, replacement: 'ID Number' },
  { regex: /Node-Verifiable Ledger/gi, replacement: 'Audit History' },
  { regex: /Phase Entry/gi, replacement: 'Date' },
  { regex: /(Yield Index|Yield Alpha)/gi, replacement: 'Commission' },
  { regex: /Authenticating Registry Stream\.\.\./gi, replacement: 'Loading...' },
  { regex: /Baseline Registry Detected/gi, replacement: 'No Records Found' },
  { regex: /Integrity State/gi, replacement: 'Status' },
  { regex: /Compliance Matrix/gi, replacement: 'Compliance Settings' },
  { regex: /Transporter Vector/gi, replacement: 'Transporter' },
  { regex: /Executing Neural Match Vectors\.\.\./gi, replacement: 'Finding Best Matches...' },
  { regex: /Strategic Audit Vector/gi, replacement: 'Performance Audit' },
  { regex: /State Vector/gi, replacement: 'Status' },
  { regex: /Asset Vector/gi, replacement: 'Asset' },
  { regex: /Vector Valuation/gi, replacement: 'Value' },
  { regex: /Revoked Vector/gi, replacement: 'Cancelled' },
  { regex: /Entry Vector/gi, replacement: 'Date' },
  { regex: /Payload Vector/gi, replacement: 'File Size' },
  { regex: /Payload Storage Vector \(URL\)/gi, replacement: 'Document URL' },
  { regex: /Vector Classification/gi, replacement: 'Document Type' },
  { regex: /Created Vector/gi, replacement: 'Creation Date' },
  { regex: /Compliance Vector/gi, replacement: 'Compliance Document' },
  { regex: /Current Yield Index/gi, replacement: 'Current Rate' },
  { regex: /High-Probability Vectors/gi, replacement: 'Excellent Matches' },
  { regex: /Predictive Yield/gi, replacement: 'Expected Profit' },
  { regex: /Compromise Delta/gi, replacement: 'Risk Level' },
  { regex: /Digital Execution/gi, replacement: 'Sign Contract' },
  { regex: /Exit Inspection/gi, replacement: 'Close' },
  { regex: /Synthesize/g, replacement: 'Generate' },
  { regex: /synthesized/gi, replacement: 'generated' },
  { regex: /Synthesis/g, replacement: 'Creation' },
  { regex: /Vectors/g, replacement: 'Records' },
  { regex: /Vector\b/g, replacement: 'Record' },
  { regex: /Temporal Phase/gi, replacement: 'Timeline' },
  { regex: /Logistical Parameters/gi, replacement: 'Logistics Details' },
  { regex: /Protocol/g, replacement: 'Contract' },
  { regex: /Protocols/g, replacement: 'Contracts' },
  { regex: /Cryptographically secured/gi, replacement: 'Secure' },
  { regex: /cryptographically signed/gi, replacement: 'digitally signed' },
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
