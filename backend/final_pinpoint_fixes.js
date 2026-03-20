const fs = require('fs');

const fixes = [
  {
    file: 'src/entities/audit-event.entity.ts',
    replace: "return changeDescriptions.join(''; ');",
    with: "return changeDescriptions.join('; ');"
  },
  {
    file: 'src/modules/admin/admin.module.ts',
    replace: "import { NotificationsModule } from '../notifications/notifications.module;",
    with: "import { NotificationsModule } from '../notifications/notifications.module';"
  },
  {
    file: 'src/modules/auth/services/auth.service.ts',
    replace: "return '00000000-0000-0000-0000-000000000001;",
    with: "return '00000000-0000-0000-0000-000000000001';"
  },
  {
    file: 'src/modules/auth/services/email.service.ts',
    replace: /\|\|\s*'http:\/\/localhost:5173;/g,
    with: "|| 'http://localhost:5173';"
  },
  {
    file: 'src/modules/documents/document.controller.ts',
    replace: "const tenantId = 'temp-tenant-id;",
    with: "const tenantId = 'temp-tenant-id';"
  },
  {
    file: 'src/modules/fleet/fleet.service.ts',
    replace: "const errorMessage = error.message || error.toString() ||';",
    with: "const errorMessage = error.message || error.toString() || '';"
  },
  {
    file: 'src/modules/lending/controllers/uruti-lending-admin.controller.ts',
    replace: ":';",
    with: ": '';\n"
  },
  {
    file: 'src/modules/lending/lending.service.ts',
    replace: "const { PaymentMethod, PaymentType } = await import(@/payment.entity');",
    with: "const { PaymentMethod, PaymentType } = await import('../../entities/payment.entity');"
  },
  {
    file: 'src/modules/lending/services/uruti-lending-integration.service.ts',
    replace: "'PL-001;",
    with: "'PL-001';"
  },
  {
    file: 'src/modules/loads/loads.controller.ts',
    replace: "const errorMessage = error.message || 'An unexpected error occurred while creating cargo from 'template';",
    with: "const errorMessage = error.message || \"An unexpected error occurred while creating cargo from 'template'\";"
  },
  {
    file: 'src/modules/matching/matching.service.ts',
    replace: "} from '@nestjs/common;",
    with: "} from '@nestjs/common';"
  },
  {
    file: 'src/modules/notifications/notification.service.ts',
    replace: "notification.metadata?.recipientEmail || 'placeholder@example.com;",
    with: "notification.metadata?.recipientEmail || 'placeholder@example.com';"
  },
  {
    file: 'src/modules/notifications/notification.service.ts',
    replace: "notification.metadata?.recipientPhone || '+1234567890;",
    with: "notification.metadata?.recipientPhone || '+1234567890';"
  },
  {
    file: 'src/modules/notifications/notification.service.ts',
    replace: "notification.metadata?.deviceToken || 'placeholder-device-token;",
    with: "notification.metadata?.deviceToken || 'placeholder-device-token';"
  }
];

let filesModified = new Set();

for (const fix of fixes) {
    try {
        let content = fs.readFileSync(fix.file, 'utf8');
        content = content.replace(fix.replace, fix.with);
        fs.writeFileSync(fix.file, content, 'utf8');
        filesModified.add(fix.file);
    } catch(e) {
        console.error(`Error processing ${fix.file}:`, e.message);
    }
}
console.log(`Modified ${filesModified.size} files.`);
