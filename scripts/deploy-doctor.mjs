import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = ['package.json', 'package-lock.json', 'vercel.json'];

console.log('=== Deploy Doctor ===');
console.log(`Node: ${process.version}`);

try {
  const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  console.log(`Git branch: ${branch}`);
  console.log(`Git commit: ${commit}`);
} catch {
  console.log('Git info unavailable');
}

let failed = false;
for (const file of files) {
  try {
    JSON.parse(readFileSync(file, 'utf8'));
    console.log(`OK JSON: ${file}`);
  } catch (error) {
    failed = true;
    console.error(`INVALID JSON: ${file}`);
    console.error(error.message);
  }
}

if (failed) {
  console.error('\nDeploy doctor failed. Fix invalid JSON before deploying.');
  process.exit(1);
}

console.log('\nDeploy doctor passed. Safe to redeploy on Vercel.');
