// Preset Runner Module - Shared logic for all interactive packs
import * as Storage from './storage.js';
import * as Srs from './srs.js';
import * as Speech from './speech.js';
import * as Utils from './utils.js';

let entries = [];
let formula = "1d8";
let packId = "";

let currentMode = 'direct';
let isRevealed = true;
let lastEnglishText = "";
let lastSpanishText = "";
let currentQuizEntry = null;

// Quiz State
let quizAttempts = 0;
let quizCorrect = 0;

/**
 * Initializes the preset with data and sets up event listeners
 * @param {Array} packEntries 
 * @param {string} packFormula 
 * @param {string} id 
 */
export function initPreset(packEntries, packFormula, id) {
    entries = packEntries;
    formula = packFormula;
    packId = id || window.location.pathname.split('/').pop().replace('.html', '') || 'unknown_pack';

    setupEventListeners();
    initTts();
    setMode('direct');
}

function setupEventListeners() {
    window.setMode = setMode;
    window.toggleImages = toggleImages;
    window.roll = roll;
    window.reveal = reveal;
    window.rateSrs = rateSrs;
    window.speak = speak;
    window.exportDeck = exportDeck;
    window.saveTtsPreferences = saveTtsPreferences;
    window.updateSpeedLabel = updateSpeedLabel;
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (currentMode === 'direct' || currentMode === 'flashcard') {
                if (isRevealed) roll();
                else reveal();
                e.preventDefault();
            }
        }
    });
}

function initTts() {
    Speech.initTtsControls(
        document.getElementById('voiceSelect'),
        document.getElementById('speedSlider'),
        document.getElementById('speedVal')
    );
}

function toggleImages() {
    updateVisibility();
}

function setMode(mode) {
    currentMode = mode;
    document.getElementById('modeDirect')?.classList.toggle('active', mode === 'direct');
    document.getElementById('modeFlashcard')?.classList.toggle('active', mode === 'flashcard');
    document.getElementById('modeQuiz')?.classList.toggle('active', mode === 'quiz');
    document.getElementById('modeWrite')?.classList.toggle('active', mode === 'write');
    
    const actionBtn = document.getElementById('actionBtn');
    const historySec = document.getElementById('historySection');
    const quizScore = document.getElementById('quizScore');
    const writeArea = document.getElementById('writeArea');
    const srsFeedback = document.getElementById('srsFeedback');
    const diceContainer = document.getElementById('diceContainer');

    if (writeArea) writeArea.style.display = 'none';
    if (srsFeedback) srsFeedback.style.display = 'none';
    if (diceContainer) diceContainer.style.display = 'none';

    if (mode === 'quiz') {
        if (actionBtn) {
            actionBtn.innerText = 'Siguiente Pregunta';
            actionBtn.onclick = startNewQuizQuestion;
        }
        if (historySec) historySec.style.display = 'none';
        if (quizScore) quizScore.style.display = 'block';
        quizAttempts = 0;
        quizCorrect = 0;
        updateQuizScore();
        startNewQuizQuestion();
    } else if (mode === 'write') {
        if (actionBtn) {
            actionBtn.innerText = 'Comprobar';
            actionBtn.onclick = checkWriteAnswer;
        }
        if (historySec) historySec.style.display = 'none';
        if (quizScore) quizScore.style.display = 'none';
        const qOpts = document.getElementById('quizOptions');
        if (qOpts) qOpts.style.display = 'none';
        const subC = document.getElementById('subContainer');
        if (subC) subC.style.display = 'none';
        const rollV = document.getElementById('rollVal');
        if (rollV) rollV.style.display = 'none';
        startWriteQuestion();
    } else {
        if (actionBtn) {
            actionBtn.innerText = 'Tirar ' + formula;
            actionBtn.onclick = roll;
        }
        if (historySec) historySec.style.display = 'block';
        if (quizScore) quizScore.style.display = 'none';
        const qOpts = document.getElementById('quizOptions');
        if (qOpts) qOpts.style.display = 'none';
        const subC = document.getElementById('subContainer');
        if (subC) subC.style.display = 'flex';
        const rollV = document.getElementById('rollVal');
        if (rollV) rollV.style.display = 'block';
        
        if (lastEnglishText) {
            const subT = document.getElementById('subText');
            if (subT) subT.innerText = lastEnglishText;
            isRevealed = (mode === 'direct');
            updateVisibility();
        } else {
            const mainT = document.getElementById('mainText');
            if (mainT) mainT.innerText = '---';
            const rollV = document.getElementById('rollVal');
            if (rollV) rollV.innerText = 'Tira el dado para empezar';
            const subC = document.getElementById('subContainer');
            if (subC) subC.classList.add('hidden');
            const btnR = document.getElementById('btnReveal');
            if (btnR) btnR.style.display = 'none';
            const imgC = document.getElementById('imgContainer');
            if (imgC) imgC.style.display = 'none';
        }
    }
}

function roll() {
    if (entries.length === 0) return;
    
    // Use Srs module for selection
    const entry = Srs.selectNextSrsEntry({ entries, title: packId }, lastSpanishText);
    if (!entry) return;

    const val = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
    const rawText = entry.text;

    const parts = rawText.split("->");
    const main = parts[0].trim();
    const sub = parts.length > 1 ? parts[1].trim() : "";
    
    lastSpanishText = main;
    lastEnglishText = sub;

    // Resolve Image URL
    let imageUrl = "";
    if (parts.length > 2) {
        const third = parts[2].trim();
        if (third.startsWith("http://") || third.startsWith("https://")) {
            imageUrl = third;
        }
    }
    if (!imageUrl && sub) {
        const queryWord = sub.split('/')[0].split(';')[0].split(',')[0].trim().toLowerCase();
        if (queryWord) {
            imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
        }
    }

    const vocabImg = document.getElementById('vocabImg');
    const imgContainer = document.getElementById('imgContainer');
    
    const setupCardContent = () => {
        const rollV = document.getElementById('rollVal');
        if (rollV) rollV.innerText = "Tirada (SRS): " + val;
        const mainT = document.getElementById('mainText');
        if (mainT) mainT.innerText = main;
        const subT = document.getElementById('subText');
        if (subT) subT.innerText = sub;
        
        if (imageUrl && vocabImg) {
            vocabImg.classList.remove('loaded');
            imgContainer?.classList.add('loading');
            
            vocabImg.onload = () => {
                imgContainer?.classList.remove('loading');
                vocabImg.classList.add('loaded');
            };
            
            vocabImg.onerror = () => {
                vocabImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2379747E'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0-2-.9-2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
                imgContainer?.classList.remove('loading');
                vocabImg.classList.add('loaded');
            };
            
            vocabImg.src = imageUrl;
        } else if (vocabImg) {
            vocabImg.src = "";
            imgContainer?.classList.remove('loading');
            vocabImg.classList.remove('loaded');
        }

        isRevealed = (currentMode === 'direct' || sub === "");
        updateVisibility();

        if (currentMode === 'direct') {
            const srsF = document.getElementById('srsFeedback');
            if (srsF) srsF.style.display = 'flex';
        } else {
            const srsF = document.getElementById('srsFeedback');
            if (srsF) srsF.style.display = 'none';
        }

        const area = document.getElementById('resultArea');
        if (area) {
            area.style.transform = "scale(1.02)";
            setTimeout(() => area.style.transform = "scale(1)", 150);
        }

        addHistory(val, main, sub);
    };

    const die = document.getElementById('die');
    const diceContainer = document.getElementById('diceContainer');
    
    if (diceContainer && die && (currentMode === 'direct' || currentMode === 'flashcard')) {
        const mainT = document.getElementById('mainText');
        if (mainT) mainT.innerText = "Rodando...";
        document.getElementById('subContainer')?.classList.add('hidden');
        const btnR = document.getElementById('btnReveal');
        if (btnR) btnR.style.display = 'none';
        if (imgContainer) imgContainer.style.display = 'none';
        
        diceContainer.style.display = 'block';
        
        const maxRange = entries.length;
        const f1 = document.querySelector('#die .face-1');
        if (f1) f1.innerText = val;
        for (let f = 2; f <= 6; f++) {
            let randVal = Math.floor(Math.random() * maxRange) + 1;
            const face = document.querySelector('#die .face-' + f);
            if (face) face.innerText = randVal;
        }
        
        die.classList.add('rolling');
        die.removeAttribute('data-face');
        
        setTimeout(() => {
            die.classList.remove('rolling');
            die.setAttribute('data-face', '1');
            
            setTimeout(() => {
                setupCardContent();
            }, 600);
        }, 600);
    } else {
        if (diceContainer) diceContainer.style.display = 'none';
        setupCardContent();
    }
}

function updateVisibility() {
    const subContainer = document.getElementById('subContainer');
    const btnReveal = document.getElementById('btnReveal');
    const imgContainer = document.getElementById('imgContainer');
    const enableImgs = document.getElementById('enableImages');
    const showImages = enableImgs ? enableImgs.checked : true;
    const vocabImg = document.getElementById('vocabImg');
    const hasImg = vocabImg ? vocabImg.getAttribute('src') !== "" : false;

    if (isRevealed) {
        subContainer?.classList.remove('hidden');
        if (btnReveal) btnReveal.style.display = 'none';
        if (showImages && hasImg && currentMode !== 'quiz' && currentMode !== 'write') {
            if (imgContainer) imgContainer.style.display = 'block';
        } else {
            if (imgContainer) imgContainer.style.display = 'none';
        }
    } else {
        subContainer?.classList.add('hidden');
        if (btnReveal) btnReveal.style.display = 'block';
        if (imgContainer) imgContainer.style.display = 'none';
    }
}

function reveal() {
    isRevealed = true;
    updateVisibility();
    speak();

    if (currentMode === 'flashcard') {
        const srsF = document.getElementById('srsFeedback');
        if (srsF) srsF.style.display = 'flex';
    }
}

function rateSrs(isCorrect) {
    Srs.updateWordSrs(packId, lastSpanishText, isCorrect);
    const srsF = document.getElementById('srsFeedback');
    if (srsF) srsF.style.display = 'none';
}

function speak() {
    Speech.speak(lastEnglishText, document.getElementById('voiceSelect'), document.getElementById('speedSlider'));
}

function addHistory(val, main, sub) {
    const hist = document.getElementById('historyList');
    if (!hist) return;
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `<span><b>[${val}]</b> ${main}</span><span style='color:var(--primary); font-weight: 500;'>${sub}</span>`;
    hist.prepend(item);
}

// Write Mode
function startWriteQuestion() {
    const entry = Srs.selectNextSrsEntry({ entries, title: packId }, lastSpanishText);
    if (!entry) return;

    document.getElementById('subContainer').style.display = 'none';
    document.getElementById('btnReveal').style.display = 'none';
    document.getElementById('rollVal').style.display = 'none';
    document.getElementById('imgContainer').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('srsFeedback').style.display = 'none';

    const parts = entry.text.split("->");
    const spanish = parts[0].trim();
    const english = parts.length > 1 ? parts[1].trim() : "";
    
    lastSpanishText = spanish;
    lastEnglishText = english;

    document.getElementById('mainText').innerText = spanish;
    
    const writeArea = document.getElementById('writeArea');
    if (writeArea) writeArea.style.display = 'flex';

    const input = document.getElementById('writeInput');
    if (input) {
        input.value = "";
        input.disabled = false;
        input.focus();
        input.onkeydown = (e) => {
            if (e.key === 'Enter') checkWriteAnswer();
        };
    }

    const feedback = document.getElementById('writeFeedback');
    if (feedback) {
        feedback.innerText = "";
        feedback.className = "write-feedback";
    }

    const actionBtn = document.getElementById('actionBtn');
    if (actionBtn) {
        actionBtn.innerText = 'Comprobar';
        actionBtn.onclick = checkWriteAnswer;
    }
}

function checkWriteAnswer() {
    const input = document.getElementById('writeInput');
    const feedback = document.getElementById('writeFeedback');
    const actionBtn = document.getElementById('actionBtn');
    
    const typed = input ? input.value.trim() : "";
    if (!typed) return;

    if (input) input.disabled = true;

    const correctOptions = lastEnglishText.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
    const typedClean = Utils.cleanText(typed);
    const isCorrect = correctOptions.includes(typedClean);

    Srs.updateWordSrs(packId, lastSpanishText, isCorrect);

    if (isCorrect) {
        if (feedback) {
            feedback.innerText = "¡Correcto! 🎉";
            feedback.className = "write-feedback correct";
        }
        speak();
    } else {
        const diffMarkup = Utils.getDiffHighlight(typed, lastEnglishText.split(/[/\;,]/)[0].trim());
        if (feedback) {
            feedback.innerHTML = 'Incorrecto. <br>Tu intento: <span style="font-weight:normal;">' + diffMarkup + '</span><br>Correcto: <strong>' + lastEnglishText + '</strong>';
            feedback.className = "write-feedback incorrect";
        }
    }

    if (actionBtn) {
        actionBtn.innerText = 'Siguiente Pregunta';
        actionBtn.onclick = startWriteQuestion;
    }
}

// Quiz Logic
function updateQuizScore() {
    const scoreEl = document.getElementById('quizScore');
    if (scoreEl) scoreEl.innerText = "Puntuación: " + quizCorrect + "/" + quizAttempts;
}

function startNewQuizQuestion() {
    if (entries.length < 2) {
        const mainT = document.getElementById('mainText');
        if (mainT) mainT.innerText = "Se necesitan al menos 2 elementos para jugar.";
        return;
    }
    
    document.getElementById('subContainer').style.display = 'none';
    document.getElementById('btnReveal').style.display = 'none';
    document.getElementById('rollVal').style.display = 'none';
    document.getElementById('imgContainer').style.display = 'none';
    document.getElementById('writeArea').style.display = 'none';
    document.getElementById('srsFeedback').style.display = 'none';
    
    const entry = Srs.selectNextSrsEntry({ entries, title: packId }, lastSpanishText);
    if (!entry) return;
    currentQuizEntry = entry;
    
    const parts = entry.text.split("->");
    const spanish = parts[0].trim();
    const english = parts.length > 1 ? parts[1].trim() : "";
    
    lastSpanishText = spanish;
    lastEnglishText = english;

    document.getElementById('mainText').innerText = spanish;
    
    const options = [english];
    const otherEntries = entries.filter(e => e.text.split("->")[0].trim() !== spanish);
    const distractors = otherEntries
        .map(e => e.text.split("->")[1]?.trim() || "")
        .filter(txt => txt !== "" && txt !== english);
    
    const uniqueDistractors = [...new Set(distractors)];
    
    while (options.length < Math.min(4, uniqueDistractors.length + 1)) {
        const randomDist = uniqueDistractors[Math.floor(Math.random() * uniqueDistractors.length)];
        if (!options.includes(randomDist)) {
            options.push(randomDist);
        }
    }
    
    options.sort(() => Math.random() - 0.5);
    
    const optionsContainer = document.getElementById('quizOptions');
    if (optionsContainer) {
        optionsContainer.innerHTML = '';
        optionsContainer.style.display = 'flex';
        
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.innerText = opt;
            btn.onclick = () => selectQuizOption(btn, opt, english);
            optionsContainer.appendChild(btn);
        });
    }
}

function selectQuizOption(btn, selected, correct) {
    const buttons = document.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.disabled = true);
    
    quizAttempts++;
    const isCorrect = (selected === correct);
    Srs.updateWordSrs(packId, lastSpanishText, isCorrect);

    if (isCorrect) {
        btn.classList.add('correct');
        quizCorrect++;
        speak();
    } else {
        btn.classList.add('incorrect');
        buttons.forEach(b => {
            if (b.innerText === correct) {
                b.classList.add('correct');
            }
        });
    }
    updateQuizScore();
}

function exportDeck() {
    if (entries.length === 0) return;
    let output = "";
    entries.forEach(entry => {
        const parts = entry.text.split("->");
        if (parts.length >= 2) {
            output += parts[0].trim() + "\t" + parts[1].trim() + "\r\n";
        }
    });
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const title = document.querySelector('h1')?.innerText || 'deck';
    a.download = title.toLowerCase().replace(/[^a-z0-9]/g, "_") + "_export.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function updateSpeedLabel(val) {
    const label = document.getElementById('speedVal');
    if (label) label.innerText = parseFloat(val).toFixed(1) + "x";
}

function saveTtsPreferences() {
    Speech.saveTtsPreferences(
        document.getElementById('voiceSelect')?.value,
        document.getElementById('speedSlider')?.value
    );
}
