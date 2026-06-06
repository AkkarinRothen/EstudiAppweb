// CSV and TSV Parser Module

/**
 * Parses a single CSV row handling quotes
 * @param {string} row 
 * @returns {Array<string>}
 */
export function parseCsvRow(row) {
    const result = [];
    let insideQuote = false;
    let entries = '';
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(entries.trim());
            entries = '';
        } else {
            entries += char;
        }
    }
    result.push(entries.trim());
    return result;
}

/**
 * Parses an imported CSV/TSV text into a deck object
 * @param {string} text 
 * @returns {Object} { title, formula, desc, entries, errors }
 */
export function parseImportedCsv(text) {
    const lines = text.split('\n');
    let title = "Tabla Importada";
    let formula = "1d8";
    let desc = "Practica con tu tabla didáctica importada.";
    const entries = [];
    const errors = [];

    const isTsv = text.includes('\t');

    for (let idx = 0; idx < lines.length; idx++) {
        let line = lines[idx].trim();
        const lineNum = idx + 1;
        if (!line) continue;

        if (line.startsWith('#')) {
            if (line.startsWith('# Tabla:')) {
                title = line.replace('# Tabla:', '').trim();
            } else if (line.startsWith('# Fórmula de tirada:')) {
                formula = line.replace('# Fórmula de tirada:', '').trim();
            } else if (line.startsWith('# Descripción:')) {
                desc = line.replace('# Descripción:', '').trim();
            }
            continue;
        }

        let matches = [];
        if (isTsv) {
            matches = line.split('\t').map(s => s.trim());
        } else {
            matches = parseCsvRow(line);
        }
        
        if (matches.length >= 3) {
            const minStr = matches[0].replace(/"/g, '').trim();
            const maxStr = matches[1].replace(/"/g, '').trim();
            const textRaw = matches[2].replace(/"/g, '').trim();
            
            const min = parseInt(minStr);
            const max = parseInt(maxStr);
            if (!isNaN(min) && !isNaN(max)) {
                if (textRaw !== "Entrada" && textRaw.includes("->")) {
                    entries.push({ min, max, text: textRaw });
                } else if (textRaw !== "Entrada") {
                    errors.push(`Línea ${lineNum}: El texto "${textRaw}" no contiene el separador obligatiorio '->'`);
                }
            } else {
                errors.push(`Línea ${lineNum}: Rangos de dado inválidos (Mín: "${minStr}", Máx: "${maxStr}")`);
            }
        } else if (isTsv && matches.length === 2) {
            const index = entries.length + 1;
            const esVal = matches[0].replace(/"/g, '').trim();
            const enVal = matches[1].replace(/"/g, '').trim();
            if (esVal && enVal) {
                entries.push({ min: index, max: index, text: `${esVal} -> ${enVal}` });
            } else {
                errors.push(`Línea ${lineNum}: Columnas de vocabulario incompletas`);
            }
        } else if (!isTsv && matches.length === 2) {
            // Support simple 2-column CSV (es, en)
            const index = entries.length + 1;
            const esVal = matches[0].replace(/"/g, '').trim();
            const enVal = matches[1].replace(/"/g, '').trim();
            if (esVal && enVal) {
                entries.push({ min: index, max: index, text: `${esVal} -> ${enVal}` });
            } else {
                errors.push(`Línea ${lineNum}: Columnas de vocabulario incompletas`);
            }
        } else {
            errors.push(`Línea ${lineNum}: Columnas insuficientes (Encontradas: ${matches.length}, esperadas: 2 o 3)`);
        }
    }
    
    if (entries.length > 0 && (formula === "1d8" || formula === "")) {
        formula = `1d${entries.length}`;
    }
    return { title, formula, desc, entries, errors };
}
