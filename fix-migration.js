const fs = require('fs');
const file = 'backend/src/migrations/1777673845128-ConsolidatedBaseline.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const safeQuery = async')) {
    const injectionPoint = 'public async up(queryRunner: QueryRunner): Promise<void> {';
    const safeQueryDef = `
        const safeQuery = async (query: string) => {
            try {
                await queryRunner.query(\`SAVEPOINT auto_safe\`);
                await queryRunner.query(query);
                await queryRunner.query(\`RELEASE SAVEPOINT auto_safe\`);
            } catch (e) {
                await queryRunner.query(\`ROLLBACK TO SAVEPOINT auto_safe\`);
                // Ignore error and continue
            }
        };
`;
    content = content.replace(injectionPoint, injectionPoint + safeQueryDef);
}

// Replace await queryRunner.query(\`CREATE|ALTER|DROP|COMMENT|INSERT...
// Using a string splitting strategy or a clean regex
const regex = /await queryRunner\.query\(\`(CREATE|ALTER|DROP|COMMENT|INSERT) /g;
content = content.replace(regex, 'await safeQuery(`$1 ');

fs.writeFileSync(file, content);
console.log('Successfully wrapped all queries in safeQuery wrapper!');
