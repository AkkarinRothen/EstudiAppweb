// Practice Modal UI Module
import { StudyEngine } from './study-engine.js';

let importedTableData = null;
let onStatsUpdateCallback = null;
let engine = null;

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('practiceModal');
        if (!modal || !modal.classList.contains('active')) return;

        // If focus is on writing input, do not block keyboard shortcuts
        if (document.activeElement && document.activeElement.id === 'modalWriteInput') return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (engine && (engine.currentMode === 'direct' || engine.currentMode === 'flashcard')) {
                if (engine.isRevealed) {
                    engine.roll();
                } else {
                    engine.reveal();
                }
            }
        } else if (e.key === '1') {
            const srsFeedback = document.getElementById('modalSrsFeedback');
            if (srsFeedback && srsFeedback.style.display === 'flex' && engine) {
                engine.rateSrs(false);
            }
        } else if (e.key === '2') {
            const srsFeedback = document.getElementById('modalSrsFeedback');
            if (srsFeedback && srsFeedback.style.display === 'flex' && engine) {
                engine.rateSrs(true);
            }
        }
    });
}

/**
 * Initializes the modal logic
 * @param {Function} onStatsUpdate 
 */
export function init(onStatsUpdate) {
    onStatsUpdateCallback = onStatsUpdate;
    setupKeyboardShortcuts();
}

export function openPracticeModal(data) {
    importedTableData = data;
    document.getElementById('modalTitle').innerText = data.title;
    document.getElementById('modalDesc').innerText = data.desc;
    document.getElementById('practiceModal').classList.add('active');

    // Wire up elements
    const elements = {
        mainText: document.getElementById('modalMainText'),
        subText: document.getElementById('modalSubText'),
        subContainer: document.getElementById('modalSubContainer'),
        imgContainer: document.getElementById('modalImgContainer'),
        vocabImg: document.getElementById('modalVocabImg'),
        exampleText: document.getElementById('modalExampleSentence'),
        btnReveal: document.getElementById('modalBtnReveal'),
        srsFeedback: document.getElementById('modalSrsFeedback'),
        writeArea: document.getElementById('modalWriteArea'),
        writeInput: document.getElementById('modalWriteInput'),
        writeFeedback: document.getElementById('modalWriteFeedback'),
        scrambledArea: document.getElementById('modalScrambledArea'),
        quizOptions: document.getElementById('modalQuizOptions'),
        quizScore: document.getElementById('modalQuizScore'),
        actionBtn: document.getElementById('modalActionBtn'),
        voiceSelect: document.getElementById('modalVoiceSelect'),
        speedSlider: document.getElementById('modalSpeedSlider'),
        speedVal: document.getElementById('modalSpeedVal'),
        srsBadge: document.getElementById('modalSrsBadge'),
        enableImages: document.getElementById('modalEnableImages'),
        die: document.getElementById('modalDie'),
        diceContainer: document.getElementById('modalDiceContainer'),
        rollVal: document.getElementById('modalRollVal'),
        resultArea: document.getElementById('modalResultArea'),
        timerContainer: document.getElementById('modalTimerContainer'),
        timerVal: document.getElementById('modalTimerVal'),
        matchArea: document.getElementById('modalMatchArea'),
        bubbleArea: document.getElementById('modalBubbleArea'),
        sniperArea: document.getElementById('modalSniperArea'),
        dragArea: document.getElementById('modalDragArea'),
        dictationArea: document.getElementById('modalDictationArea'),
        wordleArea: document.getElementById('modalWordleArea'),
        sentenceArea: document.getElementById('modalSentenceArea'),
        diagramArea: document.getElementById('modalDiagramArea'),
        btnLaunchpad: document.getElementById('modalBtnLaunchpad'),
        launchpadArea: document.getElementById('modalLaunchpadArea'),
        btnEdit: document.getElementById('modalBtnEdit'),
        editArea: document.getElementById('modalEditArea'),
        editEs: document.getElementById('modalEditEs'),
        editEn: document.getElementById('modalEditEn'),
        editEx: document.getElementById('modalEditEx'),
        btnSaveEdit: document.getElementById('modalBtnSaveEdit'),
        btnCancelEdit: document.getElementById('modalBtnCancelEdit')
    };

    const packId = "csv_" + data.title.toLowerCase().replace(/[^a-z0-9]/g, "_");

    engine = new StudyEngine({
        elements,
        packId,
        formula: data.formula || '1d6',
        entries: data.entries,
        isModal: true,
        onStatsUpdate: onStatsUpdateCallback
    });

    // Setup mode buttons
    const ids = ['Direct', 'Flashcard', 'Quiz', 'Write', 'Scrambled', 'Match', 'Bubble', 'Sniper', 'Drag', 'Dictation', 'Wordle'];
    ids.forEach(id => {
        const btn = document.getElementById('modalMode' + id);
        if (btn) btn.onclick = () => engine.setMode(id.toLowerCase());
    });

    const timeAttackBtn = document.getElementById('modalModeTimeAttack');
    if (timeAttackBtn) {
        timeAttackBtn.onclick = () => engine.setMode('timeAttack');
    }

    engine.setMode('direct');
}

export function closeModal(onClose) {
    document.getElementById('practiceModal').classList.remove('active');
    const badge = document.getElementById('modalSrsBadge');
    if (badge) badge.style.display = 'none';
    if (engine) {
        engine.stop();
    }
    importedTableData = null;
    engine = null;
    if (onClose) onClose();
}

export function toggleModalImages() {
    if (engine) engine.updateVisibility();
}

export function setModalMode(mode) {
    if (engine) engine.setMode(mode);
}

export function rollModal() {
    if (engine) engine.roll();
}

export function revealModal() {
    if (engine) engine.reveal();
}

export function rateModalSrs(isCorrect) {
    if (engine) engine.rateSrs(isCorrect);
}

export function speakModal() {
    if (engine) engine.speak();
}

export function updateSpeedLabel(val) {
    const label = document.getElementById('modalSpeedVal');
    if (label) label.innerText = parseFloat(val).toFixed(1) + "x";
}

export function saveTtsPreferences() {
    if (engine) engine.saveTtsPreferences();
}

export function getImportedTableData() {
    return importedTableData;
}
