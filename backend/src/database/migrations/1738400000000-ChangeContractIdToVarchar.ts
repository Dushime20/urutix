import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeContractIdToVarchar1738400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing table and recreate with varchar ID
    await queryRunner.query(`
      DROP TABLE IF EXISTS load_contracts CASCADE;
    `);

    await queryRunner.query(`
      CREATE TABLE load_contracts (
        id VARCHAR(100) PRIMARY KEY,
        uuid UUID UNIQUE DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        broker_id UUID NOT NULL,
        load_id UUID NOT NULL,
        trip_id UUID,
        cargo_owner_id UUID NOT NULL,
        transporter_id UUID NOT NULL,
        contract_type VARCHAR(50) DEFAULT 'LOAD_AGREEMENT',
        status VARCHAR(50) DEFAULT 'DRAFT',
        agreed_rate DECIMAL(15, 2) NOT NULL,
        currency_code VARCHAR(3) DEFAULT 'KES',
        commission_rate DECIMAL(5, 2) NOT NULL,
        commission_amount DECIMAL(15, 2) NOT NULL,
        payment_terms TEXT,
        payment_due_date DATE,
        pickup_date DATE,
        delivery_date DATE,
        delivery_terms TEXT,
        special_instructions TEXT,
        contract_content TEXT NOT NULL,
        contract_data JSONB DEFAULT '{}',
        cargo_owner_signature JSONB,
        transporter_signature JSONB,
        broker_signature JSONB,
        fully_signed_at DATE,
        negotiation_history JSONB DEFAULT '[]',
        expires_at DATE,
        is_template BOOLEAN DEFAULT false,
        template_id UUID,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (broker_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (cargo_owner_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (transporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX idx_load_contracts_load_status ON load_contracts(load_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_load_contracts_broker_status ON load_contracts(broker_id, status);
    `);
    await queryRunner.query(`
      CREATE INDEX idx_load_contracts_tenant_created ON load_contracts(tenant_id, created_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS load_contracts CASCADE;`);
  }
}
