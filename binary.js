const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

function resignBinaryIfNeeded(filePath) {
  if (process.platform !== 'darwin') return;
  try {
    childProcess.execFileSync('codesign', ['--force', '--sign', '-', filePath], {
      stdio: 'pipe',
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`Binary patch succeeded but macOS ad-hoc signing failed for ${filePath}: ${details}`);
  }
}

function findClaudeBinary() {
  const commands = process.platform === 'win32'
    ? ['where claude', 'where claude.exe']
    : ['which claude'];
  for (const cmd of commands) {
    try {
      const out = childProcess.execSync(cmd, { encoding: 'utf8' }).trim().split(/\r?\n/)[0];
      if (!out) continue;
      if (fs.existsSync(out)) return fs.realpathSync(out);
    } catch {
      continue;
    }
  }
  // Fallback: check common Windows install locations
  if (process.platform === 'win32') {
    const home = process.env.USERPROFILE || process.env.HOME || '';
    const candidates = [
      path.join(home, '.local', 'bin', 'claude.exe'),
      path.join(home, 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return fs.realpathSync(p);
    }
  }
  return null;
}

function resolveBinaryPath(binaryPath) {
  if (!binaryPath) return findClaudeBinary();
  try {
    return fs.realpathSync(binaryPath);
  } catch {
    return fs.existsSync(binaryPath) ? binaryPath : null;
  }
}

function detectBinarySalt(binaryPath) {
  const filePath = resolveBinaryPath(binaryPath);
  if (!filePath || !fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const str = buf.toString('ascii');
  const patterns = [
    /friend-\d{4}-\d+/,
    /ccbf-\d{10}/,
    /lab-\d{11}/,
  ];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match) {
      return { salt: match[0], length: match[0].length, filePath };
    }
  }
  return null;
}

function replaceSaltInBinary({ searchSalt, newSalt, binaryPath }) {
  const filePath = resolveBinaryPath(binaryPath);
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error('Could not find claude binary. Use a valid binary path or install Claude Code first.');
  }
  if (searchSalt.length !== newSalt.length) {
    throw new Error(`Salt length mismatch: "${searchSalt}" is ${searchSalt.length}, "${newSalt}" is ${newSalt.length}.`);
  }

  const buf = fs.readFileSync(filePath);
  const searchBytes = Buffer.from(searchSalt, 'utf8');
  const replaceBytes = Buffer.from(newSalt, 'utf8');
  const offsets = [];
  let pos = 0;
  while (true) {
    const idx = buf.indexOf(searchBytes, pos);
    if (idx === -1) break;
    offsets.push(idx);
    pos = idx + 1;
  }
  if (offsets.length === 0) {
    throw new Error(`Could not find "${searchSalt}" in binary bytes.`);
  }
  for (const offset of offsets) {
    replaceBytes.copy(buf, offset);
  }
  fs.writeFileSync(filePath, buf);
  resignBinaryIfNeeded(filePath);
  return { filePath, patchCount: offsets.length };
}

function applyBinary(newSalt, binaryPath) {
  const detected = detectBinarySalt(binaryPath);
  if (!detected) {
    throw new Error('Could not detect the current salt in the Claude Code binary.');
  }
  const result = replaceSaltInBinary({
    searchSalt: detected.salt,
    newSalt,
    binaryPath: detected.filePath,
  });
  return {
    ...result,
    oldSalt: detected.salt,
    newSalt,
  };
}

function restoreBinary(originalSalt, binaryPath) {
  const detected = detectBinarySalt(binaryPath);
  if (!detected) {
    throw new Error('Could not detect the current salt in the Claude Code binary.');
  }
  if (detected.salt === originalSalt) {
    return {
      filePath: detected.filePath,
      patchCount: 0,
      previousSalt: detected.salt,
      restoredSalt: originalSalt,
    };
  }
  const result = replaceSaltInBinary({
    searchSalt: detected.salt,
    newSalt: originalSalt,
    binaryPath: detected.filePath,
  });
  return {
    ...result,
    previousSalt: detected.salt,
    restoredSalt: originalSalt,
  };
}

module.exports = {
  applyBinary,
  detectBinarySalt,
  findClaudeBinary,
  resolveBinaryPath,
  restoreBinary,
};
