const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, 'src/migrations/1767718165505-AutoMigration.ts');
let content = fs.readFileSync(migrationFile, 'utf8');

// List of all foreign key constraints that need to be wrapped
const foreignKeys = [
  'FK_21583bff1924850686f11dc584c',
  'FK_a026a061196d730fffbe636e24f',
  'FK_a358cee1ef4c5dcff97a5f10272',
  'FK_21f2319bef97eaf987725cc70c5',
  'FK_e6c038c8ae2cf0214bada49c572',
  'FK_7f9724b8ec61ef1c761952c037b',
  'FK_dce6d21200e04aa465ddce00824',
  'FK_5ce0dccba64287f4c7a80b84abb',
  'FK_2a79a33e87e05d36c736e5f9fc3',
  'FK_1a1d2f3a4c9d21b263ca8ff63e8',
  'FK_cc1cf613a556f8950bdf97249ae',
  'FK_ab25d17b5a92ac5af538d654e10',
  'FK_415be18e78db9e905c8d9e8e568',
  'FK_2ab8ec12304db540bbfdeff264f',
  'FK_496ce1a9b8c94755299948569c7',
  'FK_e2caab28a701cdbe3b1e2d5c618',
  'FK_cc8cf8648c75db9b6e3b8dd65cb',
  'FK_bd9232f023931886a54546656ef',
  'FK_6fa2a66d4fc5c9ed6aec64997f7',
  'FK_e9a7d9a15c93cf5136a773f835f',
  'FK_3356dd8eae03e8648833166e081',
  'FK_a09738ecd7285ebd64c0dcadd86',
  'FK_30904eb417c5aff0d3de478476f',
  'FK_2b38e8b6d92dad5f3615bab4ab3',
  'FK_f4c1d22f655ac65ac2ae7ebbb93',
  'FK_c8e38ff4cf983b82383ad9fa19d',
  'FK_36f67dfba597d1aff5bc8e704ec',
  'FK_3bc7dc48faa06c92aeb2b86fa63',
  'FK_58b6d392b802763fda1b8cdd21d',
  'FK_c5f06645e3bae675fbd70ba1f94',
  'FK_c4c1467a4b9f6c8c7a420fc3dcb',
  'FK_f26937fa8c08b825ade437ca0b8',
  'FK_ca7e7291962161050dea16d061d',
  'FK_445e8f0b38c4ebe0ff233e21a71',
  'FK_b546976662060171c3523ef8834',
  'FK_c911209384fb9d2b755b9dea829',
  'FK_c1a5e6b0e76c26f532505a716df',
  'FK_a9b0e3d888ef579cabdb30a508e',
  'FK_04b44797b1664e5680f400a2e4e',
  'FK_14e67d4dd5492c56a0f679daf0a',
  'FK_47e70490a5b218879754c7a821f',
  'FK_356f1bbdf7650ce9d28e696cc2e',
  'FK_4367f95901a7b729e27df13654e',
  'FK_17ebc5ae664faa3aaab1da7e3e4',
  'FK_e253af914734933f6fbc7294c75',
  'FK_34d87cd60368863f5736d7af9b5',
  'FK_7b189ba15e5a12be8b67c36a79d',
  'FK_16602b873bef8ee664ccb95f82e',
  'FK_5d85309efc67d3ffb51e7b11717',
  'FK_dbc2d053b32474c909b76c45eb5',
  'FK_36de7522d44eb3cf8235922f667',
  'FK_8df90aabff9fe37f388e5e3ff19',
  'FK_8932e59084266d93f4b517715a9',
  'FK_47ae4807b3ed676f608660b8dfa',
  'FK_d4e396c5a1c8de48961bdf349a2',
  'FK_42c8e0e8ee2e6953e607e7c2daa',
  'FK_32881c13a51d3576a0222a6ebde',
  'FK_bf04611ec3fbf4d71b9f8515d43'
];

let count = 0;

// Replace each foreign key constraint with conditional version
foreignKeys.forEach(fk => {
  // Match the entire ALTER TABLE ... ADD CONSTRAINT line
  const regex = new RegExp(
    `(await queryRunner\\.query\\(\`)(ALTER TABLE "[^"]*" ADD CONSTRAINT "${fk}" FOREIGN KEY \\("[^"]*"\\) REFERENCES "[^"]*"\\("[^"]*"\\) ON DELETE [A-Z ]+ ON UPDATE [A-Z ]+)(\`\\);)`,
    'g'
  );
  
  const replacement = `$1DO \\$\\$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${fk}') THEN $2; END IF; END \\$\\$;$3`;
  
  const newContent = content.replace(regex, replacement);
  if (newContent !== content) {
    count++;
    content = newContent;
  }
});

fs.writeFileSync(migrationFile, content, 'utf8');
console.log(`✅ Fixed ${count} foreign key constraints with conditional checks`);
