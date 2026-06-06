const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'js', 'modules');
const GAMES_DIR = path.join(MODULES_DIR, 'games');

console.log('🛡️  Guardian.js: Protegiendo los mandamientos de EstudiApp...');

const violations = [];

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // Mandamiento: Prohibido usar localStorage directamente (excepto en storage.js)
    if (content.includes('localStorage.') && fileName !== 'storage.js') {
        violations.push(`${fileName}: Violación del Mandamiento #6. Usa el módulo 'storage.js' para persistencia.`);
    }

    // Mandamiento: Motores de juego aislados (no lógica de juegos en StudyEngine)
    if (fileName === 'study-engine.js') {
        const gameKeywords = ['wordle', 'sniper', 'bubble', 'diagram'];
        gameKeywords.forEach(game => {
            if (content.includes(`class ${game.charAt(0).toUpperCase() + game.slice(1)}Game`)) {
                 violations.push(`${fileName}: Violación del Mandamiento #2. La lógica del juego '${game}' debe estar en su propio archivo.`);
            }
        });
    }

    // Mandamiento: Efectos Centralizados
    if (fileName.endsWith('.js') && fileName !== 'fx.js' && !filePath.includes('games')) {
        if (content.includes('anime({') || content.includes('new Howl')) {
            violations.push(`${fileName}: Violación del Mandamiento #3. Centraliza los efectos y sonidos en 'fx.js'.`);
        }
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.js')) {
            checkFile(fullPath);
        }
    });
}

walkDir(MODULES_DIR);

console.log('\n⚖️  INFORME DEL GUARDIÁN:');
console.log('=======================================');

if (violations.length > 0) {
    console.log('\n❌ Se detectaron violaciones arquitectónicas graves:');
    violations.forEach(v => console.log(`  - ${v}`));
} else {
    console.log('🎉 ¡Perfecto! El código respeta todos los mandamientos técnicos.');
}
console.log('\n=======================================');
