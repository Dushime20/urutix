#!/usr/bin/env node

/**
 * Seed script: Documents and Notifications
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5433,
  // Align defaults with backend Postgres config
  database: process.env.DB_DATABASE || 'urutix',
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
};

async function seedDocumentsAndNotifications() {
  console.log('➡️  Seeding documents and notifications...');
  const pool = new Pool(dbConfig);
  try {
    await pool.query('SELECT 1');

    // Resolve tenant (allow override via TENANT_ID)
    let tenantId = process.env.TENANT_ID;
    if (!tenantId) {
      const tenantRes = await pool.query(
        'SELECT id FROM tenants WHERE "isActive" = true LIMIT 1',
      );
      if (tenantRes.rows.length === 0) {
        throw new Error('No active tenant found and TENANT_ID not provided');
      }
      tenantId = tenantRes.rows[0].id;
    }

    // Resolve a recipient/user
    const userRes = await pool.query(
      "SELECT id FROM users WHERE status = 'ACTIVE' LIMIT 1",
    );
    if (userRes.rows.length === 0) {
      throw new Error('No active users found');
    }
    const userId = userRes.rows[0].id;

    // Resolve an entity for documents (prefer a load)
    let entityType = 'CARGO';
    let entityId;
    const loadRes = await pool.query('SELECT id FROM loads LIMIT 1');
    if (loadRes.rows.length > 0) {
      entityId = loadRes.rows[0].id;
      entityType = 'CARGO';
    } else {
      // fallback to user entity
      entityType = 'USER';
      entityId = userId;
    }

    // Seed Documents (two examples)
    const docs = [
      {
        documentType: 'CARGO_MANIFEST',
        category: 'CARGO',
        title: 'Cargo Manifest - Sample',
        description: 'Sample cargo manifest document',
        fileName: 'manifest-sample.pdf',
        originalFileName: 'manifest-sample.pdf',
        fileUrl: '/uploads/manifest-sample.pdf',
        fileSize: 1024 * 150,
        mimeType: 'application/pdf',
      },
      {
        documentType: 'INVOICE',
        category: 'FINANCIAL',
        title: 'Invoice #INV-1001',
        description: 'Sample invoice document',
        fileName: 'invoice-1001.pdf',
        originalFileName: 'invoice-1001.pdf',
        fileUrl: '/uploads/invoice-1001.pdf',
        fileSize: 1024 * 200,
        mimeType: 'application/pdf',
      },
    ];

    for (const d of docs) {
      const fileExt = (d.fileName.split('.').pop() || '').toLowerCase();
      const versionsJson = [
        {
          version: 1,
          fileUrl: d.fileUrl,
          fileName: d.fileName,
          fileSize: d.fileSize,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          changeNotes: 'Initial upload',
        },
      ];

      await pool.query(
        `INSERT INTO documents (
            id, "tenantId", "entityType", "entityId",
            "documentType", category, status, priority,
            title, description,
            "fileName", "originalFileName", "fileUrl", "thumbnailUrl", "fileSize", "mimeType", "fileExtension",
            "issueDate", "expiryDate", "isExpired", "requiresRenewal", "renewalReminderDays",
            metadata, tags, versions, "currentVersion", "accessControl", "auditTrail",
            "createdAt", "updatedAt"
         ) VALUES (
            uuid_generate_v4(), $1, $2, $3,
            $4, $5, 'PENDING', 'NORMAL',
            $6, $7,
            $8, $9, $10, $11, $12, $13, $14,
            $15, $16, false, false, 30,
            $17::jsonb, $18::jsonb, $19::jsonb, 1, $20::jsonb, $21::jsonb,
            NOW(), NOW()
         )`,
        [
          tenantId,
          entityType,
          entityId,
          d.documentType,
          d.category,
          d.title,
          d.description,
          d.fileName,
          d.originalFileName,
          d.fileUrl,
          d.thumbnailUrl || d.fileUrl,
          d.fileSize,
          d.mimeType,
          fileExt, // fileExtension (NOT NULL in some schemas)
          null, // issueDate
          null, // expiryDate
          JSON.stringify({}), // metadata
          JSON.stringify(['seed']), // tags
          JSON.stringify(versionsJson), // versions
          JSON.stringify([]), // accessControl
          JSON.stringify([
            {
              action: 'CREATED',
              performedBy: userId,
              performedAt: new Date().toISOString(),
              details: { source: 'seed' },
            },
          ]),
        ],
      );
    }
    console.log(`✅ Inserted ${docs.length} documents`);

    // Seed Notifications (two examples)
    const notifications = [
      {
        notificationType: 'GENERAL',
        category: 'SYSTEM',
        priority: 'NORMAL',
        status: 'PENDING',
        title: 'Welcome to the platform',
        message: 'Your account is ready to go! 🎉',
        channels: ['IN_APP'],
      },
      {
        notificationType: 'TRIP_UPDATE',
        category: 'TRIP',
        priority: 'HIGH',
        status: 'SENT',
        title: 'Trip Update',
        message: 'Your trip TRP-123 has been scheduled.',
        channels: ['IN_APP', 'EMAIL'],
      },
    ];

    for (const n of notifications) {
      await pool.query(
        `INSERT INTO notifications (
           id, "tenantId", "recipientId", "recipientDeviceTokens", "entityType", "entityId",
           "notificationType", category, priority, status,
           title, message, channels, "channelData", tags,
           "requiresAction", "createdAt", "updatedAt"
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3::jsonb, 'USER', $2,
           $4, $5, $6, $7,
           $8, $9, $10::jsonb, $11::jsonb, $12::jsonb,
           false, NOW(), NOW()
         )`,
        [
          tenantId,
          userId,
          JSON.stringify([]),
          n.notificationType,
          n.category,
          n.priority,
          n.status,
          n.title,
          n.message,
          JSON.stringify(n.channels),
          JSON.stringify({}),
          JSON.stringify(['seed']),
        ],
      );
    }
    console.log(`✅ Inserted ${notifications.length} notifications`);

    console.log('🎉 Seeding documents and notifications completed!');
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedDocumentsAndNotifications()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedDocumentsAndNotifications };


