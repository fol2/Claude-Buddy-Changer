#!/usr/bin/env node

const { applyBinary, detectBinarySalt, findClaudeBinary } = require('./binary.js');
const { getRecordedOriginalSalt, recordOriginalSalt } = require('./state.js');

const newSalt = process.argv[2];
if (!newSalt) {
  console.error('Usage: node apply-buddy.js <salt>');
  console.error('Example: node apply-buddy.js lab-00000039057');
  process.exit(1);
}

const binaryPath = findClaudeBinary();
if (!binaryPath) {
  console.error('Could not find Claude binary.');
  process.exit(1);
}

console.log('Binary found:', binaryPath);

const detected = detectBinarySalt(binaryPath);
if (!detected) {
  console.error('Could not detect current salt in binary.');
  process.exit(1);
}

console.log('Current salt:', detected.salt);
console.log('New salt:', newSalt);

if (detected.salt.length !== newSalt.length) {
  console.error(`Salt length mismatch: current="${detected.salt}" (${detected.salt.length}), new="${newSalt}" (${newSalt.length})`);
  process.exit(1);
}

recordOriginalSalt(binaryPath, detected.salt);
const result = applyBinary(newSalt, binaryPath);
console.log('Applied successfully!');
console.log('Patched', result.patchCount, 'location(s)');
console.log('Old salt:', result.oldSalt);
console.log('New salt:', result.newSalt);
console.log('\nRestart Claude Code to see your new buddy.');
