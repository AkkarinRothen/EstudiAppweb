// Main Application Logic for EstudiApp Portal - Modular Version
import * as Storage from './modules/storage.js';
import * as Srs from './modules/srs.js';
import * as Speech from './modules/speech.js';
import * as Utils from './modules/utils.js';
import * as Parser from './modules/parser.js';
import * as Library from './modules/library.js';
import * as UiModal from './modules/ui-modal.js';
import * as DecksPage from './modules/decks-page.js';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    UiModal.init(updateStatsUI);
    DecksPage.init(UiModal.openPracticeModal, deleteCustomDeck);
    setupDragAndDrop();
    setupEventListeners();
    updateStatsUI();
});

function setupEventListeners() {
    // Import Actions
    const dropZone = document.getElementById('dropZone');
    const csvInput = document.getElementById('csvInput');
    if (dropZone && csvInput) {
        dropZone.addEventListener('click', () => csvInput.click());
        csvInput.addEventListener('change', (e) => handleFileSelect(e));
    }

    // Modal Controls
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => UiModal.closeModal(() => {
            DecksPage.refresh();
            updateStatsUI();
        }));
    }

    const modalEnableImages = document.getElementById('modalEnableImages');
    if (modalEnableImages) {
        modalEnableImages.addEventListener('change', () => UiModal.toggleModalImages());
    }

    // Modal Modes
    const modeButtons = {
        'modalModeDirect': 'direct',
        'modalModeFlashcard': 'flashcard',
        'modalModeQuiz': 'quiz',
        'modalModeWrite': 'write'
    };

    Object.entries(modeButtons).forEach(([id, mode]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => UiModal.setModalMode(mode));
        }
    });

    // Modal Interactions
    const speakerBtn = document.getElementById('modalSpeaker');
    if (speakerBtn) {
        speakerBtn.addEventListener('click', () => UiModal.speakModal());
    }

    const revealBtn = document.getElementById('modalBtnReveal');
    if (revealBtn) {
        revealBtn.addEventListener('click', () => UiModal.revealModal());
    }

    const srsAgainBtn = document.querySelector('.srs-btn-again');
    if (srsAgainBtn) {
        srsAgainBtn.addEventListener('click', () => UiModal.rateModalSrs(false));
    }

    const srsGoodBtn = document.querySelector('.srs-btn-good');
    if (srsGoodBtn) {
        srsGoodBtn.addEventListener('click', () => UiModal.rateModalSrs(true));
    }

    const saveLocalBtn = document.getElementById('modalBtnSaveLocal');
    if (saveLocalBtn) {
        saveLocalBtn.addEventListener('click', () => saveActiveDeckToLibrary());
    }

    const exportBtn = document.getElementById('modalBtnExport');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => Library.exportDeck(UiModal.getImportedTableData()));
    }

    // TTS Controls
    const voiceSelect = document.getElementById('modalVoiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', () => UiModal.saveTtsPreferences());
    }

    const speedSlider = document.getElementById('modalSpeedSlider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            UiModal.updateSpeedLabel(e.target.value);
            UiModal.saveTtsPreferences();
        });
    }

    const actionBtn = document.getElementById('modalActionBtn');
    if (actionBtn) {
        actionBtn.addEventListener('click', () => UiModal.rollModal());
    }
}

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
                dragOverlay.classList.remove('remove');
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
        DecksPage.refresh();
    }
}

function deleteCustomDeck(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este mazo de tu biblioteca? Se perderán las estadísticas del mazo.")) return;
    Library.deleteCustomDeck(id, () => {
        DecksPage.refresh();
        updateStatsUI();
    });
}
