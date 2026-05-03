#!/usr/bin/env node
/* eslint-disable */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const isMinor = args.includes('--minor');
const noCommit = args.includes('--no-commit');
const stagedOnly = args.includes('--commit-staged-only');
const descIdx = args.indexOf('--desc');
const desc = descIdx !== -1 ? args[descIdx + 1] : 'build update';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const versionPath = path.join(root, 'version.json');
const packagePath = path.join(root, 'package.json');
const buildNotesPath = path.join(root, 'build-notes.md');

const version = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (isMinor) { version.minor += 1; version.build = 1; } else { version.build += 1; }
version.currentVersion = version.weekCode + '-' + version.minor + '.' + version.build;
pkg.version = version.currentVersion;

fs.writeFileSync(versionPath, JSON.stringify(version, null, 2) + '\n');
fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
fs.appendFileSync(buildNotesPath, '- ' + version.currentVersion + ' — ' + desc + '\n');
console.log('Version bumped to ' + version.currentVersion);

if (!noCommit) {
  try {
    if (stagedOnly) {
      execSync('git add version.json package.json build-notes.md', { cwd: root, stdio: 'inherit' });
    } else {
      execSync('git add -A', { cwd: root, stdio: 'inherit' });
    }
    execSync('git commit -m "' + version.currentVersion + ': ' + desc + '"', { cwd: root, stdio: 'inherit' });
    console.log('Committed.');
  } catch (e) {
    console.error('Commit failed:', e.message);
  }
}
