import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey } from 'typeorm';

export class AddReceiverFields1737120000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add createdByCargoOwnerId column to users table
    const usersTable = await queryRunner.getTable('users');
    const hasColumn = usersTable?.findColumnByName('createdByCargoOwnerId');
    
    if (!hasColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'createdByCargoOwnerId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'users',
        new TableForeignKey({
          columnNames: ['createdByCargoOwnerId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }

    // Add receiverId column to loads table if it doesn't exist
    const loadsTable = await queryRunner.getTable('loads');
    const hasReceiverId = loadsTable?.findColumnByName('receiverId');
    
    if (!hasReceiverId) {
      await queryRunner.addColumn(
        'loads',
        new TableColumn({
          name: 'receiverId',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Add foreign key constraint
      await queryRunner.createForeignKey(
        'loads',
        new TableForeignKey({
          columnNames: ['receiverId'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys first
    const loadsTable = await queryRunner.getTable('loads');
    const loadsForeignKey = loadsTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('receiverId') !== -1,
    );
    if (loadsForeignKey) {
      await queryRunner.dropForeignKey('loads', loadsForeignKey);
    }

    const usersTable = await queryRunner.getTable('users');
    const usersForeignKey = usersTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('createdByCargoOwnerId') !== -1,
    );
    if (usersForeignKey) {
      await queryRunner.dropForeignKey('users', usersForeignKey);
    }

    // Remove columns
    const hasReceiverId = loadsTable?.findColumnByName('receiverId');
    if (hasReceiverId) {
      await queryRunner.dropColumn('loads', 'receiverId');
    }

    const hasColumn = usersTable?.findColumnByName('createdByCargoOwnerId');
    if (hasColumn) {
      await queryRunner.dropColumn('users', 'createdByCargoOwnerId');
    }
  }
}

