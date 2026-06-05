// Decks Page Orchestrator
import * as Storage from './modules/storage.js';
import * as Speech from './modules/speech.js';
import * as Library from './modules/library.js';
import * as UiModal from './modules/ui-modal.js';
import * as DecksPage from './modules/decks-page.js';

document.addEventListener('DOMContentLoaded', () => {
    UiModal.init(refreshStats);
    setupModalEventListeners();
    DecksPage.init(openCustomDeck, deleteCustomDeck);
});

// ─── Stats refresh callback ───────────────────────────────────────────────────

function refreshStats() {
    DecksPage.refresh();
}

// ─── Custom deck actions ──────────────────────────────────────────────────────

function openCustomDeck(deckData) {
    UiModal.openPracticeModal(deckData);
}

function deleteCustomDeck(id) {
    if (!confirm('¿Estás seguro de que querés eliminar este mazo? Se perderán las estadísticas.')) return;
    Library.deleteCustomDeck(id, () => {
        DecksPage.refresh();
    });
}

// ─── Modal event listeners ────────────────────────────────────────────────────

function setupModalEventListeners() {
    // Close
    const closeBtn = document.getElementById('decksCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => UiModal.closeModal(DecksPage.refresh));

    // Click outside modal to close
    const overlay = document.getElementById('practiceModal');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) UiModal.closeModal(DecksPage.refresh);
        });
    }

    // Images toggle
    const imagesToggle = document.getElementById('modalEnableImages');
    if (imagesToggle) imagesToggle.addEventListener('change', () => UiModal.toggleModalImages());

    // Mode buttons
    const modeButtons = {
        'modalModeDirect': 'direct',
        'modalModeFlashcard': 'flashcard',
        'modalModeQuiz': 'quiz',
        'modalModeWrite': 'write'
    };
    Object.entries(modeButtons).forEach(([id, mode]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => UiModal.setModalMode(mode));
    });

    // Speaker
    const speakerBtn = document.getElementById('modalSpeaker');
    if (speakerBtn) speakerBtn.addEventListener('click', () => UiModal.speakModal());

    // Reveal
    const revealBtn = document.getElementById('modalBtnReveal');
    if (revealBtn) revealBtn.addEventListener('click', () => UiModal.revealModal());

    // SRS
    const srsAgain = document.querySelector('.srs-btn-again');
    if (srsAgain) srsAgain.addEventListener('click', () => UiModal.rateModalSrs(false));

    const srsGood = document.querySelector('.srs-btn-good');
    if (srsGood) srsGood.addEventListener('click', () => UiModal.rateModalSrs(true));

    // Save to library
    const saveBtn = document.getElementById('modalBtnSaveLocal');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const deck = UiModal.getImportedTableData();
            const msg = Library.saveActiveDeckToLibrary(deck);
            if (msg) {
                alert(msg);
                DecksPage.refresh();
            }
        });
    }

    // Export
    const exportBtn = document.getElementById('modalBtnExport');
    if (exportBtn) exportBtn.addEventListener('click', () => Library.exportDeck(UiModal.getImportedTableData()));

    // TTS
    const voiceSelect = document.getElementById('modalVoiceSelect');
    if (voiceSelect) voiceSelect.addEventListener('change', () => UiModal.saveTtsPreferences());

    const speedSlider = document.getElementById('modalSpeedSlider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            UiModal.updateSpeedLabel(e.target.value);
            UiModal.saveTtsPreferences();
        });
    }

    // Action (roll/next)
    const actionBtn = document.getElementById('modalActionBtn');
    if (actionBtn) actionBtn.addEventListener('click', () => UiModal.rollModal());
}
