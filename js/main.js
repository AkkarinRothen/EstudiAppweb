// Main Application Logic for EstudiApp Portal - Modular Version
import * as Storage from './modules/storage.js';
import * as Srs from './modules/srs.js';
import * as Speech from './modules/speech.js';
import * as Utils from './modules/utils.js';
import * as Parser from './modules/parser.js';
import * as Library from './modules/library.js';
import * as UiPortal from './modules/ui-portal.js';
import * as UiModal from './modules/ui-modal.js';

// Expose global functions for HTML event handlers
window.setFilter = (level, el) => UiPortal.setFilter(level, el, UiPortal.filterPacks);
window.filterPacks = UiPortal.filterPacks;
window.handleFileSelect = handleFileSelect;
window.toggleModalImages = UiModal.toggleModalImages;
window.setModalMode = UiModal.setModalMode;
window.rollModal = UiModal.rollModal;
window.revealModal = UiModal.revealModal;
window.rateModalSrs = UiModal.rateModalSrs;
window.speakModal = UiModal.speakModal;
window.checkModalWriteAnswer = UiModal.checkModalWriteAnswer;
window.startModalQuizQuestion = UiModal.startModalQuizQuestion;
window.closeModal = () => UiModal.closeModal(loadPacks);
window.saveActiveDeckToLibrary = saveActiveDeckToLibrary;
window.exportActiveDeck = () => Library.exportDeck(UiModal.getImportedTableData());
window.saveTtsPreferences = UiModal.saveTtsPreferences;
window.updateSpeedLabel = UiModal.updateSpeedLabel;

let packsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    UiModal.init(updateStatsUI);
    loadPacks();
    setupDragAndDrop();
    updateStatsUI();
});

function updateStatsUI() {
    const stats = Storage.getStats();
    const srsData = Storage.getSrsData();
    
    let totalEncountered = 0;
    let totalMastered = 0;
    
    Object.keys(srsData).forEach(packId => {
        Object.keys(srsData[packId]).forEach(wordKey => {
            totalEncountered++;
            if (srsData[packId][wordKey].box === 5) {
                totalMastered++;
            }
        });
    });
    
    const masteryPercent = totalEncountered > 0 ? Math.round((totalMastered / totalEncountered) * 100) : 0;
    
    const streakEl = document.getElementById('statStreak');
    const dominioEl = document.getElementById('statDominio');
    const progressFillEl = document.getElementById('statProgressFill');
    const reviewsEl = document.getElementById('statRepasos');
    
    if (streakEl) streakEl.innerText = `🔥 ${stats.streak} ${stats.streak === 1 ? 'día' : 'días'}`;
    if (dominioEl) dominioEl.innerText = `${masteryPercent}%`;
    if (progressFillEl) progressFillEl.style.width = `${masteryPercent}%`;
    if (reviewsEl) reviewsEl.innerText = stats.totalReviews;
}

// Load packs from JSON
async function loadPacks() {
    try {
        const response = await fetch('data/packs.json');
        packsData = await response.json();
        UiPortal.renderPacks(packsData);
        UiPortal.renderCustomDecks(UiModal.openPracticeModal, deleteCustomDeck);
    } catch (error) {
        console.error('Error loading packs:', error);
    }
}

// Drag and Drop implementation
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const dragOverlay = document.getElementById('dragOverlay');
    if (!dropZone) return;

    // Window-level Drag & Drop Overlay
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (dragOverlay) dragOverlay.classList.add('active');
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    if (dragOverlay) {
        dragOverlay.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null || e.target === dragOverlay) {
                dragOverlay.classList.remove('active');
            }
        });

        dragOverlay.addEventListener('drop', (e) => {
            e.preventDefault();
            dragOverlay.classList.remove('active');
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0 && (files[0].name.endsWith('.csv') || files[0].name.endsWith('.txt'))) {
                processCsvFile(files[0]);
            }
        });
    }

    // Original Drop Zone Card
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.background = 'var(--surface-variant)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.background = 'var(--container)';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && (files[0].name.endsWith('.csv') || files[0].name.endsWith('.txt'))) {
            processCsvFile(files[0]);
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processCsvFile(file);
    }
}

function processCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const parsedData = Parser.parseImportedCsv(text);
        if (parsedData.entries.length > 0) {
            UiModal.openPracticeModal(parsedData);
        } else {
            alert("No se pudieron encontrar entradas válidas en el archivo CSV.");
        }
    };
    reader.readAsText(file);
}

function saveActiveDeckToLibrary() {
    const deck = UiModal.getImportedTableData();
    const msg = Library.saveActiveDeckToLibrary(deck);
    if (msg) {
        alert(msg);
        UiPortal.renderCustomDecks(UiModal.openPracticeModal, deleteCustomDeck);
    }
}

function deleteCustomDeck(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este mazo de tu biblioteca? Se perderán las estadísticas del mazo.")) return;
    Library.deleteCustomDeck(id, () => {
        UiPortal.renderCustomDecks(UiModal.openPracticeModal, deleteCustomDeck);
        updateStatsUI();
    });
}
