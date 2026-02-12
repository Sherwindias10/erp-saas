import { readFileSync } from 'node:fs';

const manifestFiles = ['package.json', 'package-lock.json', 'vercel.json'];

let hasError = false;

for (const file of manifestFiles) {
  try {
    const raw = readFileSync(file, 'utf8');
    JSON.parse(raw);
    console.log(`OK: ${file}`);
  } catch (error) {
    hasError = true;
    console.error(`INVALID JSON: ${file}`);
    console.error(error.message);
  }
}

if (hasError) {
  process.exit(1);
}

