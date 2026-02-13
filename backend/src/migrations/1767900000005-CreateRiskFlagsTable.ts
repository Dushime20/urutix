import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRiskFlagsTable1767900000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if table already exists
    const riskFlagsExists = await queryRunner.hasTable('risk_flags');

    if (riskFlagsExists) {
      console.log('✓ risk_flags table already exists, skipping...');
      return;
    }

    // Create risk_flags table
    await queryRunner.query(`
      CREATE TABLE risk_flags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Target
        "userId" UUID NOT NULL,
        "tenantId" UUID NOT NULL,
        
        -- Flag details
        "flagType" VARCHAR(50) NOT NULL CHECK ("flagType" IN (
          'suspicious_activity', 'rapid_posting', 'price_anomaly', 
          'payment_pattern', 'duplicate_account', 'bot_behavior', 'other'
        )),
        severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        "riskScore" INTEGER CHECK ("riskScore" BETWEEN 0 AND 100),
        
        -- Detection
        "detectedBy" VARCHAR(50) DEFAULT 'system',
        "detectionMethod" VARCHAR(100),
        
        -- Details
        description TEXT,
        evidence JSONB,
        "relatedEntities" JSONB,
        
        -- Status
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
          'pending', 'investigating', 'confirmed', 'false_positive', 'resolved'
        )),
        
        -- Review
        "reviewedBy" UUID,
        "reviewedAt" TIMESTAMP,
        "reviewNotes" TEXT,
        
        -- Action taken
        "enforcementActionId" UUID,
        
        -- Timestamps
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW(),
        "resolvedAt" TIMESTAMP,
        
        CONSTRAINT fk_risk_flags_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_risk_flags_tenant FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE CASCADE,
        CONSTRAINT fk_risk_flags_reviewed_by FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_risk_flags_enforcement_action FOREIGN KEY ("enforcementActionId") REFERENCES enforcement_actions(id) ON DELETE SET NULL
      );
    `);
    console.log('✅ Created risk_flags table');

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_user ON risk_flags("userId");
    `);

    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_tenant ON risk_flags("tenantId");
    `);

    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_status ON risk_flags(status);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_severity ON risk_flags(severity);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_created ON risk_flags("createdAt" DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_risk_flags_flag_type ON risk_flags("flagType");
    `);

    console.log('✅ risk_flags migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS risk_flags CASCADE;`);
  }
}
