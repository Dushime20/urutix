import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGeometryColumns1738844424000 implements MigrationInterface {
  name = 'FixGeometryColumns1738844424000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure PostGIS extension is installed
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Helper function to check if column exists
    const columnExists = async (table: string, column: string): Promise<boolean> => {
      const result = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = '${column}'
      `);
      return result.length > 0;
    };

    // Helper function to get column type
    const getColumnType = async (table: string, column: string): Promise<string | null> => {
      const result = await queryRunner.query(`
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = '${table}' AND column_name = '${column}'
      `);
      return result.length > 0 ? result[0].udt_name : null;
    };

    // ============ FIX TRUCKS TABLE ============
    console.log('🚛 Fixing trucks table...');

    // Fix currentLocation column
    const trucksLocationType = await getColumnType('trucks', 'currentLocation');
    if (trucksLocationType && trucksLocationType !== 'geometry') {
      console.log('Converting trucks.currentLocation from', trucksLocationType, 'to geometry');
      await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    } else if (!trucksLocationType) {
      console.log('Adding trucks.currentLocation as geometry');
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    }

    // Add current_address column if missing
    if (!(await columnExists('trucks', 'current_address'))) {
      console.log('Adding trucks.current_address column');
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "current_address" VARCHAR(500)`);
    }

    // Add locationUpdatedAt column if missing
    if (!(await columnExists('trucks', 'locationUpdatedAt'))) {
      console.log('Adding trucks.locationUpdatedAt column');
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "locationUpdatedAt" TIMESTAMP`);
    }

    // ============ FIX DRIVERS TABLE ============
    console.log('👤 Fixing drivers table...');

    // Fix currentLocation column
    const driversLocationType = await getColumnType('drivers', 'currentLocation');
    if (driversLocationType && driversLocationType !== 'geometry') {
      console.log('Converting drivers.currentLocation from', driversLocationType, 'to geometry');
      await queryRunner.query(`ALTER TABLE drivers DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    } else if (!driversLocationType) {
      console.log('Adding drivers.currentLocation as geometry');
      await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    }

    // Add locationUpdatedAt column if missing
    if (!(await columnExists('drivers', 'locationUpdatedAt'))) {
      console.log('Adding drivers.locationUpdatedAt column');
      await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "locationUpdatedAt" TIMESTAMP`);
    }

    // ============ FIX TRIPS TABLE ============
    const tripsTableExists = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'trips' AND table_schema = 'public'
    `);

    if (tripsTableExists.length > 0) {
      console.log('🚚 Fixing trips table...');

      // Fix currentLocation column
      const tripsLocationType = await getColumnType('trips', 'currentLocation');
      if (tripsLocationType && tripsLocationType !== 'geometry') {
        console.log('Converting trips.currentLocation from', tripsLocationType, 'to geometry');
        await queryRunner.query(`ALTER TABLE trips DROP COLUMN IF EXISTS "currentLocation"`);
        await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" geometry(Point, 4326)`);
      } else if (!tripsLocationType) {
        console.log('Adding trips.currentLocation as geometry');
        await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" geometry(Point, 4326)`);
      }
    }

    console.log('✅ All geometry columns and related fields have been fixed!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert trucks
    await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "currentLocation"`);
    await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" jsonb`);
    await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "current_address"`);
    await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "locationUpdatedAt"`);

    // Revert drivers
    await queryRunner.query(`ALTER TABLE drivers DROP COLUMN IF EXISTS "currentLocation"`);
    await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" jsonb`);
    await queryRunner.query(`ALTER TABLE drivers DROP COLUMN IF EXISTS "locationUpdatedAt"`);

    // Revert trips
    const tripsTableExists = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'trips' AND table_schema = 'public'
    `);

    if (tripsTableExists.length > 0) {
      await queryRunner.query(`ALTER TABLE trips DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" jsonb`);
    }
  }
}
