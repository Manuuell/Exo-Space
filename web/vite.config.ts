import { defineConfig } from 'vite';

// Relative paths: the build has to open from any folder or subdirectory
// (GitHub Pages, itch.io), not only from the root of a domain.
export default defineConfig({
  base: './',
  // All of Three.js is around 600 kB uncompressed (about 150 kB gzipped):
  // that is expected for a 3D game, not something to split up.
  build: { chunkSizeWarningLimit: 800 },
  server: { port: 5173, host: '127.0.0.1' },
});
