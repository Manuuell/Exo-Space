import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

/** The published site opens on the game: play.html goes out as index.html. */
function gameAsIndex(): Plugin {
  return {
    name: 'game-as-index',
    enforce: 'post',
    generateBundle(_, bundle) {
      const page = bundle['play.html'];
      if (!page || page.type !== 'asset') return;
      delete bundle['play.html'];
      this.emitFile({ type: 'asset', fileName: 'index.html', source: page.source });
    },
  };
}

// Relative paths: the build has to open from any folder or subdirectory
// (GitHub Pages, itch.io), not only from the root of a domain.
//
// `npm run build` builds index.html, the starter scene; `npm run build:site`
// builds the game for the public site into dist-site/, with the game as its
// front page.
export default defineConfig(({ mode }) => ({
  base: './',
  // All of Three.js is around 600 kB uncompressed (about 150 kB gzipped):
  // that is expected for a 3D game, not something to split up. The whole
  // game, models and all, is under 900 kB.
  build: mode === 'site'
    ? { outDir: 'dist-site', emptyOutDir: true, chunkSizeWarningLimit: 1000, rollupOptions: { input: { game: 'play.html' } } }
    : { chunkSizeWarningLimit: 800 },
  plugins: mode === 'site' ? [gameAsIndex()] : [],
  server: { port: 5173, host: '127.0.0.1' },
}));
