/**
 * Тестовый скрипт для проверки сборки библиотеки
 * Запуск: node build-test.js
 */

const fs = require('fs');
const path = require('path');

// Проверка наличия директории dist
if (!fs.existsSync('./dist')) {
    console.error('❌ Директория dist не найдена. Выполните npm run build перед тестированием.');
    process.exit(1);
}

// Проверка наличия файлов сборки
const esModule = path.join('./dist', 'particle-effect.es.js');
const umdModule = path.join('./dist', 'particle-effect.umd.js');

if (!fs.existsSync(esModule)) {
    console.error('❌ ES модуль не найден:', esModule);
    process.exit(1);
}

if (!fs.existsSync(umdModule)) {
    console.error('❌ UMD модуль не найден:', umdModule);
    process.exit(1);
}

console.log('✅ ES модуль найден:', esModule);
console.log('✅ UMD модуль найден:', umdModule);

// Проверка содержимого файлов
const esContent = fs.readFileSync(esModule, 'utf8');
const umdContent = fs.readFileSync(umdModule, 'utf8');

if (!esContent || esContent.length < 100) {
    console.error('❌ ES модуль пуст или повреждён.');
    process.exit(1);
}

if (!umdContent || umdContent.length < 100) {
    console.error('❌ UMD модуль пуст или повреждён.');
    process.exit(1);
}

console.log('✅ Проверка содержимого файлов прошла успешно.');

// Проверка экспорта класса ParticleEffect в ES модуле
if (!esContent.includes('export default ParticleEffect') && 
    !esContent.includes('export{ParticleEffect as default}')) {
    console.warn('⚠️ В ES модуле не найден экспорт по умолчанию класса ParticleEffect.');
}

console.log('✅ Все проверки пройдены успешно. Библиотека готова к публикации.'); 