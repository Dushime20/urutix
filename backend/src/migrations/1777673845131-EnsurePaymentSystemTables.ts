import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class EnsurePaymentSystemTables1777673845131 implements MigrationInterface {
  name = 'EnsurePaymentSystemTables1777673845131';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure payments table exists with all required columns
    const paymentsTableExists = await queryRunner.hasTable('payments');
    
    if (!paymentsTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'payments',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              isPrimary: true,
              generationStrategy: 'uuid',
              default: 'uuid_generate_v4()',
            },
            {
              name: 'idempotencyKey',
              type: 'varchar',
              isNullable: true,
              isUnique: false,
            },
            {
              name: 'tenantId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'tripId',
              type: 'uuid',
              isNullable: true,
            },
            {
              name: 'payerId',
              type: 'uuid',
              isNullable: false,
            },
            {
              name: 'payeeId',
              type: 'uuid',
              isNullable: true,
              comment: 'ID of the user who receives the payment (e.g., truck owner receiving payment from cargo owner)',
            },
            {
              name: 'amount',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: false,
            },
            {
              name: 'currency',
              type: 'varchar',
              length: '3',
              isNullable: false,
            },
            {
              name: 'paymentMethod',
              type: 'enum',
              enum: ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'cash', 'check', 'wire_transfer'],
              isNullable: false,
            },
            {
              name: 'paymentType',
              type: 'enum',
              enum: ['trip_payment', 'subscription', 'service_fee', 'deposit', 'refund', 'withdrawal', 'advance', 'final'],
              isNullable: false,
            },
            {
              name: 'status',
              type: 'enum',
              enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'escrow'],
              default: "'pending'",
              isNullable: false,
            },
            {
              name: 'description',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'referenceNumber',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'transactionId',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'gatewayResponse',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'failureReason',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'billingAddress',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'notes',
              type: 'varchar',
              isNullable: true,
            },
            {
              name: 'dueDate',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'processedAt',
              type: 'timestamp',
              isNullable: true,
            },
            {
              name: 'processingFee',
              type: 'decimal',
              precision: 10,
              scale: 2,
              isNullable: true,
            },
            {
              name: 'metadata',
              type: 'jsonb',
              default: "'{}'",
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'timestamp',
              default: 'now()',
              isNullable: false,
            },
            {
              name: 'updatedAt',
              type: 'timestamp',
              default: 'now()',
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
    } else {
      // Check if payeeId column exists, add if missing
      const hasPayeeId = await queryRunner.hasColumn('payments', 'payeeId');
      if (!hasPayeeId) {
        await queryRunner.query(`
          ALTER TABLE payments 
          ADD COLUMN "payeeId" uuid
        `);
        
        await queryRunner.query(`
          COMMENT ON COLUMN payments."payeeId" IS 'ID of the user who receives the payment (e.g., truck owner receiving payment from cargo owner)'
        `);
      }
    }

    // Create indexes for better query performance
    const indexesToCreate = [
      { name: 'IDX_payments_tenant_trip_status', columns: ['tenantId', 'tripId', 'status'] },
      { name: 'IDX_payments_payment_method_type', columns: ['paymentMethod', 'paymentType'] },
      { name: 'IDX_payments_created_processed', columns: ['createdAt', 'processedAt'] },
      { name: 'IDX_payments_payee_id', columns: ['payeeId'] },
      { name: 'IDX_payments_payer_payee', columns: ['payerId', 'payeeId'] },
      { name: 'IDX_payments_tenant_payee', columns: ['tenantId', 'payeeId'] },
      { name: 'IDX_payments_status_due_date', columns: ['status', 'dueDate'] },
      { name: 'IDX_payments_tenant_payer_status', columns: ['tenantId', 'payerId', 'status'] },
      { name: 'IDX_payments_tenant_payee_status', columns: ['tenantId', 'payeeId', 'status'] },
    ];

    for (const indexDef of indexesToCreate) {
      try {
        await queryRunner.createIndex(
          'payments',
          new TableIndex({
            name: indexDef.name,
            columnNames: indexDef.columns,
          }),
        );
      } catch (error) {
        // Index might already exist, continue
        console.log(`Index ${indexDef.name} may already exist`);
      }
    }

    // Add foreign key constraints if they don't exist
    const table = await queryRunner.getTable('payments');
    
    // Foreign key to trips table
    const hasTripFK = table?.foreignKeys.some(fk => fk.columnNames.includes('tripId'));
    if (!hasTripFK) {
      await queryRunner.createForeignKey(
        'payments',
        new TableForeignKey({
          columnNames: ['tripId'],
          referencedTableName: 'trips',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'FK_payments_trip',
        }),
      );
    }

    // Foreign key to users table for payerId
    const hasPayerFK = table?.foreignKeys.some(fk => 
      fk.columnNames.includes('payerId') && fk.referencedTableName === 'users'
    );
    if (!hasPayerFK) {
      await queryRunner.createForeignKey(
        'payments',
        new TableForeignKey({
          columnNames: ['payerId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          name: 'FK_payments_payer',
        }),
      );
    }

    // Foreign key to users table for payeeId
    const hasPayeeFK = table?.foreignKeys.some(fk => 
      fk.columnNames.includes('payeeId') && fk.referencedTableName === 'users'
    );
    if (!hasPayeeFK) {
      await queryRunner.createForeignKey(
        'payments',
        new TableForeignKey({
          columnNames: ['payeeId'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'SET NULL',
          name: 'FK_payments_payee',
        }),
      );
    }

    // Ensure other required tables exist (these should already exist, but just in case)
    const requiredTables = ['trips', 'users', 'loads', 'epods', 'invoices'];
    
    for (const tableName of requiredTables) {
      const tableExists = await queryRunner.hasTable(tableName);
      if (!tableExists) {
        console.warn(`Warning: Required table '${tableName}' does not exist. Please ensure all migrations are run.`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const table = await queryRunner.getTable('payments');
    
    if (table) {
      const foreignKeys = ['FK_payments_payee', 'FK_payments_payer', 'FK_payments_trip'];
      
      for (const fkName of foreignKeys) {
        const fk = table.foreignKeys.find(fk => fk.name === fkName);
        if (fk) {
          await queryRunner.dropForeignKey('payments', fk);
        }
      }
    }

    // Drop indexes
    const indexNames = [
      'IDX_payments_tenant_payee_status',
      'IDX_payments_tenant_payer_status',
      'IDX_payments_status_due_date',
      'IDX_payments_tenant_payee',
      'IDX_payments_payer_payee',
      'IDX_payments_payee_id',
      'IDX_payments_created_processed',
      'IDX_payments_payment_method_type',
      'IDX_payments_tenant_trip_status',
    ];

    for (const indexName of indexNames) {
      try {
        await queryRunner.dropIndex('payments', indexName);
      } catch (error) {
        // Index might not exist, continue
        console.warn(`Could not drop index ${indexName}:`, error.message);
      }
    }

    // Note: We don't drop the payeeId column or the payments table in the down migration
    // to avoid data loss. This should be done manually if needed.
    console.log('Note: payeeId column and payments table were not dropped to prevent data loss.');
  }
}