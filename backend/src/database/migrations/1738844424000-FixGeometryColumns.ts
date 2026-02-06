import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixGeometryColumns1738844424000 implements MigrationInterface {
  name = 'FixGeometryColumns1738844424000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure PostGIS extension is installed
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Fix trucks table - convert currentLocation from jsonb to geometry
    const trucksColumnCheck = await queryRunner.query(`
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' AND column_name = 'currentLocation'
    `);

    if (trucksColumnCheck.length > 0 && trucksColumnCheck[0].udt_name !== 'geometry') {
      console.log('Converting trucks.currentLocation from', trucksColumnCheck[0].udt_name, 'to geometry');
      await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    } else if (trucksColumnCheck.length === 0) {
      console.log('Adding trucks.currentLocation as geometry');
      await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    }

    // Fix drivers table - convert currentLocation from jsonb to geometry
    const driversColumnCheck = await queryRunner.query(`
      SELECT udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' AND column_name = 'currentLocation'
    `);

    if (driversColumnCheck.length > 0 && driversColumnCheck[0].udt_name !== 'geometry') {
      console.log('Converting drivers.currentLocation from', driversColumnCheck[0].udt_name, 'to geometry');
      await queryRunner.query(`ALTER TABLE drivers DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    } else if (driversColumnCheck.length === 0) {
      console.log('Adding drivers.currentLocation as geometry');
      await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" geometry(Point, 4326)`);
    }

    // Fix trips table - convert currentLocation from jsonb to geometry
    const tripsTableCheck = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'trips' AND table_schema = 'public'
    `);

    if (tripsTableCheck.length > 0) {
      const tripsColumnCheck = await queryRunner.query(`
        SELECT udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'currentLocation'
      `);

      if (tripsColumnCheck.length > 0 && tripsColumnCheck[0].udt_name !== 'geometry') {
        console.log('Converting trips.currentLocation from', tripsColumnCheck[0].udt_name, 'to geometry');
        await queryRunner.query(`ALTER TABLE trips DROP COLUMN IF EXISTS "currentLocation"`);
        await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" geometry(Point, 4326)`);
      } else if (tripsColumnCheck.length === 0) {
        console.log('Adding trips.currentLocation as geometry');
        await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" geometry(Point, 4326)`);
      }
    }

    console.log('✅ All currentLocation columns have been fixed to use geometry type');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to jsonb (not recommended but provided for rollback)
    await queryRunner.query(`ALTER TABLE trucks DROP COLUMN IF EXISTS "currentLocation"`);
    await queryRunner.query(`ALTER TABLE trucks ADD COLUMN "currentLocation" jsonb`);

    await queryRunner.query(`ALTER TABLE drivers DROP COLUMN IF EXISTS "currentLocation"`);
    await queryRunner.query(`ALTER TABLE drivers ADD COLUMN "currentLocation" jsonb`);

    const tripsTableCheck = await queryRunner.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'trips' AND table_schema = 'public'
    `);

    if (tripsTableCheck.length > 0) {
      await queryRunner.query(`ALTER TABLE trips DROP COLUMN IF EXISTS "currentLocation"`);
      await queryRunner.query(`ALTER TABLE trips ADD COLUMN "currentLocation" jsonb`);
    }
  }
}
