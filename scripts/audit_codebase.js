const fs = require('fs');
const path = require('path');

const MODULES_DIR = path.join(__dirname, '..', 'js', 'modules');

console.log('🛡️  Iniciando Auditoría de Calidad Frontend (Staff Level)...');

const auditResults = {
    redundancies: [],
    security: [],
    complexity: []
};

function auditFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);

    // 1. Redundancia: Buscar variables globales sin 'export' o 'const/let'
    if (content.includes('window.') && !fileName.includes('supabase')) {
        auditResults.redundancies.push(`${fileName}: Uso de 'window.' detectado. Considera centralizar el estado en un módulo.`);
    }

    // 2. Seguridad: Uso de innerHTML sin sanitizar
    if (content.includes('.innerHTML =') || content.includes('.innerHTML+=')) {
        auditResults.security.push(`${fileName}: Uso de innerHTML detectado. Asegúrate de que los datos estén sanitizados.`);
    }

    // 3. Complejidad: Funciones muy largas (estimación por líneas)
    const lines = content.split('\n');
    if (lines.length > 400) {
        auditResults.complexity.push(`${fileName}: El módulo excede las 400 líneas. Considera dividirlo.`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (file.endsWith('.js')) {
            auditFile(fullPath);
        }
    });
}

walkDir(MODULES_DIR);

console.log('\n📊 RESULTADOS DE LA AUDITORÍA:');
console.log('=======================================');

if (auditResults.redundancies.length > 0) {
    console.log('\n🔄 Redundancias y Estado:');
    auditResults.redundancies.forEach(r => console.log(`  - ${r}`));
}

if (auditResults.security.length > 0) {
    console.log('\n🔒 Seguridad:');
    auditResults.security.forEach(s => console.log(`  - ${s}`));
}

if (auditResults.complexity.length > 0) {
    console.log('\n🧩 Complejidad Estructural:');
    auditResults.complexity.forEach(c => console.log(`  - ${c}`));
}

if (Object.values(auditResults).every(arr => arr.length === 0)) {
    console.log('🎉 ¡Excelente! No se detectaron problemas críticos de arquitectura.');
}
console.log('\n=======================================');
