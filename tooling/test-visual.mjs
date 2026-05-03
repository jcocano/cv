#!/usr/bin/env node
// Thin wrapper around `playwright test` so callers can use `--update` as a shorter
// alias for Playwright's native `--update-snapshots`. Documented in
// `docs/verification.md` (Visual baselines section). Only translates `--update`;
// every other flag is forwarded verbatim.

import { spawnSync } from 'node:child_process';

const inputArgs = process.argv.slice(2);
const forwardedArgs = inputArgs.map((arg) => (arg === '--update' ? '--update-snapshots' : arg));

const result = spawnSync('npx', ['playwright', 'test', ...forwardedArgs], {
  stdio: 'inherit',
  shell: false,
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}
process.exit(1);
