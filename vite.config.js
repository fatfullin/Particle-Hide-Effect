/**
 * @file vite.config.js
 * @description Конфигурация Vite для проекта Particle Effect
 */

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/js/particle.js'),
      name: 'ParticleEffect',
      fileName: (format) => `particle-effect.${format}.js`
    }
  },
  server: {
    port: 3000,
    open: true
  }
}); 