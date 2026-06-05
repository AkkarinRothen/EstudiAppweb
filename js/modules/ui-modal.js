// Practice Modal UI Module
import * as Storage from './storage.js';
import * as Srs from './srs.js';
import * as Speech from './speech.js';
import * as Utils from './utils.js';

let importedTableData = null;
let modalCurrentMode = 'direct';
let modalIsRevealed = true;
let modalLastEnglishText = "";
let modalLastSpanishText = "";
let modalQuizAttempts = 0;
let modalQuizCorrect = 0;
let modalCurrentEntry = null;
let onStatsUpdateCallback = null;

/**
 * Initializes the modal logic
 * @param {Function} onStatsUpdate 
 */
export function init(onStatsUpdate) {
    onStatsUpdateCallback = onStatsUpdate;
}

export function openPracticeModal(data) {
    importedTableData = data;
    document.getElementById('modalTitle').innerText = data.title;
    document.getElementById('modalDesc').innerText = data.desc;
    document.getElementById('practiceModal').style.display = 'flex';
    setModalMode('direct');
}

export function closeModal(onClose) {
    document.getElementById('practiceModal').style.display = 'none';
    importedTableData = null;
    if (onClose) onClose();
}

export function toggleModalImages() {
    updateModalVisibility();
}

export function setModalMode(mode) {
    modalCurrentMode = mode;
    document.querySelectorAll('.chip-modal').forEach(c => c.classList.remove('active'));
    if (mode === 'direct') document.getElementById('modalModeDirect').classList.add('active');
    if (mode === 'flashcard') document.getElementById('modalModeFlashcard').classList.add('active');
    if (mode === 'quiz') document.getElementById('modalModeQuiz').classList.add('active');
    if (mode === 'write') document.getElementById('modalModeWrite').classList.add('active');

    const actionBtn = document.getElementById('modalActionBtn');
    const quizScore = document.getElementById('modalQuizScore');
    const writeArea = document.getElementById('modalWriteArea');
    const srsFeedback = document.getElementById('modalSrsFeedback');
    const diceContainer = document.getElementById('modalDiceContainer');

    writeArea.style.display = 'none';
    srsFeedback.style.display = 'none';
    if (diceContainer) diceContainer.style.display = 'none';

    if (mode === 'quiz') {
        actionBtn.innerText = 'Siguiente Pregunta';
        actionBtn.style.display = 'block';
        actionBtn.onclick = startModalQuizQuestion;
        quizScore.style.display = 'block';
        modalQuizAttempts = 0;
        modalQuizCorrect = 0;
        updateModalQuizScore();
        startModalQuizQuestion();
    } else if (mode === 'write') {
        actionBtn.innerText = 'Comprobar';
        actionBtn.style.display = 'block';
        actionBtn.onclick = checkModalWriteAnswer;
        quizScore.style.display = 'none';
        document.getElementById('modalQuizOptions').style.display = 'none';
        document.getElementById('modalSubContainer').style.display = 'none';
        document.getElementById('modalRollVal').style.display = 'none';
        startModalWriteQuestion();
    } else {
        actionBtn.innerText = 'Tirar ' + (importedTableData ? importedTableData.formula : 'Dado');
        actionBtn.style.display = 'block';
        actionBtn.onclick = rollModal;
        quizScore.style.display = 'none';
        document.getElementById('modalQuizOptions').style.display = 'none';
        document.getElementById('modalSubContainer').style.display = 'flex';
        document.getElementById('modalRollVal').style.display = 'block';

        if (modalLastEnglishText) {
            document.getElementById('modalSubText').innerText = modalLastEnglishText;
            modalIsRevealed = (mode === 'direct');
            updateModalVisibility();
        } else {
            document.getElementById('modalMainText').innerText = '---';
            document.getElementById('modalRollVal').innerText = 'Tira el dado para empezar';
            document.getElementById('modalSubContainer').classList.add('hidden');
            document.getElementById('modalBtnReveal').style.display = 'none';
            document.getElementById('modalImgContainer').style.display = 'none';
        }
    }
}

export function rollModal() {
    if (!importedTableData) return;
    
    // Choose next using SRS
    modalCurrentEntry = Srs.selectNextSrsEntry(importedTableData, modalLastSpanishText);
    if (!modalCurrentEntry) return;
    
    const val = Math.floor(Math.random() * (modalCurrentEntry.max - modalCurrentEntry.min + 1)) + modalCurrentEntry.min;
    const rawText = modalCurrentEntry.text;

    const parts = rawText.split("->");
    const main = parts[0].trim();
    const sub = parts.length > 1 ? parts[1].trim() : "";
    
    modalLastSpanishText = main;
    modalLastEnglishText = sub;

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

    const modalVocabImg = document.getElementById('modalVocabImg');
    const modalImgContainer = document.getElementById('modalImgContainer');
    
    const setupCardContent = () => {
        document.getElementById('modalRollVal').innerText = "Tirada (SRS): " + val;
        document.getElementById('modalMainText').innerText = main;
        document.getElementById('modalSubText').innerText = sub;

        if (imageUrl) {
            modalVocabImg.classList.remove('loaded');
            modalImgContainer.classList.add('loading');
            
            modalVocabImg.onload = () => {
                modalImgContainer.classList.remove('loading');
                modalVocabImg.classList.add('loaded');
            };
            
            modalVocabImg.onerror = () => {
                modalVocabImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2379747E'><path d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0-2-.9-2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'/></svg>";
                modalImgContainer.classList.remove('loading');
                modalVocabImg.classList.add('loaded');
            };
            
            modalVocabImg.src = imageUrl;
        } else {
            modalVocabImg.src = "";
            modalImgContainer.classList.remove('loading');
            modalVocabImg.classList.remove('loaded');
        }

        modalIsRevealed = (modalCurrentMode === 'direct' || sub === "");
        updateModalVisibility();

        // Prefetch next image
        setTimeout(() => {
            const nextImgUrl = peekNextModalImageUrl(modalLastSpanishText);
            if (nextImgUrl) {
                const prefetchImg = new Image();
                prefetchImg.src = nextImgUrl;
            }
        }, 500);

        // Show SRS grading buttons if direct mode
        const srsFeedback = document.getElementById('modalSrsFeedback');
        if (modalCurrentMode === 'direct') {
            srsFeedback.style.display = 'flex';
        } else {
            srsFeedback.style.display = 'none';
        }

        const area = document.getElementById('modalResultArea');
        area.style.transform = "scale(1.02)";
        setTimeout(() => area.style.transform = "scale(1)", 150);
    };

    // 3D Dice Simulation
    const die = document.getElementById('modalDie');
    const diceContainer = document.getElementById('modalDiceContainer');
    
    if (diceContainer && die && (modalCurrentMode === 'direct' || modalCurrentMode === 'flashcard')) {
        document.getElementById('modalMainText').innerText = "Rodando...";
        document.getElementById('modalSubContainer').classList.add('hidden');
        document.getElementById('modalBtnReveal').style.display = 'none';
        modalImgContainer.style.display = 'none';
        
        diceContainer.style.display = 'block';
        
        const maxRange = importedTableData.entries.length;
        document.querySelector('#modalDie .face-1').innerText = val;
        for (let f = 2; f <= 6; f++) {
            let randVal = Math.floor(Math.random() * maxRange) + 1;
            document.querySelector(`#modalDie .face-${f}`).innerText = randVal;
        }
        
        die.classList.add('rolling');
        die.removeAttribute('data-face');
        
        setTimeout(() => {
            die.classList.remove('rolling');
            die.setAttribute('data-face', '1'); // Land on face 1
            
            setTimeout(() => {
                setupCardContent();
            }, 600);
        }, 600);
    } else {
        if (diceContainer) diceContainer.style.display = 'none';
        setupCardContent();
    }
}

export function revealModal() {
    modalIsRevealed = true;
    updateModalVisibility();
    speakModal();
    
    // Show SRS grading buttons in flashcard when revealed
    if (modalCurrentMode === 'flashcard') {
        document.getElementById('modalSrsFeedback').style.display = 'flex';
    }
}

export function rateModalSrs(isCorrect) {
    if (!importedTableData) return;
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    Srs.updateWordSrs(packId, modalLastSpanishText, isCorrect, onStatsUpdateCallback);
    document.getElementById('modalSrsFeedback').style.display = 'none';
}

export function speakModal() {
    if (!modalLastEnglishText) return;
    Speech.speak(
        modalLastEnglishText, 
        document.getElementById('modalVoiceSelect'), 
        document.getElementById('modalSpeedSlider')
    );
}

function updateModalVisibility() {
    const subContainer = document.getElementById('modalSubContainer');
    const btnReveal = document.getElementById('modalBtnReveal');
    const imgContainer = document.getElementById('modalImgContainer');
    const showImages = document.getElementById('modalEnableImages').checked;
    const hasImg = document.getElementById('modalVocabImg').getAttribute('src') !== "";

    if (modalIsRevealed) {
        subContainer.classList.remove('hidden');
        btnReveal.style.display = 'none';
        if (showImages && hasImg && modalCurrentMode !== 'quiz' && modalCurrentMode !== 'write') {
            imgContainer.style.display = 'block';
        } else {
            imgContainer.style.display = 'none';
        }
    } else {
        subContainer.classList.add('hidden');
        btnReveal.style.display = 'block';
        imgContainer.style.display = 'none';
    }
}

function updateModalQuizScore() {
    document.getElementById('modalQuizScore').innerText = "Puntuación: " + modalQuizCorrect + "/" + modalQuizAttempts;
}

export function startModalQuizQuestion() {
    if (!importedTableData || importedTableData.entries.length < 2) {
        document.getElementById('modalMainText').innerText = "Se necesitan al menos 2 elementos para jugar.";
        return;
    }

    document.getElementById('modalSubContainer').style.display = 'none';
    document.getElementById('modalBtnReveal').style.display = 'none';
    document.getElementById('modalRollVal').style.display = 'none';
    document.getElementById('modalImgContainer').style.display = 'none';
    document.getElementById('modalWriteArea').style.display = 'none';
    document.getElementById('modalSrsFeedback').style.display = 'none';

    modalCurrentEntry = Srs.selectNextSrsEntry(importedTableData, modalLastSpanishText);
    if (!modalCurrentEntry) return;

    const parts = modalCurrentEntry.text.split("->");
    const spanish = parts[0].trim();
    const english = parts.length > 1 ? parts[1].trim() : "";
    
    modalLastSpanishText = spanish;
    modalLastEnglishText = english;

    document.getElementById('modalMainText').innerText = spanish;

    const options = [english];
    const otherEntries = importedTableData.entries.filter(e => e.text.split("->")[0].trim() !== spanish);
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

    const optionsContainer = document.getElementById('modalQuizOptions');
    optionsContainer.innerHTML = '';
    optionsContainer.style.display = 'flex';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.innerText = opt;
        btn.onclick = () => {
            const buttons = document.querySelectorAll('#modalQuizOptions .quiz-option');
            buttons.forEach(b => b.disabled = true);
            
            modalQuizAttempts++;
            const isCorrect = (opt === english);
            const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");

            Srs.updateWordSrs(packId, spanish, isCorrect, onStatsUpdateCallback);

            if (isCorrect) {
                btn.classList.add('correct');
                modalQuizCorrect++;
                speakModal();
            } else {
                btn.classList.add('incorrect');
                buttons.forEach(b => {
                    if (b.innerText === english) b.classList.add('correct');
                });
            }
            updateModalQuizScore();
        };
        optionsContainer.appendChild(btn);
    });
}

export function startModalWriteQuestion() {
    modalCurrentEntry = Srs.selectNextSrsEntry(importedTableData, modalLastSpanishText);
    if (!modalCurrentEntry) return;

    document.getElementById('modalSubContainer').style.display = 'none';
    document.getElementById('modalBtnReveal').style.display = 'none';
    document.getElementById('modalRollVal').style.display = 'none';
    document.getElementById('modalImgContainer').style.display = 'none';
    document.getElementById('modalQuizOptions').style.display = 'none';
    document.getElementById('modalSrsFeedback').style.display = 'none';

    const parts = modalCurrentEntry.text.split("->");
    const spanish = parts[0].trim();
    const english = parts.length > 1 ? parts[1].trim() : "";
    
    modalLastSpanishText = spanish;
    modalLastEnglishText = english;

    document.getElementById('modalMainText').innerText = spanish;
    
    const writeArea = document.getElementById('modalWriteArea');
    writeArea.style.display = 'flex';

    const input = document.getElementById('modalWriteInput');
    input.value = "";
    input.disabled = false;
    input.focus();

    const feedback = document.getElementById('modalWriteFeedback');
    feedback.innerText = "";
    feedback.className = "write-feedback";

    const actionBtn = document.getElementById('modalActionBtn');
    actionBtn.innerText = 'Comprobar';
    actionBtn.onclick = checkModalWriteAnswer;

    // Allow Enter key
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            checkModalWriteAnswer();
        }
    };
}

export function checkModalWriteAnswer() {
    const input = document.getElementById('modalWriteInput');
    const feedback = document.getElementById('modalWriteFeedback');
    const actionBtn = document.getElementById('modalActionBtn');
    
    const typed = input.value.trim();
    if (!typed) return;

    input.disabled = true;

    // Split valid answers by slash, semicolon or comma
    const correctOptions = modalLastEnglishText.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
    const typedClean = Utils.cleanText(typed);

    const isCorrect = correctOptions.includes(typedClean);
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");

    Srs.updateWordSrs(packId, modalLastSpanishText, isCorrect, onStatsUpdateCallback);

    if (isCorrect) {
        feedback.innerText = "¡Correcto! 🎉";
        feedback.className = "write-feedback correct";
        speakModal();
    } else {
        const diffMarkup = Utils.getDiffHighlight(typed, modalLastEnglishText.split(/[/\;,]/)[0].trim());
        feedback.innerHTML = `Incorrecto. <br>Tu intento: <span style="font-weight:normal;">${diffMarkup}</span><br>Correcto: <strong>${modalLastEnglishText}</strong>`;
        feedback.className = "write-feedback incorrect";
    }

    actionBtn.innerText = 'Siguiente Pregunta';
    actionBtn.onclick = startModalWriteQuestion;
}

function peekNextModalImageUrl(excludeWordKey) {
    if (!importedTableData || importedTableData.entries.length === 0) return "";
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const srsData = Storage.getSrsData()[packId] || {};
    
    let filteredEntries = importedTableData.entries;
    if (excludeWordKey && importedTableData.entries.length > 1) {
        filteredEntries = importedTableData.entries.filter(entry => {
            const wordKey = entry.text.split("->")[0].trim();
            return wordKey !== excludeWordKey;
        });
    }
    
    let dueEntries = [];
    let neverReviewed = [];
    let lowBoxEntries = [];
    
    filteredEntries.forEach(entry => {
        const parts = entry.text.split("->");
        const wordKey = parts[0].trim();
        const srsInfo = srsData[wordKey];
        
        if (!srsInfo) {
            neverReviewed.push(entry);
        } else if (srsInfo.nextReview <= Date.now()) {
            dueEntries.push(entry);
        } else {
            lowBoxEntries.push({ entry, box: srsInfo.box });
        }
    });
    
    let candidate = null;
    if (dueEntries.length > 0) {
        candidate = dueEntries[Math.floor(Math.random() * dueEntries.length)];
    } else if (neverReviewed.length > 0) {
        candidate = neverReviewed[Math.floor(Math.random() * neverReviewed.length)];
    } else {
        lowBoxEntries.sort((a, b) => a.box - b.box);
        if (lowBoxEntries.length > 0) {
            candidate = lowBoxEntries[0].entry;
        } else {
            candidate = filteredEntries[Math.floor(Math.random() * filteredEntries.length)];
        }
    }
    
    if (!candidate) return "";
    
    const parts = candidate.text.split("->");
    let imageUrl = "";
    if (parts.length > 2) {
        const third = parts[2].trim();
        if (third.startsWith("http://") || third.startsWith("https://")) {
            imageUrl = third;
        }
    }
    if (!imageUrl && parts.length > 1) {
        const sub = parts[1].trim();
        const queryWord = sub.split('/')[0].split(';')[0].split(',')[0].trim().toLowerCase();
        if (queryWord) {
            imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
        }
    }
    return imageUrl;
}

export function updateSpeedLabel(val) {
    const label = document.getElementById('modalSpeedVal');
    if (label) label.innerText = parseFloat(val).toFixed(1) + "x";
}

export function saveTtsPreferences() {
    Speech.saveTtsPreferences(
        document.getElementById('modalVoiceSelect')?.value,
        document.getElementById('modalSpeedSlider')?.value
    );
}

export function getImportedTableData() {
    return importedTableData;
}
