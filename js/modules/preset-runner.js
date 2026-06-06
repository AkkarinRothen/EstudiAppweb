import * as Storage from './storage.js';
import * as Srs from './srs.js';
import * as Speech from './speech.js';
import * as Utils from './utils.js';

let currentEntries = [];
let currentFormula = "1d6";
let activeEntry = null;
let currentMode = 'direct';
let quizScore = { correct: 0, total: 0 };
let currentPackId = '';

export function initPreset(entries, formula) {
    currentEntries = entries;
    currentFormula = formula;
    
    // Auto-generate pack ID based on title or URL
    const pathParts = window.location.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    currentPackId = fileName.replace('.html', '');
    
    setupEventListeners();
    
    // Initialize TTS
    Speech.initTtsControls(document.getElementById('voiceSelect'), document.getElementById('speedSlider'), document.getElementById('speedVal'));
    
    const actionBtn = document.getElementById('actionBtn');
    if (actionBtn) actionBtn.innerText = "Tirar Dado";

    // Initial roll to display the first vocabulary item
    roll();
}

function setupEventListeners() {
    // Mode Toggles
    const modes = ['direct', 'flashcard', 'quiz', 'write'];
    modes.forEach(mode => {
        const btn = document.getElementById('mode' + mode.charAt(0).toUpperCase() + mode.slice(1));
        if (btn) {
            btn.addEventListener('click', () => setMode(mode));
        }
    });

    // Main Actions
    const actionBtn = document.getElementById('actionBtn');
    if (actionBtn) {
        actionBtn.addEventListener('click', () => roll());
    }

    const revealBtn = document.getElementById('btnReveal');
    if (revealBtn) {
        revealBtn.addEventListener('click', () => reveal());
    }

    const speakerBtn = document.getElementById('speaker');
    if (speakerBtn) {
        speakerBtn.addEventListener('click', () => speak());
    }

    // SRS Buttons
    const srsAgainBtn = document.querySelector('.srs-btn-again');
    if (srsAgainBtn) {
        srsAgainBtn.addEventListener('click', () => rateSrs(false));
    }

    const srsGoodBtn = document.querySelector('.srs-btn-good');
    if (srsGoodBtn) {
        srsGoodBtn.addEventListener('click', () => rateSrs(true));
    }

    // TTS Config
    const voiceSelect = document.getElementById('voiceSelect');
    if (voiceSelect) {
        voiceSelect.addEventListener('change', () => saveTtsPreferences());
    }

    const speedSlider = document.getElementById('speedSlider');
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            updateSpeedLabel(e.target.value);
            saveTtsPreferences();
        });
    }

    const enableImages = document.getElementById('enableImages');
    if (enableImages) {
        enableImages.addEventListener('change', () => toggleImages());
    }
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.chip-modal').forEach(c => c.classList.remove('active'));
    const modeBtn = document.getElementById('mode' + mode.charAt(0).toUpperCase() + mode.slice(1));
    if (modeBtn) modeBtn.classList.add('active');
    
    // Reset UI visibility
    document.getElementById('quizScore').style.display = 'none';
    document.getElementById('writeArea').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('subContainer').style.display = (mode === 'direct' || mode === 'write') ? 'flex' : 'none';
    
    const actionBtn = document.getElementById('actionBtn');
    if (mode === 'quiz' || mode === 'write') {
        actionBtn.innerText = "Siguiente";
    } else {
        actionBtn.innerText = "Tirar Dado";
    }

    if (activeEntry) updateEntryUI();
}

function toggleImages() {
    const container = document.getElementById('imgContainer');
    if (container) {
        container.style.display = document.getElementById('enableImages').checked ? 'block' : 'none';
    }
}

function updateSpeedLabel(val) {
    const el = document.getElementById('speedVal');
    if (el) el.innerText = val + 'x';
}

function saveTtsPreferences() {
    const voice = document.getElementById('voiceSelect').value;
    const speed = document.getElementById('speedSlider').value;
    Storage.saveTtsPreferences({ voiceIndex: voice, speed });
}

function speak() {
    if (!activeEntry) return;
    const textToSpeak = activeEntry.text.split('->')[1].trim();
    Speech.speak(textToSpeak);
}

function reveal() {
    document.getElementById('subContainer').style.display = 'flex';
    document.getElementById('btnReveal').style.display = 'none';
    document.getElementById('srsFeedback').style.display = 'flex';
}

function roll() {
    const actionBtn = document.getElementById('actionBtn');
    const die = document.getElementById('die');
    const diceContainer = document.getElementById('diceContainer');
    const resultArea = document.getElementById('resultArea');

    if (currentMode === 'direct' || currentMode === 'flashcard') {
        diceContainer.style.display = 'block';
        die.classList.add('rolling');
    }
    
    actionBtn.disabled = true;

    setTimeout(() => {
        if (currentMode === 'direct' || currentMode === 'flashcard') {
            die.classList.remove('rolling');
        }
        const rollResult = Utils.rollDice(currentFormula);
        die.setAttribute('data-face', (rollResult % 6) || 6);
        document.getElementById('rollVal').innerText = `Resultado: ${rollResult}`;
        
        // Pick entry
        const entry = currentEntries.find(e => rollResult >= e.min && rollResult <= e.max);
        if (entry) {
            activeEntry = entry;
            updateEntryUI();
        }
        
        actionBtn.disabled = false;
    }, (currentMode === 'direct' || currentMode === 'flashcard') ? 600 : 0);
}

function updateEntryUI() {
    const mainTextEl = document.getElementById('mainText');
    const subTextEl = document.getElementById('subText');
    const imgEl = document.getElementById('vocabImg');
    const imgContainer = document.getElementById('imgContainer');
    
    const parts = activeEntry.text.split('->');
    const es = parts[0].trim();
    const en = parts.length > 1 ? parts[1].trim() : '';
    
    mainTextEl.innerText = es;
    subTextEl.innerText = en;
    
    // Image handling
    const showImages = document.getElementById('enableImages').checked;
    imgContainer.style.display = showImages ? 'block' : 'none';
    if (showImages) {
        let imageUrl = "";
        if (parts.length > 2) {
            const third = parts[2].trim();
            if (third.startsWith('http')) imageUrl = third;
        }
        if (!imageUrl) {
            const keyword = Utils.extractImageKeyword(en) || Utils.extractImageKeyword(es);
            if (keyword) imageUrl = `https://loremflickr.com/400/300/${encodeURIComponent(keyword)}`;
        }
        
        imgEl.classList.remove('loaded');
        imgEl.src = imageUrl;
        imgEl.onload = () => imgEl.classList.add('loaded');
    }

    // SRS Badge
    const srsData = Storage.getSrsData()[currentPackId] || {};
    const wordKey = Utils.cleanText(es);
    const box = srsData[wordKey]?.box || 1;
    const badge = document.getElementById('srsBadge');
    badge.innerText = `Caja ${box}`;
    badge.className = `srs-badge srs-box-${box}`;
    badge.style.display = 'block';

    // Mode specific UI
    document.getElementById('btnReveal').style.display = 'none';
    document.getElementById('srsFeedback').style.display = 'none';
    document.getElementById('writeArea').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';

    if (currentMode === 'flashcard') {
        document.getElementById('subContainer').style.display = 'none';
        document.getElementById('btnReveal').style.display = 'block';
    } else if (currentMode === 'quiz') {
        startQuiz(en);
    } else if (currentMode === 'write') {
        startWrite();
    } else {
        document.getElementById('subContainer').style.display = 'flex';
        document.getElementById('srsFeedback').style.display = 'flex';
        speak();
    }
    
    addToHistory(es, en);
}

function startQuiz(correctAnswer) {
    const quizOptions = document.getElementById('quizOptions');
    quizOptions.innerHTML = '';
    quizOptions.style.display = 'flex';
    document.getElementById('subContainer').style.display = 'none';
    
    // Generate options
    const options = [correctAnswer];
    while(options.length < 4) {
        const randomEntry = currentEntries[Math.floor(Math.random() * currentEntries.length)];
        const randomEn = randomEntry.text.split('->')[1].trim();
        if (!options.includes(randomEn)) options.push(randomEn);
    }
    
    options.sort(() => Math.random() - 0.5).forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerText = opt;
        btn.onclick = () => {
            if (opt === correctAnswer) {
                btn.classList.add('correct');
                rateSrs(true);
            } else {
                btn.classList.add('incorrect');
                rateSrs(false);
            }
            document.querySelectorAll('.quiz-option').forEach(b => b.disabled = true);
            document.getElementById('subContainer').style.display = 'flex';
            speak();
        };
        quizOptions.appendChild(btn);
    });
}

function startWrite() {
    const writeArea = document.getElementById('writeArea');
    const input = document.getElementById('writeInput');
    const feedback = document.getElementById('writeFeedback');
    
    writeArea.style.display = 'flex';
    input.value = '';
    input.focus();
    feedback.innerText = '';
    
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            const answer = input.value.trim().toLowerCase();
            const correct = activeEntry.text.split('->')[1].trim().toLowerCase();
            if (Utils.compareText(answer, correct)) {
                feedback.innerText = '¡Correcto! ✨';
                feedback.className = 'write-feedback correct';
                rateSrs(true);
            } else {
                feedback.innerText = `Incorrecto. Era: ${activeEntry.text.split('->')[1].trim()}`;
                feedback.className = 'write-feedback incorrect';
                rateSrs(false);
            }
            input.disabled = true;
            speak();
        }
    };
}

function rateSrs(isGood) {
    const es = activeEntry.text.split('->')[0].trim();
    const newStats = Srs.updateWord(currentPackId, es, isGood);
    Storage.saveSrsData(newStats.srsData);
    Storage.saveStats({ 
        totalReviews: Storage.getStats().totalReviews + 1,
        streak: Storage.getStats().streak 
    });
    
    // Update badge
    const wordKey = Utils.cleanText(es);
    const box = newStats.srsData[currentPackId][wordKey].box;
    const badge = document.getElementById('srsBadge');
    badge.innerText = `Caja ${box}`;
    badge.className = `srs-badge srs-box-${box}`;
    
    document.getElementById('srsFeedback').style.display = 'flex';
}

function addToHistory(es, en) {
    const list = document.getElementById('historyList');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<span>${es}</span><strong>${en}</strong>`;
    list.prepend(item);
}
