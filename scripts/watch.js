const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BUILD_SCRIPT = path.join(__dirname, 'build_presets.js');

console.log('👀 Vigilante de EstudiApp iniciado...');
console.log(`📂 Monitoreando cambios en: ${DATA_DIR}`);

let timeout = null;

function runBuild() {
    console.log('\n📦 Cambio detectado. Iniciando build automático...');
    exec(`node "${BUILD_SCRIPT}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error en el build: ${error.message}`);
            return;
        }
        if (stderr) {
            console.warn(`⚠️ Advertencia: ${stderr}`);
        }
        console.log(stdout);
        console.log('✅ Build completado con éxito.');
    });
}

// Usamos un pequeño delay (debounce) para evitar disparar múltiples builds si se guardan varios archivos a la vez
function debounceBuild() {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(runBuild, 500);
}

// Vigilamos la carpeta data de forma recursiva
fs.watch(DATA_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.json')) {
        debounceBuild();
    }
});
