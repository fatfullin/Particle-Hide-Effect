import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // Specify the library entry file
      entry: resolve(__dirname, 'src/particle-effect.js'),
      // Name under which the library will be available globally (for UMD build)
      name: 'ParticleEffect',
      // File names for different build formats
      fileName: (format) => `particle-effect.${format}.js`,
    },
    rollupOptions: {
      // You can add external dependencies if needed (for example, 'lodash')
      // external: [],
      output: {
        // Settings for UMD build
        globals: {
          // Example: if we were using vue:
          // vue: 'Vue'
        }
      }
    }
  },
  server: {
    // Development server configuration
    open: '/demo/index.html',
  }
}); 