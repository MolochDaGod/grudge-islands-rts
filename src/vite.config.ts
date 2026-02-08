import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  root: '.',
  base: './',
  publicDir: false, // Don't auto-copy publicDir
  server: {
    port: 3000,
    open: '/game.html',
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'dist/tiny-swords',
          dest: '',
        },
        {
          src: 'dist/miniworld',
          dest: '',
        },
        {
          src: 'dist/heroes',
          dest: '',
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
