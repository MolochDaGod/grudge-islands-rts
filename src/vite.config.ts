import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 3000,
    open: '/game.html',
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          // Tiny Swords sprite pack - Units folder
          src: '../Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets/Units',
          dest: 'sprites/tiny-swords'
        },
        {
          // Tiny Swords sprite pack - Terrain folder
          src: '../Tiny Swords (Free Pack)/Tiny Swords (Free Pack)/2DAssets/Terrain',
          dest: 'sprites/tiny-swords'
        },
        {
          // MiniWorld sprites
          src: '../addons/MiniWorldSprites/Characters',
          dest: 'sprites/miniworld'
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: 'game.html',
    },
  },
});
