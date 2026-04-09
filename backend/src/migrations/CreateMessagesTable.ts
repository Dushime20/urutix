import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateMessagesTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'thread_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'recipient_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'sender_role',
            type: 'enum',
            enum: ['DRIVER', 'SHIPPER', 'CARGO_OWNER', 'TRUCK_OWNER', 'DISPATCH', 'SYSTEM'],
            default: "'SYSTEM'",
          },
          {
            name: 'is_read',
            type: 'boolean',
            default: false,
          },
          {
            name: 'trip_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'load_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'tenant_id',
            type: 'uuid',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_sender_recipient',
        columnNames: ['sender_id', 'recipient_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_thread_id',
        columnNames: ['thread_id'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_created_at',
        columnNames: ['created_at'],
      }),
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_is_read',
        columnNames: ['is_read'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['sender_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        columnNames: ['recipient_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
  }
}
