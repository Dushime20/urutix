import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateLoadMatchesTable1737388337000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the MatchStatus enum if it doesn't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "match_status_enum" AS ENUM ('POTENTIAL', 'REQUESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create the load_matches table
    await queryRunner.createTable(
      new Table({
        name: 'load_matches',
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
            name: 'loadId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'truckId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'score',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'match_status_enum',
            default: "'POTENTIAL'",
          },
          {
            name: 'matchDetails',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes for performance
    await queryRunner.createIndex(
      'load_matches',
      new TableIndex({
        name: 'IDX_load_matches_truck_status',
        columnNames: ['truckId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'load_matches',
      new TableIndex({
        name: 'IDX_load_matches_load_status',
        columnNames: ['loadId', 'status'],
      }),
    );

    await queryRunner.createIndex(
      'load_matches',
      new TableIndex({
        name: 'IDX_load_matches_tenant',
        columnNames: ['tenantId'],
      }),
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'load_matches',
      new TableForeignKey({
        columnNames: ['loadId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'loads',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'load_matches',
      new TableForeignKey({
        columnNames: ['truckId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'trucks',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const table = await queryRunner.getTable('load_matches');
    if (table) {
      const foreignKeys = table.foreignKeys;
      for (const foreignKey of foreignKeys) {
        await queryRunner.dropForeignKey('load_matches', foreignKey);
      }
    }

    // Drop the table
    await queryRunner.dropTable('load_matches', true);

    // Optionally drop the enum (only if not used elsewhere)
    // await queryRunner.query(`DROP TYPE IF EXISTS "match_status_enum"`);
  }
}
