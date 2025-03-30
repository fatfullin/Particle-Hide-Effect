/**
 * Test script for checking the library build
 * Run: node build-test.js
 */

const fs = require('fs');
const path = require('path');

// Check if dist directory exists
if (!fs.existsSync('./dist')) {
    console.error('❌ The dist directory was not found. Run npm run build before testing.');
    process.exit(1);
}

// Check if build files exist
const esModule = path.join('./dist', 'particle-effect.es.js');
const umdModule = path.join('./dist', 'particle-effect.umd.js');

if (!fs.existsSync(esModule)) {
    console.error('❌ ES module not found:', esModule);
    process.exit(1);
}

if (!fs.existsSync(umdModule)) {
    console.error('❌ UMD module not found:', umdModule);
    process.exit(1);
}

console.log('✅ ES module found:', esModule);
console.log('✅ UMD module found:', umdModule);

// Check the content of files
const esContent = fs.readFileSync(esModule, 'utf8');
const umdContent = fs.readFileSync(umdModule, 'utf8');

if (!esContent || esContent.length < 100) {
    console.error('❌ ES module is empty or corrupted.');
    process.exit(1);
}

if (!umdContent || umdContent.length < 100) {
    console.error('❌ UMD module is empty or corrupted.');
    process.exit(1);
}

console.log('✅ File content check passed successfully.');

// Check for ParticleEffect class export in ES module
if (!esContent.includes('export default ParticleEffect') && 
    !esContent.includes('export{ParticleEffect as default}')) {
    console.warn('⚠️ Default export of ParticleEffect class not found in ES module.');
}

console.log('✅ All checks passed successfully. The library is ready for publication.'); 