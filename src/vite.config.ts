import { defineConfig, Plugin } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';
import fs from 'fs';

const repoRoot = path.resolve(__dirname, '..');

// Maps URL prefixes to actual directories on disk (relative to repo root)
const assetMappings: Record<string, string> = {
  '/sprites/tiny-swords/': path.join(repoRoot, 'Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets/'),
  '/sprites/miniworld/':   path.join(repoRoot, 'addons/MiniWorldSprites/'),
  '/sprites/bulletcolors/': path.join(repoRoot, 'sprites/bulletcolors/'),
  '/effects/':             path.join(repoRoot, 'effects/'),
};

/** Vite plugin that serves sprite assets from repo-root directories during dev. */
function serveRepoAssets(): Plugin {
  return {
    name: 'serve-repo-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0]; // strip query string
        if (!url) return next();
        for (const [prefix, diskDir] of Object.entries(assetMappings)) {
          if (url.startsWith(prefix)) {
            const relPath = decodeURIComponent(url.slice(prefix.length));
            const filePath = path.join(diskDir, relPath);
            if (fs.existsSync(filePath)) {
              return res.end(fs.readFileSync(filePath));
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  root: '.',
  base: './',
  publicDir: false,
  server: {
    port: 3000,
    open: '/game.html',
  },
  plugins: [
    serveRepoAssets(),
    viteStaticCopy({
      targets: [
        {
          src: '../Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets',
          dest: 'sprites',
          rename: 'tiny-swords',
        },
        {
          src: '../addons/MiniWorldSprites',
          dest: 'sprites',
          rename: 'miniworld',
        },
        {
          src: '../sprites/bulletcolors',
          dest: 'sprites',
        },
        {
          src: '../effects',
          dest: '',
        },
      ],
    }),
  ],
  build: {
    outDir: '../output',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: 'game.html',
    },
  },
});
