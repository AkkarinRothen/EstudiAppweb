// Custom Decks Library Management Module
import * as Storage from './storage.js';

/**
 * Saves the active deck to the local library
 * @param {Object} deckData 
 * @returns {string} Alert message
 */
export function saveActiveDeckToLibrary(deckData) {
    if (!deckData || deckData.entries.length === 0) return null;
    
    let customDecks = Storage.getCustomDecks();
    const existsIndex = customDecks.findIndex(d => d.title === deckData.title);
    
    const deckToSave = {
        id: existsIndex !== -1 ? customDecks[existsIndex].id : "custom_" + Date.now(),
        title: deckData.title,
        desc: deckData.desc,
        formula: deckData.formula,
        entries: deckData.entries
    };
    
    if (existsIndex !== -1) {
        customDecks[existsIndex] = deckToSave;
    } else {
        customDecks.push(deckToSave);
    }
    
    Storage.saveCustomDecks(customDecks);
    return `El mazo "${deckData.title}" se ha guardado en tu biblioteca local.`;
}

/**
 * Exports a deck to Anki/Quizlet compatible format
 * @param {Object} deckData 
 */
export function exportDeck(deckData) {
    if (!deckData || deckData.entries.length === 0) return;
    
    let output = "";
    deckData.entries.forEach(entry => {
        const parts = entry.text.split("->");
        if (parts.length >= 2) {
            output += `${parts[0].trim()}\t${parts[1].trim()}\r\n`;
        }
    });
    
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deckData.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}_export.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Deletes a deck from the library
 * @param {string} id 
 * @param {Function} onRefresh Callback to refresh UI
 */
export function deleteCustomDeck(id, onRefresh) {
    let customDecks = Storage.getCustomDecks();
    const index = customDecks.findIndex(d => d.id === id);
    
    if (index !== -1) {
        const deck = customDecks[index];
        customDecks.splice(index, 1);
        Storage.saveCustomDecks(customDecks);
        
        const packId = "csv_" + deck.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const srsData = Storage.getSrsData();
        if (srsData[packId]) {
            delete srsData[packId];
            Storage.saveSrsData(srsData);
        }
        
        if (onRefresh) onRefresh();
    }
}
