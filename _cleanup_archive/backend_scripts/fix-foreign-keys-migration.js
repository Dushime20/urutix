const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'src/migrations/1767718165505-AutoMigration.ts');
let content = fs.readFileSync(migrationFile, 'utf8');

// List of all foreign key constraints that need to be wrapped
const foreignKeys = [
  { constraint: 'FK_21583bff1924850686f11dc584c', table: 'loads', column: 'receiverId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_a026a061196d730fffbe636e24f', table: 'loads', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_a358cee1ef4c5dcff97a5f10272', table: 'broker_commissions', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_21f2319bef97eaf987725cc70c5', table: 'broker_commissions', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_e6c038c8ae2cf0214bada49c572', table: 'broker_commissions', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_7f9724b8ec61ef1c761952c037b', table: 'broker_commissions', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_dce6d21200e04aa465ddce00824', table: 'users', column: 'createdByCargoOwnerId', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_5ce0dccba64287f4c7a80b84abb', table: 'users', column: 'brokerTenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_2a79a33e87e05d36c736e5f9fc3', table: 'receipts', column: 'lenderId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_1a1d2f3a4c9d21b263ca8ff63e8', table: 'receipts', column: 'paymentId', refTable: 'payments', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_cc1cf613a556f8950bdf97249ae', table: 'receipts', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_ab25d17b5a92ac5af538d654e10', table: 'receipts', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_415be18e78db9e905c8d9e8e568', table: 'load_documents', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_2ab8ec12304db540bbfdeff264f', table: 'load_documents', column: 'uploadedById', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_496ce1a9b8c94755299948569c7', table: 'load_documents', column: 'verifiedById', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_e2caab28a701cdbe3b1e2d5c618', table: 'load_documents', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_cc8cf8648c75db9b6e3b8dd65cb', table: 'load_documents', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_bd9232f023931886a54546656ef', table: 'load_documents', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_6fa2a66d4fc5c9ed6aec64997f7', table: 'load_contracts', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_e9a7d9a15c93cf5136a773f835f', table: 'load_contracts', column: 'cargoOwnerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_3356dd8eae03e8648833166e081', table: 'load_contracts', column: 'transporterId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_a09738ecd7285ebd64c0dcadd86', table: 'load_contracts', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_30904eb417c5aff0d3de478476f', table: 'load_contracts', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_2b38e8b6d92dad5f3615bab4ab3', table: 'load_contracts', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_f4c1d22f655ac65ac2ae7ebbb93', table: 'insurance_verifications', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_c8e38ff4cf983b82383ad9fa19d', table: 'insurance_verifications', column: 'transporterId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_36f67dfba597d1aff5bc8e704ec', table: 'insurance_verifications', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_3bc7dc48faa06c92aeb2b86fa63', table: 'insurance_verifications', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_58b6d392b802763fda1b8cdd21d', table: 'insurance_claims', column: 'truckId', refTable: 'trucks', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_c5f06645e3bae675fbd70ba1f94', table: 'escrow_accounts', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_c4c1467a4b9f6c8c7a420fc3dcb', table: 'escrow_accounts', column: 'payerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_f26937fa8c08b825ade437ca0b8', table: 'escrow_accounts', column: 'payeeId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_ca7e7291962161050dea16d061d', table: 'escrow_accounts', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_445e8f0b38c4ebe0ff233e21a71', table: 'escrow_accounts', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_b546976662060171c3523ef8834', table: 'escrow_accounts', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_c911209384fb9d2b755b9dea829', table: 'cargo_inspections', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_c1a5e6b0e76c26f532505a716df', table: 'cargo_inspections', column: 'receiverId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_a9b0e3d888ef579cabdb30a508e', table: 'broker_match_recommendations', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_04b44797b1664e5680f400a2e4e', table: 'broker_match_recommendations', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_14e67d4dd5492c56a0f679daf0a', table: 'broker_market_intelligence', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_47e70490a5b218879754c7a821f', table: 'broker_transporter_credit', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_356f1bbdf7650ce9d28e696cc2e', table: 'broker_transporter_credit', column: 'transporterId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_4367f95901a7b729e27df13654e', table: 'broker_multi_stop_loads', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_17ebc5ae664faa3aaab1da7e3e4', table: 'broker_multi_stop_loads', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_e253af914734933f6fbc7294c75', table: 'broker_transporter_performance', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_34d87cd60368863f5736d7af9b5', table: 'broker_transporter_performance', column: 'transporterId', refTable: 'users', refColumn: 'id', onDelete: 'NO ACTION', onUpdate: 'NO ACTION' },
  { constraint: 'FK_7b189ba15e5a12be8b67c36a79d', table: 'broker_disputes', column: 'brokerId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_16602b873bef8ee664ccb95f82e', table: 'broker_disputes', column: 'raisedById', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_5d85309efc67d3ffb51e7b11717', table: 'broker_disputes', column: 'disputedWithId', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_dbc2d053b32474c909b76c45eb5', table: 'broker_disputes', column: 'mediatorId', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_36de7522d44eb3cf8235922f667', table: 'broker_disputes', column: 'loadId', refTable: 'loads', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_8df90aabff9fe37f388e5e3ff19', table: 'broker_disputes', column: 'tripId', refTable: 'trips', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_8932e59084266d93f4b517715a9', table: 'broker_disputes', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_47ae4807b3ed676f608660b8dfa', table: 'insurance_claims', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_d4e396c5a1c8de48961bdf349a2', table: 'insurance_claims', column: 'createdBy', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_42c8e0e8ee2e6953e607e7c2daa', table: 'insurance_claims', column: 'assignedTo', refTable: 'users', refColumn: 'id', onDelete: 'SET NULL', onUpdate: 'NO ACTION' },
  { constraint: 'FK_32881c13a51d3576a0222a6ebde', table: 'insurance_policies', column: 'tenantId', refTable: 'tenants', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' },
  { constraint: 'FK_bf04611ec3fbf4d71b9f8515d43', table: 'insurance_policies', column: 'createdBy', refTable: 'users', refColumn: 'id', onDelete: 'CASCADE', onUpdate: 'NO ACTION' }
];

// Replace each foreign key constraint with conditional version
foreignKeys.forEach(fk => {
  const oldPattern = `ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.constraint}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.refTable}"("${fk.refColumn}") ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}`;
  const newPattern = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${fk.constraint}') THEN ALTER TABLE "${fk.table}" ADD CONSTRAINT "${fk.constraint}" FOREIGN KEY ("${fk.column}") REFERENCES "${fk.refTable}"("${fk.refColumn}") ON DELETE ${fk.onDelete} ON UPDATE ${fk.onUpdate}; END IF; END $$;`;
  
  content = content.replace(oldPattern, newPattern);
});

// Also fix any single $ that might have been created
content = content.replace(/DO \$ BEGIN/g, 'DO $$ BEGIN');
content = content.replace(/END \$;/g, 'END $$;');

fs.writeFileSync(migrationFile, content, 'utf8');
console.log('✅ Fixed all foreign key constraints with conditional checks');
console.log(`✅ Updated ${foreignKeys.length} foreign key constraints`);
