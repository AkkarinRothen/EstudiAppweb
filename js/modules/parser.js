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
 * @returns {Object} { title, formula, desc, entries }
 */
export function parseImportedCsv(text) {
    const lines = text.split('\n');
    let title = "Tabla Importada";
    let formula = "1d8";
    let desc = "Practica con tu tabla didáctica importada.";
    const entries = [];

    const isTsv = text.includes('\t');

    for (let line of lines) {
        line = line.trim();
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
            if (!isNaN(min) && !isNaN(max) && textRaw !== "Entrada") {
                entries.push({ min, max, text: textRaw });
            }
        } else if (isTsv && matches.length === 2) {
            const index = entries.length + 1;
            const esVal = matches[0].replace(/"/g, '').trim();
            const enVal = matches[1].replace(/"/g, '').trim();
            if (esVal && enVal) {
                entries.push({ min: index, max: index, text: `${esVal} -> ${enVal}` });
            }
        }
    }
    
    if (entries.length > 0 && (formula === "1d8" || formula === "")) {
        formula = `1d${entries.length}`;
    }
    return { title, formula, desc, entries };
}
