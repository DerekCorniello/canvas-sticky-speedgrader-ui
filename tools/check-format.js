const fs = require('node:fs');
const path = require('node:path');

const files = ['manifest.json', 'content.js', 'content.css', 'package.json', 'README.md', 'test/content.test.js', '.github/workflows/check.yml'];

for (const file of files) {
  const value = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  if (!value.endsWith('\n') || /[\t ]+$/m.test(value)) {
    throw new Error(`${file} has trailing whitespace or no final newline`);
  }
}

for (const file of ['manifest.json', 'package.json']) {
  const value = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  if (`${JSON.stringify(JSON.parse(value), null, 2)}\n` !== value) {
    throw new Error(`${file} must use two-space JSON formatting`);
  }
}
