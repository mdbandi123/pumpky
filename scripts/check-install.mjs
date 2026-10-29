import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Exercise real npm resolution, including lockfile regeneration, away from the working tree.
// npm 11.6 accepted an incomplete optional-peer tree that npm 11.21 rejects in CI.
const manifest = await readFile(new URL('../package.json', import.meta.url), 'utf8');
const lockfile = await readFile(new URL('../package-lock.json', import.meta.url), 'utf8');
const directory = await mkdtemp(join(tmpdir(), 'pumpky-install-check-'));
const npm = (version, args, cwd) => execFileSync(
  'npx', ['--yes', `npm@${version}`, ...args, '--ignore-scripts', '--no-audit', '--no-fund'],
  { cwd, encoding: 'utf8', timeout: 120000, stdio: 'pipe' },
);

try {
  for (const version of ['11.6.2', '11.21.1']) {
    for (const mode of ['existing-lock', 'fresh-lock']) {
      const fixture = await mkdtemp(join(directory, 'fixture-'));
      await writeFile(join(fixture, 'package.json'), manifest);
      if (mode === 'existing-lock') {
        await writeFile(join(fixture, 'package-lock.json'), lockfile);
        // Check the submitted lock before npm install has any chance to repair it.
        npm('11.21.1', ['ci', '--dry-run'], fixture);
      }
      npm(version, ['install', '--package-lock-only'], fixture);
      const regenerated = JSON.parse(await readFile(join(fixture, 'package-lock.json'), 'utf8'));
      for (const name of ['@emnapi/core', '@emnapi/runtime']) {
        assert.equal(regenerated.packages[`node_modules/${name}`]?.version, '1.11.3', `${version} lost ${name}`);
      }
      npm('11.21.1', ['ci', '--dry-run'], fixture);
      console.log(`PASS: npm ${version}, ${mode} regeneration → npm 11.21.1 ci`);
    }
  }
} catch (error) {
  if (error.stderr) console.error(error.stderr.toString());
  throw error;
} finally {
  await rm(directory, { recursive: true, force: true });
}
