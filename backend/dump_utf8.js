const fs = require('fs');
const files = {
  'src/entities/audit-event.entity.ts': [205],
  'src/modules/admin/admin.module.ts': [53],
  'src/modules/auth/services/auth.service.ts': [675],
  'src/modules/auth/services/email.service.ts': [191, 333, 463, 593, 726, 860, 994],
  'src/modules/documents/document.controller.ts': [342],
  'src/modules/fleet/fleet.service.ts': [884],
  'src/modules/lending/controllers/uruti-lending-admin.controller.ts': [184],
  'src/modules/lending/lending.service.ts': [1022],
  'src/modules/lending/services/uruti-lending-integration.service.ts': [163],
  'src/modules/loads/loads.controller.ts': [772],
  'src/modules/matching/matching.service.ts': [9],
  'src/modules/notifications/notification.service.ts': [943, 972, 999]
};

let output = '';
for (const [file, lines] of Object.entries(files)) {
  const content = fs.readFileSync(file, 'utf8').split('\n');
  for (const line of lines) {
    output += `[${file}:${line}]\n`;
    output += content[line - 2] + '\n';
    output += content[line - 1] + '\n';
    output += content[line] + '\n';
    output += '------------------\n';
  }
}
fs.writeFileSync('dump8.txt', output, 'utf8');
