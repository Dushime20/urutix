#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const seedsDir = __dirname;

async function runSeeds() {
  const files = fs.readdirSync(seedsDir)
    .filter(f => f.endsWith('.js') && f !== 'run-all.js'); // exclude itself

  console.log(`🌱 Found ${files.length} seed files.`);
  
  const { spawn } = require('child_process');

  for (const file of files) {
    const filePath = path.join(seedsDir, file);
    console.log(`\n🚀 Running seed: ${file}`);
    try {
      // run each seed in its own Node process so a seed's process.exit() doesn't terminate the runner
      const proc = spawn(process.execPath, [filePath], { stdio: 'inherit', env: process.env });
      const exitCode = await new Promise((resolve) => proc.on('close', resolve));
      if (exitCode === 0) {
        console.log(`✅ Finished: ${file}`);
      } else {
        console.error(`❌ Failed: ${file} (exit code ${exitCode})`);
      }
    } catch (err) {
      console.error(`❌ Failed: ${file}`, err);
    }
  }

  console.log('\n🎯 All seeds executed!');
}

runSeeds();
