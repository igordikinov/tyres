import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Project is served from https://igordikinov.github.io/tyres/ on GitHub Pages,
// so the production build needs the /tyres/ base; local dev stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/tyres/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
}));
