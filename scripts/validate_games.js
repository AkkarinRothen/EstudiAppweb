const fs = require('fs');
const path = require('path');

const GAMES_DIR = path.join(__dirname, '..', 'js', 'modules', 'games');

console.log('🔍 Iniciando verificación DoD de juegos en:', GAMES_DIR);

if (!fs.existsSync(GAMES_DIR)) {
    console.error('❌ Error: El directorio de juegos no existe.');
    process.exit(1);
}

const files = fs.readdirSync(GAMES_DIR).filter(file => file.endsWith('.js'));
let hasErrors = false;

files.forEach(file => {
    const filePath = path.join(GAMES_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    console.log(`\n📄 Evaluando: ${file}...`);
    const issues = [];

    // 1. Verificar exportación de clase
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (!classMatch) {
        issues.push('Falta una declaración de clase ES6 modular (export class)');
    } else {
        const className = classMatch[1];
        
        // 2. Verificar constructor
        if (!content.includes('constructor(')) {
            issues.push(`La clase ${className} no define un constructor`);
        }
        
        // 3. Verificar método start()
        if (!content.includes('start(')) {
            issues.push(`La clase ${className} no implementa el método start()`);
        }

        // 4. Verificar método stop()
        if (!content.includes('stop(')) {
            issues.push(`La clase ${className} no implementa el método stop()`);
        } else {
            // Verificar limpieza de listeners
            if (content.includes('addEventListener') && !content.includes('removeEventListener')) {
                issues.push(`Advertencia: Se detectó addEventListener pero no removeEventListener. Asegúrate de limpiar los eventos en stop().`);
            }
        }
    }

    // 5. Advertir sobre el uso de colores planos en CSS inline
    const rawColorsRegex = /['"`](red|blue|green|yellow|black|white)['"`]/gi;
    const colorMatches = content.match(rawColorsRegex);
    if (colorMatches) {
        issues.push(`Advertencia: Se detectó el uso potencial de colores básicos planos (${colorMatches.join(', ')}). Usa variables de tema o HSL.`);
    }

    // 6. Accesibilidad: Verificar si hay elementos clickables sin rol de botón o tabindex
    if (content.includes('onclick') && !content.includes('role=') && !content.includes('tabindex=')) {
        issues.push(`Accesibilidad: Se detectaron eventos onclick directos. Considera añadir role="button" y tabindex="0" para navegación por teclado.`);
    }

    // 7. Rendimiento: Verificar uso excesivo de timers
    const timerCount = (content.match(/setInterval/g) || []).length;
    if (timerCount > 2) {
        issues.push(`Rendimiento: Se detectaron ${timerCount} setIntervals. Considera usar requestAnimationFrame para animaciones fluidas.`);
    }

    // Reportar resultados
    if (issues.length > 0) {
        hasErrors = true;
        issues.forEach(issue => {
            if (issue.startsWith('Advertencia:')) {
                console.log(`  ⚠️  ${issue}`);
            } else {
                console.log(`  ❌  ${issue}`);
            }
        });
    } else {
        console.log('  ✅ Todos los chequeos pasaron correctamente.');
    }
});

console.log('\n=======================================');
if (hasErrors) {
    console.log('⚠️  Validación finalizada con avisos o errores. Revisa la consola.');
} else {
    console.log('🎉 ¡Todos los minijuegos cumplen con las directrices DoD!');
}
