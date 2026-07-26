/**
 * Bundles and runs scripts/smoke-render.tsx in Node with jsdom.
 * The bundle is emitted inside the project so that `jsdom` stays resolvable.
 */
import { build } from 'esbuild';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(projectRoot, 'node_modules', '.cache', 'twin');
const outfile = join(outputDir, 'smoke.mjs');
mkdirSync(outputDir, { recursive: true });

try {
  await build({
    entryPoints: [join(projectRoot, 'scripts', 'smoke-render.tsx')],
    bundle: true,
    platform: 'node',
    format: 'esm',
    target: 'node20',
    outfile,
    jsx: 'automatic',
    loader: { '.json': 'json', '.css': 'empty', '.png': 'dataurl' },
    external: ['jsdom'],
    alias: { '@': join(projectRoot, 'src') },
    logLevel: 'warning',
  });
  await import(pathToFileURL(outfile).href);
} finally {
  rmSync(outfile, { force: true });
}
