import * as Storage from './storage.js';
import * as Srs from './srs.js';
import * as Speech from './speech.js';
import * as Utils from './utils.js';

export class StudyEngine {
    constructor({
        elements,
        packId,
        formula = '1d6',
        entries = [],
        isModal = false,
        onStatsUpdate = null
    }) {
        this.elements = elements;
        this.packId = packId;
        this.formula = formula;
        this.entries = entries;
        this.isModal = isModal;
        this.onStatsUpdate = onStatsUpdate;

        // Internal State
        this.currentMode = 'direct';
        this.activeEntry = null;
        this.isRevealed = true;
        this.lastSpanishText = "";
        this.lastEnglishText = "";
        
        // Quiz State
        this.quizAttempts = 0;
        this.quizCorrect = 0;

        // Time Attack State
        this.timerInterval = null;
        this.timeLeft = 60;
        this.timeAttackScore = 0;
        this.isTimeAttackActive = false;

        this.init();
    }

    init() {
        // Initialize TTS voice selectors
        if (this.elements.voiceSelect) {
            Speech.initTtsControls(
                this.elements.voiceSelect,
                this.elements.speedSlider,
                this.elements.speedVal
            );
        }
        this.setupTtsListeners();
        this.setupImageListener();
    }

    setupTtsListeners() {
        if (this.elements.voiceSelect) {
            this.elements.voiceSelect.addEventListener('change', () => this.saveTtsPreferences());
        }
        if (this.elements.speedSlider) {
            this.elements.speedSlider.addEventListener('input', (e) => {
                if (this.elements.speedVal) {
                    this.elements.speedVal.innerText = parseFloat(e.target.value).toFixed(1) + "x";
                }
                this.saveTtsPreferences();
            });
        }
    }

    setupImageListener() {
        if (this.elements.enableImages) {
            this.elements.enableImages.addEventListener('change', () => this.updateVisibility());
        }
    }

    saveTtsPreferences() {
        Speech.saveTtsPreferences(
            this.elements.voiceSelect?.value,
            this.elements.speedSlider?.value
        );
    }

    setMode(mode) {
        this.currentMode = mode;
        this.stopTimeAttack();

        // Reset elements style
        if (this.elements.quizScore) this.elements.quizScore.style.display = 'none';
        if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
        if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';
        if (this.elements.timerContainer) this.elements.timerContainer.style.display = (mode === 'timeAttack') ? 'flex' : 'none';
        
        if (this.elements.subContainer) {
            this.elements.subContainer.style.display = (mode === 'direct' || mode === 'write') ? 'flex' : 'none';
        }
        if (this.elements.diceContainer) {
            this.elements.diceContainer.style.display = 'none';
        }

        // Update card click for flashcard mode
        const area = this.elements.resultArea;
        if (area) {
            if (mode === 'flashcard') {
                area.classList.add('flashcard-mode');
                area.onclick = () => {
                    if (!this.isRevealed) {
                        this.reveal();
                    }
                };
            } else {
                area.classList.remove('flashcard-mode');
                area.classList.remove('flipped');
                area.onclick = null;
            }
        }

        const actionBtn = this.elements.actionBtn;
        if (actionBtn) {
            if (mode === 'quiz' || mode === 'write' || mode === 'scrambled') {
                actionBtn.innerText = 'Siguiente Pregunta';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.nextQuestion();
            } else if (mode === 'timeAttack') {
                actionBtn.innerText = '¡Empezar contrarreloj!';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.startTimeAttack();
                if (this.elements.mainText) this.elements.mainText.innerText = "Prepárate...";
                if (this.elements.rollVal) this.elements.rollVal.innerText = "Modo Contrarreloj";
            } else {
                actionBtn.innerText = 'Tirar Dado';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.roll();
            }
        }

        if (mode === 'quiz') {
            if (this.elements.quizScore) this.elements.quizScore.style.display = 'block';
            this.quizAttempts = 0;
            this.quizCorrect = 0;
            this.updateQuizScoreDisplay();
            this.startQuizQuestion();
        } else if (mode === 'write') {
            this.startWriteQuestion();
        } else if (mode === 'scrambled') {
            this.startScrambledQuestion();
        } else if (mode !== 'timeAttack') {
            if (this.lastEnglishText) {
                if (this.elements.subText) this.elements.subText.innerText = this.lastEnglishText;
                this.isRevealed = (mode === 'direct');
                this.updateVisibility();
                this.updateSrsBadge(this.lastSpanishText);
            } else {
                if (this.elements.mainText) this.elements.mainText.innerText = '---';
                if (this.elements.rollVal) this.elements.rollVal.innerText = 'Tira el dado para empezar';
                if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
                if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
            }
        }
    }

    roll() {
        if (this.entries.length === 0) return;
        const actionBtn = this.elements.actionBtn;
        if (actionBtn) actionBtn.disabled = true;

        // SRS selection
        const dummyTableData = { title: this.packId, entries: this.entries };
        this.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.lastSpanishText);
        if (!this.activeEntry) {
            if (actionBtn) actionBtn.disabled = false;
            return;
        }

        const val = Math.floor(Math.random() * (this.activeEntry.max - this.activeEntry.min + 1)) + this.activeEntry.min;
        const rawText = this.activeEntry.text;
        const parts = rawText.split("->");
        const main = parts[0].trim();
        const sub = parts.length > 1 ? parts[1].trim() : "";

        this.setEntry(main, sub);

        // Resolve Image URL
        let imageUrl = "";
        if (parts.length > 2) {
            const third = parts[2].trim();
            if (third.startsWith("http://") || third.startsWith("https://")) {
                imageUrl = third;
            }
        }
        if (!imageUrl && sub) {
            const queryWord = Utils.extractImageKeyword(sub);
            if (queryWord) {
                imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
            }
        }

        const setupCardContent = () => {
            if (this.elements.rollVal) this.elements.rollVal.innerText = "Tirada (SRS): " + val;
            if (this.elements.mainText) this.elements.mainText.innerText = main;
            if (this.elements.subText) this.elements.subText.innerText = sub;
            this.updateSrsBadge(main);

            const vocabImg = this.elements.vocabImg;
            const imgContainer = this.elements.imgContainer;
            if (vocabImg && imgContainer) {
                // Clear any existing fallback SVG elements
                const oldFallback = imgContainer.querySelector('.vocab-fallback-svg');
                if (oldFallback) oldFallback.remove();

                if (imageUrl) {
                    vocabImg.style.display = 'block';
                    vocabImg.classList.remove('loaded');
                    imgContainer.classList.add('loading');
                    vocabImg.onload = () => {
                        imgContainer.classList.remove('loading');
                        vocabImg.classList.add('loaded');
                    };
                    vocabImg.onerror = () => {
                        vocabImg.style.display = 'none';
                        vocabImg.removeAttribute('src');
                        imgContainer.classList.remove('loading');
                        
                        const fallbackHtml = this.getFallbackSvg(this.packId);
                        imgContainer.insertAdjacentHTML('beforeend', fallbackHtml);
                    };
                    vocabImg.src = imageUrl;
                } else {
                    vocabImg.style.display = 'none';
                    vocabImg.removeAttribute('src');
                    imgContainer.classList.remove('loading');
                    vocabImg.classList.remove('loaded');
                    
                    const fallbackHtml = this.getFallbackSvg(this.packId);
                    imgContainer.insertAdjacentHTML('beforeend', fallbackHtml);
                }
            }

            this.isRevealed = (this.currentMode === 'direct' || sub === "");
            this.updateVisibility();

            if (this.currentMode === 'direct') {
                if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'flex';
                this.speak();
            } else {
                if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';
            }

            if (actionBtn) actionBtn.disabled = false;

            // Prefetch next image
            setTimeout(() => {
                const nextImgUrl = this.peekNextImageUrl(this.lastSpanishText);
                if (nextImgUrl) {
                    const prefetchImg = new Image();
                    prefetchImg.src = nextImgUrl;
                }
            }, 500);
        };

        const die = this.elements.die;
        const diceContainer = this.elements.diceContainer;
        if (diceContainer && die && (this.currentMode === 'direct' || this.currentMode === 'flashcard')) {
            if (this.elements.mainText) this.elements.mainText.innerText = "Rodando...";
            if (this.elements.subContainer) this.elements.subContainer.classList.add('hidden');
            if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
            if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';

            diceContainer.style.display = 'block';

            // Randomize faces
            const maxRange = this.entries.length;
            const face1 = die.querySelector('.face-1');
            if (face1) face1.innerText = val;
            for (let f = 2; f <= 6; f++) {
                const faceN = die.querySelector(`.face-${f}`);
                if (faceN) faceN.innerText = Math.floor(Math.random() * maxRange) + 1;
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

    getFallbackSvg(packId) {
        const id = (packId || '').toLowerCase();
        
        // Comida / Cooking / Restaurants
        if (id.includes('supermercado') || id.includes('restaurante') || id.includes('cocinando') || id.includes('food') || id.includes('eat')) {
            return `<div class="vocab-fallback-svg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-8.03C11.34 12.84 13 11.12 13 9V2h-2v7zm8-3h-3v14h3V6zm-3-4h3c1.1 0 2 .9 2 2v18H14V4c0-1.1.9-2 2-2z"/>
                </svg>
            </div>`;
        }
        
        // Viajes / Travel / Tourism
        if (id.includes('direcciones') || id.includes('aeropuerto') || id.includes('alojamiento') || id.includes('viaj') || id.includes('travel') || id.includes('hotel') || id.includes('airport')) {
            return `<div class="vocab-fallback-svg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
            </div>`;
        }
        
        // Acciones / Rutinas
        if (id.includes('rutina') || id.includes('ocio') || id.includes('action') || id.includes('time') || id.includes('routine') || id.includes('hobby')) {
            return `<div class="vocab-fallback-svg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                </svg>
            </div>`;
        }
        
        // Default (General academic, study, words, school)
        return `<div class="vocab-fallback-svg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5.89 12.5L12 15.82l6.11-3.32V16H12v2H5.89v-5.5z"/>
            </svg>
        </div>`;
    }

    reveal() {
        this.isRevealed = true;
        this.updateVisibility();
        this.speak();

        if (this.currentMode === 'flashcard' && this.elements.srsFeedback) {
            this.elements.srsFeedback.style.display = 'flex';
        }
    }

    rateSrs(isCorrect) {
        if (!this.lastSpanishText) return;
        const packKey = this.isModal ? "csv_" + this.packId.toLowerCase().replace(/[^a-z0-9]/g, "_") : this.packId;
        Srs.updateWordSrs(packKey, this.lastSpanishText, isCorrect, this.onStatsUpdate);
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';
        this.updateSrsBadge(this.lastSpanishText);
    }

    speak() {
        if (!this.lastEnglishText) return;
        Speech.speak(
            this.lastEnglishText,
            this.elements.voiceSelect,
            this.elements.speedSlider
        );
    }

    updateVisibility() {
        const subContainer = this.elements.subContainer;
        const btnReveal = this.elements.btnReveal;
        const imgContainer = this.elements.imgContainer;
        const showImages = this.elements.enableImages ? this.elements.enableImages.checked : true;
        const area = this.elements.resultArea;
        const isSupportedMode = this.currentMode !== 'quiz' && this.currentMode !== 'write' && this.currentMode !== 'scrambled' && this.currentMode !== 'timeAttack';

        if (this.isRevealed) {
            if (subContainer) subContainer.classList.remove('hidden');
            if (btnReveal) btnReveal.style.display = 'none';
            if (imgContainer) {
                imgContainer.style.display = (showImages && isSupportedMode) ? 'block' : 'none';
            }
            if (this.currentMode === 'flashcard' && area) {
                area.classList.add('flipped');
            } else if (area) {
                area.classList.remove('flipped');
            }
        } else {
            if (subContainer) subContainer.classList.add('hidden');
            if (btnReveal) btnReveal.style.display = 'block';
            if (imgContainer) {
                imgContainer.style.display = (showImages && isSupportedMode) ? 'block' : 'none';
            }
            if (area) area.classList.remove('flipped');
        }
    }

    updateSrsBadge(spanishWord) {
        const badge = this.elements.srsBadge;
        if (!badge) return;

        if (this.currentMode === 'quiz' || this.currentMode === 'write' || this.currentMode === 'scrambled' || this.currentMode === 'timeAttack') {
            badge.style.display = 'none';
            return;
        }

        const packKey = this.isModal ? "csv_" + this.packId.toLowerCase().replace(/[^a-z0-9]/g, "_") : this.packId;
        const srsData = Storage.getSrsData()[packKey] || {};
        const srsInfo = srsData[spanishWord];
        const box = srsInfo ? srsInfo.box : 1;

        badge.innerText = `Caja ${box}`;
        badge.style.display = 'block';

        badge.className = 'srs-badge';
        badge.classList.add(`srs-box-${box}`);
    }

    updateQuizScoreDisplay() {
        if (this.elements.quizScore) {
            this.elements.quizScore.innerText = `Puntuación: ${this.quizCorrect}/${this.quizAttempts}`;
        }
    }

    nextQuestion() {
        if (this.currentMode === 'quiz') {
            this.startQuizQuestion();
        } else if (this.currentMode === 'write') {
            const actionBtn = this.elements.actionBtn;
            if (actionBtn && actionBtn.innerText === 'Comprobar') {
                this.checkWriteAnswer();
            } else {
                this.startWriteQuestion();
            }
        } else if (this.currentMode === 'scrambled') {
            this.startScrambledQuestion();
        }
    }

    startQuizQuestion() {
        if (this.entries.length < 2) {
            if (this.elements.mainText) this.elements.mainText.innerText = "Se necesitan al menos 2 elementos para jugar.";
            return;
        }

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
        if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';

        const dummyTableData = { title: this.packId, entries: this.entries };
        this.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.lastSpanishText);
        if (!this.activeEntry) return;

        const parts = this.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts.length > 1 ? parts[1].trim() : "";

        this.setEntry(spanish, english);

        if (this.elements.mainText) this.elements.mainText.innerText = spanish;

        // Distractors
        const options = [english];
        const otherEntries = this.entries.filter(e => e.text.split("->")[0].trim() !== spanish);
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

        const optionsContainer = this.elements.quizOptions;
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            optionsContainer.style.display = 'flex';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.innerText = opt;
                btn.onclick = () => {
                    const buttons = optionsContainer.querySelectorAll('.quiz-option');
                    buttons.forEach(b => b.disabled = true);

                    const isCorrect = (opt === english);
                    this.quizAttempts++;

                    if (isCorrect) {
                        btn.classList.add('correct');
                        this.quizCorrect++;
                        this.speak();
                        if (this.isTimeAttackActive) {
                            this.timeAttackScore++;
                            setTimeout(() => this.nextTimeAttackEntry(), 500);
                        }
                    } else {
                        btn.classList.add('incorrect');
                        buttons.forEach(b => {
                            if (b.innerText === english) b.classList.add('correct');
                        });
                        if (this.isTimeAttackActive) {
                            setTimeout(() => this.nextTimeAttackEntry(), 800);
                        }
                    }

                    if (!this.isTimeAttackActive) {
                        this.rateSrs(isCorrect);
                        this.updateQuizScoreDisplay();
                    }
                };
                optionsContainer.appendChild(btn);
            });
        }
    }

    startWriteQuestion() {
        if (this.entries.length === 0) return;

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
        if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';

        const dummyTableData = { title: this.packId, entries: this.entries };
        this.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.lastSpanishText);
        if (!this.activeEntry) return;

        const parts = this.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts.length > 1 ? parts[1].trim() : "";

        this.setEntry(spanish, english);

        if (this.elements.mainText) this.elements.mainText.innerText = spanish;

        const writeArea = this.elements.writeArea;
        if (writeArea) writeArea.style.display = 'flex';

        const input = this.elements.writeInput;
        if (input) {
            input.value = "";
            input.disabled = false;
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkWriteAnswer();
                }
            };
        }

        const feedback = this.elements.writeFeedback;
        if (feedback) {
            feedback.innerText = "";
            feedback.className = "write-feedback";
        }

        const actionBtn = this.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Comprobar';
            actionBtn.onclick = () => this.checkWriteAnswer();
        }
    }

    checkWriteAnswer() {
        const input = this.elements.writeInput;
        const feedback = this.elements.writeFeedback;
        const actionBtn = this.elements.actionBtn;

        if (!input || !feedback) return;

        const typed = input.value.trim();
        if (!typed) return;

        input.disabled = true;

        const correctOptions = this.lastEnglishText.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
        const typedClean = Utils.cleanText(typed);
        const isCorrect = correctOptions.includes(typedClean);

        this.rateSrs(isCorrect);

        if (isCorrect) {
            feedback.innerText = "¡Correcto! 🎉";
            feedback.className = "write-feedback correct";
            this.speak();
        } else {
            const diffMarkup = Utils.getDiffHighlight(typed, this.lastEnglishText.split(/[/\;,]/)[0].trim());
            feedback.innerHTML = `Incorrecto. <br>Tu intento: <span style="font-weight:normal;">${diffMarkup}</span><br>Correcto: <strong>${this.lastEnglishText}</strong>`;
            feedback.className = "write-feedback incorrect";
        }

        if (actionBtn) {
            actionBtn.innerText = 'Siguiente Pregunta';
            actionBtn.onclick = () => this.startWriteQuestion();
        }
    }

    startScrambledQuestion() {
        if (this.entries.length === 0) return;

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
        if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';

        const dummyTableData = { title: this.packId, entries: this.entries };
        this.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.lastSpanishText);
        if (!this.activeEntry) return;

        const parts = this.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts.length > 1 ? parts[1].trim() : "";

        this.setEntry(spanish, english);

        if (this.elements.mainText) this.elements.mainText.innerText = spanish;

        const scrambledArea = this.elements.scrambledArea;
        if (!scrambledArea) return;
        scrambledArea.innerHTML = '';
        scrambledArea.style.display = 'flex';

        const baseAnswer = english.split(/[/\;,]/)[0].trim();
        const letters = baseAnswer.split('').filter(l => l !== ' ');
        const shuffled = [...letters].sort(() => Math.random() - 0.5);

        const slotsContainer = document.createElement('div');
        slotsContainer.className = 'scrambled-slots';

        const lettersContainer = document.createElement('div');
        lettersContainer.className = 'scrambled-letters';

        const slots = [];
        baseAnswer.split('').forEach(char => {
            const slot = document.createElement('div');
            if (char === ' ') {
                const space = document.createElement('div');
                space.style.width = '20px';
                slotsContainer.appendChild(space);
            } else {
                slot.className = 'scrambled-slot';
                slots.push(slot);
                slotsContainer.appendChild(slot);
            }
        });

        shuffled.forEach((letter, index) => {
            const tile = document.createElement('div');
            tile.className = 'scrambled-tile';
            tile.innerText = letter;
            tile.dataset.letter = letter;
            tile.dataset.index = index;

            tile.onclick = () => {
                if (tile.classList.contains('disabled')) return;

                const emptySlot = slots.find(s => !s.hasChildNodes());
                if (emptySlot) {
                    const clone = tile.cloneNode(true);
                    clone.onclick = () => {
                        emptySlot.removeChild(clone);
                        tile.classList.remove('disabled');
                    };
                    emptySlot.appendChild(clone);
                    tile.classList.add('disabled');

                    // Check if complete
                    if (slots.every(s => s.hasChildNodes())) {
                        const currentString = slots.map(s => s.firstChild.innerText).join('');
                        const targetString = baseAnswer.replace(/\s/g, '');

                        if (Utils.compareText(currentString, targetString)) {
                            slots.forEach(s => s.firstChild.classList.add('correct'));
                            this.rateSrs(true);
                            this.speak();

                            const actionBtn = this.elements.actionBtn;
                            if (actionBtn) {
                                actionBtn.innerText = 'Siguiente Pregunta';
                                actionBtn.onclick = () => this.startScrambledQuestion();
                            }
                        } else {
                            slots.forEach(s => s.firstChild.classList.add('incorrect'));
                            setTimeout(() => {
                                slots.forEach(s => {
                                    if (s.firstChild) s.removeChild(s.firstChild);
                                });
                                scrambledArea.querySelectorAll('.scrambled-tile').forEach(t => t.classList.remove('disabled'));
                            }, 1000);
                        }
                    }
                }
            };
            lettersContainer.appendChild(tile);
        });

        scrambledArea.appendChild(slotsContainer);
        scrambledArea.appendChild(lettersContainer);

        const actionBtn = this.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Pasar / No sé';
            actionBtn.onclick = () => {
                this.rateSrs(false);
                this.startScrambledQuestion();
            };
        }
    }

    startTimeAttack() {
        this.isTimeAttackActive = true;
        this.timeLeft = 60;
        this.timeAttackScore = 0;

        const timerVal = this.elements.timerVal;
        const timerContainer = this.elements.timerContainer;
        if (timerVal) timerVal.innerText = this.timeLeft + "s";
        if (timerContainer) timerContainer.style.display = 'flex';
        
        const actionBtn = this.elements.actionBtn;
        if (actionBtn) actionBtn.style.display = 'none';

        this.nextTimeAttackEntry();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            if (timerVal) timerVal.innerText = this.timeLeft + "s";
            if (this.timeLeft <= 0) {
                this.stopTimeAttack();
                this.showTimeAttackResults();
            }
        }, 1000);
    }

    stopTimeAttack() {
        this.isTimeAttackActive = false;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = null;
        const actionBtn = this.elements.actionBtn;
        if (actionBtn) actionBtn.style.display = 'block';
    }

    nextTimeAttackEntry() {
        if (!this.isTimeAttackActive) return;
        this.startQuizQuestion();
    }

    showTimeAttackResults() {
        const scrambledArea = this.elements.scrambledArea;
        if (scrambledArea) {
            scrambledArea.innerHTML = `
                <div class="time-attack-results">
                    <div class="results-label">¡Tiempo agotado!</div>
                    <div class="results-score">${this.timeAttackScore}</div>
                    <div class="results-label">Aciertos</div>
                </div>
            `;
            scrambledArea.style.display = 'flex';
        }
        if (this.elements.mainText) this.elements.mainText.innerText = "Fin del Juego";
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';

        const actionBtn = this.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Volver a intentar';
            actionBtn.onclick = () => this.setMode('timeAttack');
        }
    }

    peekNextImageUrl(excludeWordKey) {
        if (this.entries.length === 0) return "";
        const packKey = this.isModal ? "csv_" + this.packId.toLowerCase().replace(/[^a-z0-9]/g, "_") : this.packId;
        const srsData = Storage.getSrsData()[packKey] || {};

        let filteredEntries = this.entries;
        if (excludeWordKey && this.entries.length > 1) {
            filteredEntries = this.entries.filter(entry => {
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
            const queryWord = Utils.extractImageKeyword(sub);
            if (queryWord) {
                imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
            }
        }
        return imageUrl;
    }

    setEntry(main, sub) {
        this.lastSpanishText = main;
        this.lastEnglishText = sub;
        this.addToHistory(main, sub);
    }

    addToHistory(es, en) {
        if (this.currentMode === 'timeAttack') return;
        const list = this.elements.historyList;
        if (!list) return;
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `<span>${es}</span><strong>${en}</strong>`;
        list.prepend(item);
    }
}
