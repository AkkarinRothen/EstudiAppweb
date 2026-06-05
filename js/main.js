// Main Application Logic for EstudiApp Portal
let currentFilter = 'Todos';
let packsData = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPacks();
    setupDragAndDrop();
    updateStatsUI();
});

// State and Storage Helpers
function getSrsData() {
    try {
        return JSON.parse(localStorage.getItem('estudiapp_srs_data')) || {};
    } catch (e) {
        return {};
    }
}

function saveSrsData(data) {
    localStorage.setItem('estudiapp_srs_data', JSON.stringify(data));
}

function getStats() {
    try {
        let stats = JSON.parse(localStorage.getItem('estudiapp_stats'));
        if (!stats) {
            stats = { streak: 0, lastStudyDate: null, totalReviews: 0, totalCorrect: 0 };
        }
        return stats;
    } catch (e) {
        return { streak: 0, lastStudyDate: null, totalReviews: 0, totalCorrect: 0 };
    }
}

function saveStats(stats) {
    localStorage.setItem('estudiapp_stats', JSON.stringify(stats));
}

function recordSrsAttempt(isCorrect) {
    let stats = getStats();
    stats.totalReviews++;
    if (isCorrect) stats.totalCorrect++;

    // Calculate Streak
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (stats.lastStudyDate !== todayStr) {
        if (stats.lastStudyDate) {
            const lastDate = new Date(stats.lastStudyDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                stats.streak++;
            } else if (diffDays > 1) {
                stats.streak = 1;
            }
        } else {
            stats.streak = 1;
        }
        stats.lastStudyDate = todayStr;
    }
    saveStats(stats);
    updateStatsUI();
}

function updateWordSrs(packId, wordKey, isCorrect) {
    if (!packId || !wordKey) return;
    let srsData = getSrsData();
    if (!srsData[packId]) srsData[packId] = {};
    if (!srsData[packId][wordKey]) {
        srsData[packId][wordKey] = { box: 1, nextReview: 0, lastAttempt: 0 };
    }
    
    let entry = srsData[packId][wordKey];
    entry.lastAttempt = Date.now();
    
    if (isCorrect) {
        entry.box = Math.min(5, entry.box + 1);
    } else {
        entry.box = 1;
    }
    
    // Set nextReview intervals
    let interval = 60 * 1000; // 1 min (box 1)
    if (entry.box === 2) interval = 10 * 60 * 1000; // 10 mins
    else if (entry.box === 3) interval = 60 * 60 * 1000; // 1 hour
    else if (entry.box === 4) interval = 24 * 60 * 60 * 1000; // 1 day
    else if (entry.box === 5) interval = 4 * 24 * 60 * 60 * 1000; // 4 days
    
    entry.nextReview = Date.now() + interval;
    saveSrsData(srsData);
    
    recordSrsAttempt(isCorrect);
}

function updateStatsUI() {
    const stats = getStats();
    const srsData = getSrsData();
    
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
        renderPacks(packsData);
    } catch (error) {
        console.error('Error loading packs:', error);
    }
}

function renderPacks(packs) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const srsData = getSrsData();

    packs.forEach(pack => {
        // Calculate mastery for this pack
        let encountered = 0;
        let mastered = 0;
        if (srsData[pack.id]) {
            Object.keys(srsData[pack.id]).forEach(key => {
                encountered++;
                if (srsData[pack.id][key].box === 5) {
                    mastered++;
                }
            });
        }
        const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;

        const card = document.createElement('a');
        card.href = pack.file;
        card.className = 'card';
        card.setAttribute('data-level', pack.level);
        card.innerHTML = `
            <div class="card-header">
                <h3>${pack.title}</h3>
                <span class="level-badge level-${pack.level.toLowerCase()}">${pack.level}</span>
            </div>
            <p>${pack.desc}</p>
            <div style="margin-top: auto; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--on-surface-variant); display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span>Dominio SRS</span>
                    <span>${percent}%</span>
                </div>
                <div class="progress-container">
                    <div class="progress-fill" style="width: ${percent}%;"></div>
                </div>
            </div>
            <div class="card-footer">
                <span class="category">${pack.category}</span>
                <span class="btn-open">Practicar →</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setFilter(level, el) {
    currentFilter = level;
    document.querySelectorAll('.filter-section .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    filterPacks();
}

function filterPacks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const desc = card.querySelector('p').innerText.toLowerCase();
        const level = card.getAttribute('data-level');

        const matchesSearch = title.includes(query) || desc.includes(query);
        const matchesFilter = currentFilter === 'Todos' || level === currentFilter;

        if (matchesSearch && matchesFilter) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const grid = document.getElementById('grid');
    const noRes = document.querySelector('.no-results');
    if (visibleCount === 0) {
        if (!noRes) {
            const div = document.createElement('div');
            div.className = 'no-results';
            div.innerText = 'No se encontraron packs que coincidan con tu búsqueda.';
            grid.appendChild(div);
        }
    } else if (noRes) {
        noRes.remove();
    }
}

// Drag and Drop implementation
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    if (!dropZone) return;

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
        if (files.length > 0 && files[0].name.endsWith('.csv')) {
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
        const parsedData = parseImportedCsv(text);
        if (parsedData.entries.length > 0) {
            openPracticeModal(parsedData);
        } else {
            alert("No se pudieron encontrar entradas válidas en el archivo CSV.");
        }
    };
    reader.readAsText(file);
}

function parseCsvRow(row) {
    const result = [];
    let insideQuote = false;
    let entries = '';
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
            result.push(entries.trim());
            entries = '';
        } else {
            entries += char;
        }
    }
    result.push(entries.trim());
    return result;
}

function parseImportedCsv(text) {
    const lines = text.split('\n');
    let title = "Tabla Importada";
    let formula = "1d8";
    let desc = "Practica con tu tabla didáctica importada.";
    const entries = [];

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        if (line.startsWith('#')) {
            if (line.startsWith('# Tabla:')) {
                title = line.replace('# Tabla:', '').trim();
            } else if (line.startsWith('# Fórmula de tirada:')) {
                formula = line.replace('# Fórmula de tirada:', '').trim();
            } else if (line.startsWith('# Descripción:')) {
                desc = line.replace('# Descripción:', '').trim();
            }
            continue;
        }

        const matches = parseCsvRow(line);
        if (matches.length >= 3) {
            const minStr = matches[0].replace(/"/g, '').trim();
            const maxStr = matches[1].replace(/"/g, '').trim();
            const textRaw = matches[2].replace(/"/g, '').trim();
            
            const min = parseInt(minStr);
            const max = parseInt(maxStr);
            if (!isNaN(min) && !isNaN(max) && textRaw !== "Entrada") {
                entries.push({ min, max, text: textRaw });
            }
        }
    }
    return { title, formula, desc, entries };
}

// Modal Practice Logic
let importedTableData = null;
let modalCurrentMode = 'direct';
let modalIsRevealed = true;
let modalLastEnglishText = "";
let modalLastSpanishText = "";
let modalQuizAttempts = 0;
let modalQuizCorrect = 0;
let modalCurrentEntry = null;

function toggleModalImages() {
    updateModalVisibility();
}

function openPracticeModal(data) {
    importedTableData = data;
    document.getElementById('modalTitle').innerText = data.title;
    document.getElementById('modalDesc').innerText = data.desc;
    document.getElementById('practiceModal').style.display = 'flex';
    setModalMode('direct');
}

function closeModal() {
    document.getElementById('practiceModal').style.display = 'none';
    importedTableData = null;
    loadPacks(); // Reload to update main UI progress bars!
}

function setModalMode(mode) {
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

    writeArea.style.display = 'none';
    srsFeedback.style.display = 'none';

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

// Selects next entry smart using Spaced Repetition (SRS)
function selectNextModalEntry() {
    if (!importedTableData || importedTableData.entries.length === 0) return null;
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const srsData = getSrsData()[packId] || {};
    
    let dueEntries = [];
    let neverReviewed = [];
    let lowBoxEntries = [];
    
    importedTableData.entries.forEach(entry => {
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
    
    if (dueEntries.length > 0) {
        modalCurrentEntry = dueEntries[Math.floor(Math.random() * dueEntries.length)];
    } else if (neverReviewed.length > 0) {
        modalCurrentEntry = neverReviewed[Math.floor(Math.random() * neverReviewed.length)];
    } else {
        lowBoxEntries.sort((a, b) => a.box - b.box);
        if (lowBoxEntries.length > 0) {
            modalCurrentEntry = lowBoxEntries[0].entry;
        } else {
            modalCurrentEntry = importedTableData.entries[Math.floor(Math.random() * importedTableData.entries.length)];
        }
    }
    return modalCurrentEntry;
}

function rollModal() {
    if (!importedTableData) return;
    
    // Choose next using SRS
    const entry = selectNextModalEntry();
    if (!entry) return;
    
    // Pick a simulated roll within range
    const val = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
    const rawText = entry.text;

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

    document.getElementById('modalRollVal').innerText = "Tirada (SRS): " + val;
    document.getElementById('modalMainText').innerText = main;
    document.getElementById('modalSubText').innerText = sub;

    const modalVocabImg = document.getElementById('modalVocabImg');
    if (imageUrl) {
        modalVocabImg.src = imageUrl;
    } else {
        modalVocabImg.src = "";
    }

    modalIsRevealed = (modalCurrentMode === 'direct' || sub === "");
    updateModalVisibility();

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

function revealModal() {
    modalIsRevealed = true;
    updateModalVisibility();
    speakModal();
    
    // Show SRS grading buttons in flashcard when revealed
    if (modalCurrentMode === 'flashcard') {
        document.getElementById('modalSrsFeedback').style.display = 'flex';
    }
}

function rateModalSrs(isCorrect) {
    if (!importedTableData) return;
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    updateWordSrs(packId, modalLastSpanishText, isCorrect);
    document.getElementById('modalSrsFeedback').style.display = 'none';
}

function speakModal() {
    if (!modalLastEnglishText) return;
    const textToSpeak = modalLastEnglishText.split('/')[0].split(';')[0].trim();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

function parseRoll(f) {
    const match = f.match(/(\d+)d(\d+)/);
    if (!match) return Math.floor(Math.random() * 8) + 1;
    const n = parseInt(match[1]);
    const d = parseInt(match[2]);
    let total = 0;
    for(let i=0; i<n; i++) total += Math.floor(Math.random() * d) + 1;
    return total;
}

// Clean text for validation
function cleanText(txt) {
    if (!txt) return "";
    return txt.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")      // remove punctuation
        .replace(/\s+/g, " ")                             // normalize spaces
        .trim();
}

// Simple difference highlight side-by-side helper
function getDiffHighlight(typed, correct) {
    let html = "";
    const len = Math.max(typed.length, correct.length);
    for (let i = 0; i < len; i++) {
        if (typed[i] === correct[i]) {
            html += typed[i];
        } else {
            if (typed[i]) html += `<span class="diff-del">${typed[i]}</span>`;
            if (correct[i]) html += `<span class="diff-ins">${correct[i]}</span>`;
        }
    }
    return html;
}

// Write Mode Functions
function startModalWriteQuestion() {
    const entry = selectNextModalEntry();
    if (!entry) return;

    document.getElementById('modalSubContainer').style.display = 'none';
    document.getElementById('modalBtnReveal').style.display = 'none';
    document.getElementById('modalRollVal').style.display = 'none';
    document.getElementById('modalImgContainer').style.display = 'none';
    document.getElementById('modalQuizOptions').style.display = 'none';
    document.getElementById('modalSrsFeedback').style.display = 'none';

    const parts = entry.text.split("->");
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

function checkModalWriteAnswer() {
    const input = document.getElementById('modalWriteInput');
    const feedback = document.getElementById('modalWriteFeedback');
    const actionBtn = document.getElementById('modalActionBtn');
    
    const typed = input.value.trim();
    if (!typed) return;

    input.disabled = true;

    // Split valid answers by slash, semicolon or comma
    const correctOptions = modalLastEnglishText.split(/[/\;,]/).map(s => cleanText(s.trim()));
    const typedClean = cleanText(typed);

    const isCorrect = correctOptions.includes(typedClean);
    const packId = "csv_" + importedTableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");

    updateWordSrs(packId, modalLastSpanishText, isCorrect);

    if (isCorrect) {
        feedback.innerText = "¡Correcto! 🎉";
        feedback.className = "write-feedback correct";
        speakModal();
    } else {
        const diffMarkup = getDiffHighlight(typed, modalLastEnglishText.split(/[/\;,]/)[0].trim());
        feedback.innerHTML = `Incorrecto. <br>Tu intento: <span style="font-weight:normal;">${diffMarkup}</span><br>Correcto: <strong>${modalLastEnglishText}</strong>`;
        feedback.className = "write-feedback incorrect";
    }

    actionBtn.innerText = 'Siguiente Pregunta';
    actionBtn.onclick = startModalWriteQuestion;
}

// Quiz Functions
function updateModalQuizScore() {
    document.getElementById('modalQuizScore').innerText = "Puntuación: " + modalQuizCorrect + "/" + modalQuizAttempts;
}

function startModalQuizQuestion() {
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

    const entry = selectNextModalEntry();
    if (!entry) return;

    const parts = entry.text.split("->");
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

            updateWordSrs(packId, spanish, isCorrect);

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
