const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runStep(name, command) {
    console.log(`\n--- 🚀 Paso: ${name} ---`);
    try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${name} completado.`);
        return true;
    } catch (error) {
        console.error(`\n❌ Error en el paso: ${name}`);
        return false;
    }
}

async function release() {
    console.log('🏁 Iniciando proceso de Release Seguro...\n');

    // 1. Auditoría de Código (Guardian)
    if (!runStep('Auditoría Arquitectónica', 'npm run lint')) return;

    // 2. Validación de Juegos
    if (!runStep('Validación de Motores de Juego', 'npm run validate')) return;

    // 3. Build y Versionado
    if (!runStep('Generación de Presets y Versión', 'npm run build')) return;

    // 4. Git Automático
    console.log('\n--- 📦 Sincronizando con GitHub ---');
    try {
        // Obtener la versión recién generada del SW
        const swPath = path.join(__dirname, '..', 'sw.js');
        const swContent = fs.readFileSync(swPath, 'utf-8');
        const versionMatch = swContent.match(/const CACHE_NAME = 'estudiapp-(v.*)';/);
        const version = versionMatch ? versionMatch[1] : 'update';

        const commitMsg = `release: ${version} - automatizado via Release script`;

        console.log(`📝 Preparando commit: "${commitMsg}"`);
        
        execSync('git add .', { stdio: 'inherit' });
        
        // Comprobar si hay cambios para hacer commit
        const status = execSync('git status --porcelain').toString();
        if (status.trim() === '') {
            console.log('ℹ️ No hay cambios nuevos para subir.');
            return;
        }

        execSync(`git commit -m "${commitMsg}"`, { stdio: 'inherit' });
        
        console.log('📤 Subiendo a GitHub...');
        execSync('git push', { stdio: 'inherit' });

        console.log(`\n🎉 ¡RELEASE EXITOSO! Versión ${version} publicada.`);
    } catch (error) {
        console.error(`\n❌ Error en el proceso de Git: ${error.message}`);
    }
}

release();
