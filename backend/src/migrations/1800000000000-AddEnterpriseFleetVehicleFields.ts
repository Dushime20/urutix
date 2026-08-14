import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEnterpriseFleetVehicleFields1800000000000
  implements MigrationInterface
{
  name = 'AddEnterpriseFleetVehicleFields1800000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns: Array<{ name: string; ddl: string }> = [
      { name: 'manufacturer', ddl: '"manufacturer" character varying(100)' },
      { name: 'chassis', ddl: '"chassis" character varying(100)' },
      {
        name: 'availabilityStatus',
        ddl: '"availabilityStatus" character varying(50) DEFAULT \'AVAILABLE\'',
      },
      { name: 'ownershipType', ddl: '"ownershipType" character varying(50)' },
      { name: 'vehicleClass', ddl: '"vehicleClass" character varying(50)' },
      { name: 'fleetGroup', ddl: '"fleetGroup" character varying(100)' },
      { name: 'businessUnit', ddl: '"businessUnit" character varying(100)' },
      { name: 'costCenter', ddl: '"costCenter" character varying(100)' },
      {
        name: 'chassisConfiguration',
        ddl: '"chassisConfiguration" character varying(50)',
      },
      { name: 'dotNumber', ddl: '"dotNumber" character varying(50)' },
      { name: 'mcNumber', ddl: '"mcNumber" character varying(50)' },
      {
        name: 'operatingAuthority',
        ddl: '"operatingAuthority" character varying(100)',
      },
      {
        name: 'crossBorderPermit',
        ddl: '"crossBorderPermit" character varying(100)',
      },
      { name: 'customsBond', ddl: '"customsBond" character varying(100)' },
      {
        name: 'portAuthorization',
        ddl: '"portAuthorization" character varying(100)',
      },
      {
        name: 'axleConfiguration',
        ddl: '"axleConfiguration" character varying(50)',
      },
      {
        name: 'fuelTankCapacity',
        ddl: '"fuelTankCapacity" numeric(10,2)',
      },
      { name: 'engineModel', ddl: '"engineModel" character varying(100)' },
      { name: 'horsepower', ddl: '"horsepower" numeric(10,2)' },
      { name: 'torque', ddl: '"torque" numeric(10,2)' },
      { name: 'transmission', ddl: '"transmission" character varying(50)' },
      {
        name: 'grossVehicleWeight',
        ddl: '"grossVehicleWeight" numeric(12,2)',
      },
      { name: 'driverRequirements', ddl: '"driverRequirements" text' },
      {
        name: 'operationalRestrictions',
        ddl: '"operationalRestrictions" text',
      },
      {
        name: 'emergencyContacts',
        ddl: '"emergencyContacts" jsonb DEFAULT \'[]\'',
      },
      {
        name: 'complianceDocuments',
        ddl: '"complianceDocuments" jsonb DEFAULT \'{}\'',
      },
    ];

    for (const column of columns) {
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'trucks' AND column_name = '${column.name}'
          ) THEN
            ALTER TABLE "trucks" ADD COLUMN ${column.ddl};
          END IF;
        END $$;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columns = [
      'manufacturer',
      'chassis',
      'availabilityStatus',
      'ownershipType',
      'vehicleClass',
      'fleetGroup',
      'businessUnit',
      'costCenter',
      'chassisConfiguration',
      'dotNumber',
      'mcNumber',
      'operatingAuthority',
      'crossBorderPermit',
      'customsBond',
      'portAuthorization',
      'axleConfiguration',
      'fuelTankCapacity',
      'engineModel',
      'horsepower',
      'torque',
      'transmission',
      'grossVehicleWeight',
      'driverRequirements',
      'operationalRestrictions',
      'emergencyContacts',
      'complianceDocuments',
    ];

    for (const name of columns) {
      await queryRunner.query(
        `ALTER TABLE "trucks" DROP COLUMN IF EXISTS "${name}"`,
      );
    }
  }
}
