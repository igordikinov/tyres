/**
 * Bundles and runs scripts/verify-model.ts with the esbuild instance that
 * ships with Vite, so the model check needs no extra tooling.
 */
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const outputDir = mkdtempSync(join(tmpdir(), 'twin-verify-'));
const outfile = join(outputDir, 'verify.mjs');

try {
  await build({
    entryPoints: ['scripts/verify-model.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile,
    loader: { '.json': 'json' },
    logLevel: 'warning',
  });
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
