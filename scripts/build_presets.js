const fs = require('fs');
const path = require('path');
const { generateHtml } = require('./lib/presets_template');

const packsFile = path.join(__dirname, '..', 'data', 'packs.json');
const vocabDir = path.join(__dirname, '..', 'data', 'vocab');
const presetsDir = path.join(__dirname, '..', 'presets');

if (!fs.existsSync(presetsDir)) {
    fs.mkdirSync(presetsDir, { recursive: true });
}

// Read catalog packs.json
let packs = [];
try {
    const packsRaw = fs.readFileSync(packsFile, 'utf-8');
    packs = JSON.parse(packsRaw);
} catch (e) {
    console.error("Error reading data/packs.json:", e);
    process.exit(1);
}

// Generate preset for each pack in the catalog
packs.forEach(pack => {
    const vocabFile = path.join(vocabDir, `${pack.id}.json`);
    if (!fs.existsSync(vocabFile)) {
        console.warn(`Warning: Vocabulary file not found for pack: ${pack.id} (${vocabFile}). Skipping.`);
        return;
    }

    let entries = [];
    try {
        const vocabRaw = fs.readFileSync(vocabFile, 'utf-8');
        entries = JSON.parse(vocabRaw);
    } catch (e) {
        console.error(`Error reading vocabulary for pack ${pack.id}:`, e);
        return;
    }

    if (entries.length === 0) {
        console.warn(`Warning: Vocabulary list is empty for pack: ${pack.id}. Skipping.`);
        return;
    }

    // Format entries to JS object literals string
    const entriesJson = entries.map(e => {
        const txt = e.text.replace(/"/g, '\\"');
        const ex = (e.example || '').replace(/"/g, '\\"');
        return `{min:${e.min}, max:${e.max}, text:"${txt}", example:"${ex}"}`;
    }).join(',');

    const formula = `1d${entries.length}`;
    const htmlContent = generateHtml(pack.title, pack.desc, entriesJson, formula);

    const destPath = path.join(presetsDir, `${pack.id}.html`);
    fs.writeFileSync(destPath, htmlContent, 'utf-8');
    console.log(`Successfully generated preset: presets/${pack.id}.html (${entries.length} words, formula: ${formula})`);
});
