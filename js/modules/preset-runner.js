import { StudyEngine } from './study-engine.js';

let engine = null;

export function initPreset(entries, formula) {
    // Auto-generate pack ID based on URL filename
    const pathParts = window.location.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    const packId = fileName.replace('.html', '');

    // Setup elements mapping
    const elements = {
        mainText: document.getElementById('mainText'),
        subText: document.getElementById('subText'),
        subContainer: document.getElementById('subContainer'),
        imgContainer: document.getElementById('imgContainer'),
        vocabImg: document.getElementById('vocabImg'),
        exampleText: document.getElementById('exampleText'),
        btnReveal: document.getElementById('btnReveal'),
        srsFeedback: document.getElementById('srsFeedback'),
        writeArea: document.getElementById('writeArea'),
        writeInput: document.getElementById('writeInput'),
        writeFeedback: document.getElementById('writeFeedback'),
        scrambledArea: document.getElementById('scrambledArea'),
        quizOptions: document.getElementById('quizOptions'),
        quizScore: document.getElementById('quizScore'),
        actionBtn: document.getElementById('actionBtn'),
        voiceSelect: document.getElementById('voiceSelect'),
        speedSlider: document.getElementById('speedSlider'),
        speedVal: document.getElementById('speedVal'),
        srsBadge: document.getElementById('srsBadge'),
        enableImages: document.getElementById('enableImages'),
        die: document.getElementById('die'),
        diceContainer: document.getElementById('diceContainer'),
        rollVal: document.getElementById('rollVal'),
        resultArea: document.getElementById('resultArea'),
        timerContainer: document.getElementById('timerContainer'),
        timerVal: document.getElementById('timerVal'),
        historyList: document.getElementById('historyList'),
        matchArea: document.getElementById('matchArea'),
        bubbleArea: document.getElementById('bubbleArea'),
        wordleArea: document.getElementById('wordleArea'),
        sentenceArea: document.getElementById('sentenceArea'),
        btnLaunchpad: document.getElementById('btnLaunchpad'),
        launchpadArea: document.getElementById('launchpadArea')
    };

    engine = new StudyEngine({
        elements,
        packId,
        formula: formula || '1d6',
        entries,
        isModal: false,
        onStatsUpdate: null
    });

    setupEventListeners();

    // Set initial mode and roll
    engine.setMode('direct');
    engine.roll();
}

function setupEventListeners() {
    // Mode Switching is now handled within StudyEngine's Launchpad

    // Reveal Button
    const revealBtn = document.getElementById('btnReveal');
    if (revealBtn) {
        revealBtn.onclick = () => engine.reveal();
    }

    // TTS Speaker Button
    const speakerBtn = document.getElementById('speaker');
    if (speakerBtn) {
        speakerBtn.onclick = () => engine.speak();
    }

    // SRS Buttons
    const srsAgainBtn = document.querySelector('.srs-btn-again');
    if (srsAgainBtn) {
        srsAgainBtn.onclick = () => engine.rateSrs(false);
    }

    const srsGoodBtn = document.querySelector('.srs-btn-good');
    if (srsGoodBtn) {
        srsGoodBtn.onclick = () => engine.rateSrs(true);
    }
}
