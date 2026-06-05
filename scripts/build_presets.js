const fs = require('fs');
const path = require('path');
const { generateHtml } = require('./lib/presets_template');

const presetsDir = path.join(__dirname, '..', 'presets');

// Read all presets and rebuild them using the modular template
fs.readdir(presetsDir, (err, files) => {
    if (err) {
        console.error("Error reading presets directory:", err);
        process.exit(1);
    }

    const htmlFiles = files.filter(f => f.endsWith('.html'));

    htmlFiles.forEach(file => {
        const filePath = path.join(presetsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Extract current data from existing file to preserve content
        const titleMatch = content.match(/<h1>([^<]+)<\/h1>/) || content.match(/<title>([^<]+)<\/title>/);
        const title = titleMatch ? titleMatch[1].replace(/^[AB]\d+:\s*/, '').trim() : path.basename(file, '.html');

        const descMatch = content.match(/<p class="desc">([^<]+)<\/p>/);
        const desc = descMatch ? descMatch[1].trim() : "Practica vocabulario con esta tabla interactiva.";

        const entriesMatch = content.match(/const entries\s*=\s*(\[[^\]]+\])/);
        if (!entriesMatch) {
            console.log(`Skipping ${file}: No entries list found.`);
            return;
        }
        let entriesJson = entriesMatch[1];
        // Clean up the JSON if it was previously extracted as a raw string without brackets
        entriesJson = entriesJson.trim().replace(/^\[/, '').replace(/\]$/, '');

        const formulaMatch = content.match(/const formula\s*=\s*"([^"]+)"/);
        const formula = formulaMatch ? formulaMatch[1] : "1d8";

        // Generate and write updated preset using the modular runner pattern
        const updatedHtml = generateHtml(title, desc, entriesJson, formula);
        fs.writeFileSync(filePath, updatedHtml, 'utf-8');
        console.log(`Successfully modularized: ${file}`);
    });
});
