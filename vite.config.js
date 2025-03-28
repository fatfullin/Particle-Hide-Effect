/**
 * @file vite.config.js
 * @description Конфигурация Vite для проекта Particle Effect
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/Particle-Hide-Effect/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        example: resolve(__dirname, 'examples/basic.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 