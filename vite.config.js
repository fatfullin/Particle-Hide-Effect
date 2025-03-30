import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      // Указываем входной файл библиотеки
      entry: resolve(__dirname, 'src/particle-effect.js'),
      // Имя, под которым библиотека будет доступна глобально (для UMD сборки)
      name: 'ParticleEffect',
      // Имена файлов для разных форматов сборки
      fileName: (format) => `particle-effect.${format}.js`,
    },
    rollupOptions: {
      // Можно добавить внешние зависимости, если они есть (например, 'lodash')
      // external: [],
      output: {
        // Настройки для UMD сборки
        globals: {
          // Пример: если бы мы использовали vue:
          // vue: 'Vue'
        }
      }
    }
  },
  server: {
    // Настройка сервера разработки
    open: '/demo/index.html',
  }
}); 