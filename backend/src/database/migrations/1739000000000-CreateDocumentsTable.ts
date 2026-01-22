import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateDocumentsTable1739000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create documents table
    await queryRunner.createTable(
      new Table({
        name: 'documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'entityType',
            type: 'enum',
            enum: ['USER', 'DRIVER', 'TRUCK', 'CARGO', 'TRIP', 'COMPANY', 'TENANT', 'SYSTEM'],
            isNullable: false,
          },
          {
            name: 'entityId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'documentType',
            type: 'enum',
            enum: [
              'DRIVER_LICENSE',
              'DRIVER_MEDICAL_CERT',
              'DRIVER_DRUG_TEST',
              'DRIVER_BACKGROUND_CHECK',
              'DRIVER_TRAINING_CERT',
              'DRIVER_INSURANCE',
              'VEHICLE_REGISTRATION',
              'VEHICLE_INSURANCE',
              'VEHICLE_INSPECTION',
              'VEHICLE_MAINTENANCE',
              'VEHICLE_PERMIT',
              'CARGO_MANIFEST',
              'CARGO_INSURANCE',
              'CARGO_CUSTOMS',
              'CARGO_WEIGHT_CERT',
              'BUSINESS_LICENSE',
              'BUSINESS_INSURANCE',
              'BUSINESS_TAX_CERT',
              'BUSINESS_PERMIT',
              'USER_ID_PROOF',
              'USER_ADDRESS_PROOF',
              'USER_BANK_DETAILS',
              'TRIP_PERMIT',
              'TRIP_ROUTE_PLAN',
              'TRIP_WEIGHT_TICKET',
              'POD',
              'INVOICE',
              'RECEIPT',
              'PAYMENT_PROOF',
              'EXPENSE_RECEIPT',
              'SAFETY_CERT',
              'ENVIRONMENTAL_CERT',
              'QUALITY_CERT',
              'CONTRACT',
              'AGREEMENT',
              'POLICY',
              'MANUAL',
              'OTHER',
            ],
            isNullable: false,
          },
          {
            name: 'category',
            type: 'enum',
            enum: [
              'IDENTITY',
              'LICENSE',
              'INSURANCE',
              'CERTIFICATION',
              'COMPLIANCE',
              'FINANCIAL',
              'OPERATIONAL',
              'LEGAL',
              'CARGO',
              'VEHICLE',
              'DRIVER',
              'TRIP',
              'BUSINESS',
              'OTHER',
            ],
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
            default: "'PENDING'",
            isNullable: false,
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
            default: "'NORMAL'",
            isNullable: false,
          },
          {
            name: 'documentNumber',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'title',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'fileName',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'originalFileName',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'fileUrl',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'thumbnailUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'fileSize',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'mimeType',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'fileExtension',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'issueDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'expiryDate',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'isExpired',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'requiresRenewal',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'renewalReminderDays',
            type: 'integer',
            default: 30,
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'tags',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'uploadedBy',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'verifiedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'verifiedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'verificationNotes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'verificationData',
            type: 'jsonb',
            default: "'{}'",
            isNullable: false,
          },
          {
            name: 'versions',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'currentVersion',
            type: 'integer',
            default: 1,
            isNullable: false,
          },
          {
            name: 'accessControl',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'auditTrail',
            type: 'jsonb',
            default: "'[]'",
            isNullable: false,
          },
          {
            name: 'isPublic',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'isConfidential',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'encryptionKey',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'ocrData',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'digitalSignature',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'complianceInfo',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'workflowInfo',
            type: 'jsonb',
            default: "'{}'",
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes for better query performance
    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_ENTITY_TYPE_ID',
        columnNames: ['entityType', 'entityId'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_TYPE_STATUS',
        columnNames: ['documentType', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_CATEGORY_PRIORITY',
        columnNames: ['category', 'priority'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_TENANT_ENTITY_TYPE',
        columnNames: ['tenantId', 'entityType'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_EXPIRY_STATUS',
        columnNames: ['expiryDate', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'documents',
      new TableIndex({
        name: 'IDX_DOCUMENTS_UPLOADED_BY_CREATED',
        columnNames: ['uploadedBy', 'createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_UPLOADED_BY_CREATED');
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_EXPIRY_STATUS');
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_TENANT_ENTITY_TYPE');
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_CATEGORY_PRIORITY');
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_TYPE_STATUS');
    await queryRunner.dropIndex('documents', 'IDX_DOCUMENTS_ENTITY_TYPE_ID');

    // Drop table
    await queryRunner.dropTable('documents');
  }
}
