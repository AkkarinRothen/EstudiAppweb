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
        this.stopBubbleGame();

        // Reset elements style
        if (this.elements.quizScore) this.elements.quizScore.style.display = 'none';
        if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
        if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';
        if (this.elements.matchArea) this.elements.matchArea.style.display = 'none';
        if (this.elements.bubbleArea) this.elements.bubbleArea.style.display = 'none';
        if (this.elements.sniperArea) this.elements.sniperArea.style.display = 'none';
        if (this.elements.dragArea) this.elements.dragArea.style.display = 'none';
        if (this.elements.dictationArea) this.elements.dictationArea.style.display = 'none';
        if (this.elements.timerContainer) this.elements.timerContainer.style.display = (mode === 'timeAttack') ? 'flex' : 'none';
        
        if (this.elements.subContainer) {
            this.elements.subContainer.style.display = (mode === 'direct' || mode === 'write' || mode === 'dictation') ? 'flex' : 'none';
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
            } else if (mode === 'match' || mode === 'bubble') {
                actionBtn.innerText = 'Reiniciar Juego';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => {
                    if (mode === 'match') this.startMatchGame();
                    else this.startBubbleGame();
                };
            } else if (mode === 'sniper') {
                actionBtn.innerText = 'Reiniciar Sniper';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.startSniperGame();
            } else if (mode === 'drag') {
                actionBtn.innerText = 'Reiniciar Conectar';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.startDragGame();
            } else if (mode === 'dictation') {
                actionBtn.innerText = 'Siguiente Dictado';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.startDictationQuestion();
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
        } else if (mode === 'match') {
            this.startMatchGame();
        } else if (mode === 'bubble') {
            this.startBubbleGame();
        } else if (mode === 'sniper') {
            this.startSniperGame();
        } else if (mode === 'drag') {
            this.startDragGame();
        } else if (mode === 'dictation') {
            this.startDictationQuestion();
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
            imageUrl = third;
        }
        if (!imageUrl && sub) {
            const queryWord = Utils.extractImageKeyword(sub);
            if (queryWord) {
                imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
            }
        }

        // Normalize local image relative path
        if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
            if (this.isModal) {
                // Root context (index.html, admin.html) - path must be e.g. "assets/..."
                if (imageUrl.startsWith('../')) {
                    imageUrl = imageUrl.substring(3);
                }
            } else {
                // Subdirectory context (presets/pack.html) - path must be e.g. "../assets/..."
                if (!imageUrl.startsWith('../')) {
                    imageUrl = '../' + imageUrl;
                }
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
            imageUrl = third;
        }
        if (!imageUrl && parts.length > 1) {
            const sub = parts[1].trim();
            const queryWord = Utils.extractImageKeyword(sub);
            if (queryWord) {
                imageUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
            }
        }

        // Normalize local image relative path for prefetch
        if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
            if (this.isModal) {
                if (imageUrl.startsWith('../')) {
                    imageUrl = imageUrl.substring(3);
                }
            } else {
                if (!imageUrl.startsWith('../')) {
                    imageUrl = '../' + imageUrl;
                }
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

    startMatchGame() {
        const matchArea = this.elements.matchArea;
        if (!matchArea) return;
        
        matchArea.innerHTML = '';
        matchArea.style.display = 'flex';
        
        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.mainText) this.elements.mainText.innerText = "Empareja las palabras";

        if (this.entries.length < 3) {
            matchArea.innerHTML = '<div class="info">Se necesitan al menos 3 vocablos para jugar al Memorama.</div>';
            return;
        }

        const gameSize = Math.min(6, this.entries.length);
        const shuffledEntries = [...this.entries].sort(() => Math.random() - 0.5);
        const selected = shuffledEntries.slice(0, gameSize);

        const cards = [];
        selected.forEach((entry, idx) => {
            const parts = entry.text.split("->");
            const es = parts[0].trim();
            const en = parts[1]?.trim() || "";
            
            let imgUrl = "";
            if (parts.length > 2) {
                const third = parts[2].trim();
                imgUrl = third;
            }
            if (!imgUrl) {
                const queryWord = Utils.extractImageKeyword(en);
                if (queryWord && (this.elements.enableImages ? this.elements.enableImages.checked : true)) {
                    imgUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
                }
            }
            if (imgUrl && !imgUrl.startsWith('http://') && !imgUrl.startsWith('https://') && !imgUrl.startsWith('data:')) {
                if (this.isModal) {
                    if (imgUrl.startsWith('../')) imgUrl = imgUrl.substring(3);
                } else {
                    if (!imgUrl.startsWith('../')) imgUrl = '../' + imgUrl;
                }
            }

            // Card A (Spanish/Image)
            cards.push({
                id: `card_${idx}_es`,
                pairId: idx,
                type: 'es',
                content: (imgUrl && (this.elements.enableImages ? this.elements.enableImages.checked : true)) 
                    ? `<img src="${imgUrl}" alt="${es}">` 
                    : `<span>${es}</span>`
            });

            // Card B (English translation)
            cards.push({
                id: `card_${idx}_en`,
                pairId: idx,
                type: 'en',
                content: `<span>${en}</span>`
            });
        });

        cards.sort(() => Math.random() - 0.5);

        const grid = document.createElement('div');
        grid.className = 'match-grid';
        
        let activeCards = [];
        let matchedCount = 0;

        cards.forEach(cardData => {
            const cardEl = document.createElement('div');
            cardEl.className = 'match-card';
            cardEl.dataset.id = cardData.id;
            cardEl.dataset.pairId = cardData.pairId;
            cardEl.innerHTML = `
                <div class="match-card-inner">
                    <div class="match-card-front">❓</div>
                    <div class="match-card-back">
                        ${cardData.content}
                    </div>
                </div>
            `;

            cardEl.addEventListener('click', () => {
                if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched') || activeCards.length >= 2) {
                    return;
                }

                cardEl.classList.add('flipped');
                activeCards.push(cardEl);

                if (activeCards.length === 2) {
                    const [card1, card2] = activeCards;
                    if (card1.dataset.pairId === card2.dataset.pairId) {
                        setTimeout(() => {
                            card1.classList.add('matched');
                            card2.classList.add('matched');
                            activeCards = [];
                            matchedCount++;

                            if (matchedCount === gameSize) {
                                showWinScreen();
                            }
                        }, 500);
                    } else {
                        setTimeout(() => {
                            card1.classList.remove('flipped');
                            card2.classList.remove('flipped');
                            activeCards = [];
                        }, 1200);
                    }
                }
            });

            grid.appendChild(cardEl);
        });

        matchArea.appendChild(grid);

        const showWinScreen = () => {
            matchArea.innerHTML = `
                <div class="match-win-screen">
                    <h3 style="color:var(--success); font-size:24px; margin:0;">¡Felicidades! 🎉</h3>
                    <p class="info" style="font-size:14px;">Has emparejado todos los términos correctamente.</p>
                    <button class="srs-btn srs-btn-good" style="margin-top:10px; width:auto; padding:12px 24px;">Jugar de nuevo</button>
                </div>
            `;
            matchArea.querySelector('button').onclick = () => this.startMatchGame();
        };
    }

    startBubbleGame() {
        const bubbleArea = this.elements.bubbleArea;
        if (!bubbleArea) return;

        this.stopBubbleGame();
        
        bubbleArea.style.display = 'flex';
        bubbleArea.innerHTML = `
            <div class="bubble-target-box" id="bubbleTargetBox">Cargando vocablo...</div>
            <div class="bubble-area" id="bubbleGamePlayground"></div>
        `;

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.mainText) this.elements.mainText.innerText = "Estalla la traducción correcta";

        if (this.entries.length < 2) {
            bubbleArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar a las Burbujas.</div>';
            return;
        }

        this.bubbleScore = 0;
        this.selectNextBubbleTarget();

        const playground = bubbleArea.querySelector('#bubbleGamePlayground');
        this.bubbleSpawnInterval = setInterval(() => {
            if (!this.bubbleTargetEntry) return;

            const isCorrect = Math.random() < 0.35;
            let text = "";
            let entry = null;

            if (isCorrect) {
                entry = this.bubbleTargetEntry;
                text = entry.en;
            } else {
                const distractors = this.entries.filter(e => e.text.split("->")[0].trim() !== this.bubbleTargetEntry.es);
                entry = distractors[Math.floor(Math.random() * distractors.length)];
                text = entry ? entry.en : "";
            }

            if (!text) return;

            const bubble = document.createElement('div');
            bubble.className = 'bubble-element';
            bubble.innerText = text;
            bubble.style.left = `${5 + Math.random() * 75}%`;
            
            const size = 75 + Math.floor(Math.random() * 20);
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            bubble.addEventListener('click', () => {
                if (bubble.classList.contains('pop') || bubble.classList.contains('wrong')) return;

                const targetParts = this.bubbleTargetEntry.en.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
                const cleanBubbleText = Utils.cleanText(text);
                const matchCorrect = targetParts.includes(cleanBubbleText);

                if (matchCorrect) {
                    bubble.classList.add('pop');
                    this.bubbleScore++;
                    this.speak();
                    this.selectNextBubbleTarget();
                    
                    playground.querySelectorAll('.bubble-element').forEach(b => {
                        if (targetParts.includes(Utils.cleanText(b.innerText))) {
                            b.classList.add('pop');
                            setTimeout(() => b.remove(), 350);
                        }
                    });
                    
                    setTimeout(() => bubble.remove(), 350);
                } else {
                    bubble.classList.add('wrong');
                    setTimeout(() => bubble.classList.remove('wrong'), 500);
                }
            });

            bubble.addEventListener('animationend', (e) => {
                if (e.animationName === 'floatUp') {
                    bubble.remove();
                }
            });

            playground.appendChild(bubble);
        }, 1600);
    }

    selectNextBubbleTarget() {
        if (this.entries.length === 0) return;
        
        const randEntry = this.entries[Math.floor(Math.random() * this.entries.length)];
        const parts = randEntry.text.split("->");
        const es = parts[0].trim();
        const en = parts[1]?.trim() || "";

        this.bubbleTargetEntry = { es, en };
        this.lastEnglishText = en;

        const box = this.elements.bubbleArea?.querySelector('#bubbleTargetBox');
        if (box) {
            box.innerText = `Encuentra la traducción de: ${es} (Puntos: ${this.bubbleScore})`;
        }
    }


    stopBubbleGame() {
        if (this.bubbleSpawnInterval) {
            clearInterval(this.bubbleSpawnInterval);
            this.bubbleSpawnInterval = null;
        }
        this.bubbleTargetEntry = null;
    }

    // ─── 🎯 SNIPER DE PALABRAS ────────────────────────────────────────────────

    startSniperGame() {
        const sniperArea = this.elements.sniperArea;
        if (!sniperArea) return;

        this.stopSniperGame();

        if (this.entries.length < 2) {
            sniperArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar al Sniper.</div>';
            sniperArea.style.display = 'flex';
            return;
        }

        this.sniperLives = 3;
        this.sniperScore = 0;

        sniperArea.innerHTML = `
            <div class="sniper-hud">
                <span class="sniper-lives-display" id="sniperLives">❤️❤️❤️</span>
                <span class="sniper-score-display" id="sniperScore">🎯 0 disparos</span>
            </div>
            <div class="sniper-target-box" id="sniperTarget">Cargando...</div>
            <div class="sniper-lanes" id="sniperLanes"></div>
            <div class="sniper-input-row">
                <input type="text" class="sniper-input" id="sniperInput" placeholder="Escribe la traducción en español y pulsa Enter..." autocomplete="off">
            </div>
        `;
        sniperArea.style.display = 'flex';

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.mainText) this.elements.mainText.innerText = '';

        this._sniperPickNextTarget();

        const input = sniperArea.querySelector('#sniperInput');
        input.focus();
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = Utils.cleanText(input.value);
                if (!val) return;
                this._sniperCheckAnswer(val);
                input.value = '';
            }
        });

        this.sniperSpawnInterval = setInterval(() => {
            this._sniperSpawnWord();
        }, 2200);
    }

    _sniperPickNextTarget() {
        if (!this.entries || this.entries.length === 0) return;
        const rand = this.entries[Math.floor(Math.random() * this.entries.length)];
        const parts = rand.text.split('->');
        this._sniperTarget = {
            es: parts[0].trim(),
            en: parts[1]?.split('||')[0].trim() || ''
        };
        const box = document.getElementById('sniperTarget');
        if (box) box.innerText = `Traduce al español: "${this._sniperTarget.en}"`;
    }

    _sniperSpawnWord() {
        const lanes = document.getElementById('sniperLanes');
        if (!lanes || !this._sniperTarget) return;

        const isCorrect = Math.random() < 0.4;
        let wordText = '';

        if (isCorrect) {
            wordText = this._sniperTarget.es;
        } else {
            const distractors = this.entries.filter(e => {
                const p = e.text.split('->');
                return p[0].trim() !== this._sniperTarget.es;
            });
            if (distractors.length === 0) wordText = this._sniperTarget.es;
            else {
                const d = distractors[Math.floor(Math.random() * distractors.length)];
                wordText = d.text.split('->')[0].trim();
            }
        }

        const word = document.createElement('div');
        word.className = 'sniper-word';
        word.innerText = wordText;
        word.dataset.correct = isCorrect ? '1' : '0';
        word.style.left = `${5 + Math.random() * 70}%`;

        word.addEventListener('animationend', () => {
            if (word.parentNode) {
                word.remove();
                if (word.dataset.correct === '1') {
                    this._sniperLoseLife();
                }
            }
        });

        lanes.appendChild(word);
    }

    _sniperCheckAnswer(val) {
        if (!this._sniperTarget) return;
        const target = Utils.cleanText(this._sniperTarget.es);

        if (Utils.compareText(val, target)) {
            this.sniperScore++;
            const scoreEl = document.getElementById('sniperScore');
            if (scoreEl) scoreEl.innerText = `🎯 ${this.sniperScore} disparos`;

            // Visual hit feedback on matching words
            const lanes = document.getElementById('sniperLanes');
            if (lanes) {
                lanes.querySelectorAll('.sniper-word').forEach(w => {
                    if (w.dataset.correct === '1') {
                        w.classList.add('sniper-hit');
                        setTimeout(() => w.remove(), 400);
                    }
                });
            }
            this.rateSrs(true);
            this.speak();
            this._sniperPickNextTarget();
        } else {
            const input = document.getElementById('sniperInput');
            if (input) {
                input.classList.add('sniper-wrong');
                setTimeout(() => input.classList.remove('sniper-wrong'), 600);
            }
        }
    }

    _sniperLoseLife() {
        if (!this.sniperLives) return;
        this.sniperLives--;
        const livesEl = document.getElementById('sniperLives');
        if (livesEl) {
            livesEl.innerText = '❤️'.repeat(this.sniperLives) + '🖤'.repeat(3 - this.sniperLives);
        }
        if (this.sniperLives <= 0) {
            this.stopSniperGame();
            const sniperArea = this.elements.sniperArea;
            if (sniperArea) {
                sniperArea.innerHTML = `
                    <div class="sniper-gameover">
                        <div style="font-size:48px;">💀</div>
                        <h3>Game Over</h3>
                        <p class="info">Disparos acertados: <strong>${this.sniperScore}</strong></p>
                        <button class="srs-btn srs-btn-good" style="width:auto;padding:12px 24px;margin-top:10px;">Jugar de nuevo</button>
                    </div>
                `;
                sniperArea.querySelector('button').onclick = () => this.startSniperGame();
            }
        }
    }

    stopSniperGame() {
        if (this.sniperSpawnInterval) {
            clearInterval(this.sniperSpawnInterval);
            this.sniperSpawnInterval = null;
        }
        this._sniperTarget = null;
    }

    // ─── 🔗 ARRASTRAR Y CONECTAR ─────────────────────────────────────────────

    startDragGame() {
        const dragArea = this.elements.dragArea;
        if (!dragArea) return;

        dragArea.innerHTML = '';
        dragArea.style.display = 'flex';

        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.mainText) this.elements.mainText.innerText = 'Conecta cada palabra con su traducción';

        if (this.entries.length < 2) {
            dragArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar a Conectar.</div>';
            return;
        }

        const gameSize = Math.min(6, this.entries.length);
        const selected = [...this.entries].sort(() => Math.random() - 0.5).slice(0, gameSize);

        const esWords = selected.map((e, i) => ({ id: i, text: e.text.split('->')[0].trim() }));
        const enWords = selected.map((e, i) => ({ id: i, text: e.text.split('->')[1]?.split('||')[0].trim() || '' }));
        const shuffledEn = [...enWords].sort(() => Math.random() - 0.5);

        let connections = []; // { fromId, toId, line }
        let selectedEs = null;
        let matchedCount = 0;

        // Build layout
        dragArea.innerHTML = `
            <div class="drag-wrapper">
                <svg class="drag-svg" id="dragSvg"></svg>
                <div class="drag-col" id="dragColEs"></div>
                <div class="drag-col" id="dragColEn"></div>
            </div>
        `;

        const svg = dragArea.querySelector('#dragSvg');
        const colEs = dragArea.querySelector('#dragColEs');
        const colEn = dragArea.querySelector('#dragColEn');

        const drawLine = (el1, el2, color = 'var(--primary)') => {
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const svgR = svg.getBoundingClientRect();

            const x1 = r1.right - svgR.left;
            const y1 = r1.top + r1.height / 2 - svgR.top;
            const x2 = r2.left - svgR.left;
            const y2 = r2.top + r2.height / 2 - svgR.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const cx = (x1 + x2) / 2;
            line.setAttribute('d', `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '3');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            svg.appendChild(line);
            return line;
        };

        esWords.forEach(word => {
            const el = document.createElement('div');
            el.className = 'drag-word';
            el.innerText = word.text;
            el.dataset.id = word.id;

            el.addEventListener('click', () => {
                if (el.classList.contains('matched')) return;
                dragArea.querySelectorAll('.drag-word.selected').forEach(w => w.classList.remove('selected'));
                if (selectedEs?.id === word.id) {
                    selectedEs = null;
                } else {
                    selectedEs = { id: word.id, el };
                    el.classList.add('selected');
                }
            });

            colEs.appendChild(el);
        });

        shuffledEn.forEach(word => {
            const el = document.createElement('div');
            el.className = 'drag-word';
            el.innerText = word.text;
            el.dataset.id = word.id;

            el.addEventListener('click', () => {
                if (el.classList.contains('matched') || !selectedEs) return;

                const isCorrect = selectedEs.id === word.id;

                if (isCorrect) {
                    selectedEs.el.classList.remove('selected');
                    selectedEs.el.classList.add('matched');
                    el.classList.add('matched');

                    // Draw permanent green line
                    setTimeout(() => {
                        drawLine(selectedEs.el, el, 'var(--success, #4CAF50)');
                    }, 10);

                    this.rateSrs(true);
                    matchedCount++;
                    selectedEs = null;

                    if (matchedCount === gameSize) {
                        setTimeout(() => {
                            dragArea.innerHTML = `
                                <div class="match-win-screen">
                                    <h3 style="color:var(--success,#4CAF50);font-size:24px;margin:0;">¡Perfecto! 🎉</h3>
                                    <p class="info">Has conectado todos los pares correctamente.</p>
                                    <button class="srs-btn srs-btn-good" style="margin-top:10px;width:auto;padding:12px 24px;">Jugar de nuevo</button>
                                </div>
                            `;
                            dragArea.querySelector('button').onclick = () => this.startDragGame();
                        }, 600);
                    }
                } else {
                    // Flash wrong
                    el.classList.add('drag-wrong');
                    selectedEs.el.classList.add('drag-wrong');
                    setTimeout(() => {
                        el.classList.remove('drag-wrong');
                        selectedEs?.el.classList.remove('drag-wrong');
                        selectedEs?.el.classList.remove('selected');
                        selectedEs = null;
                    }, 700);
                    this.rateSrs(false);
                }
            });

            colEn.appendChild(el);
        });
    }

    // ─── 🎵 DICTADO DE AUDIO ─────────────────────────────────────────────────

    startDictationQuestion() {
        const dictationArea = this.elements.dictationArea;
        if (!dictationArea) return;

        dictationArea.innerHTML = '';
        dictationArea.style.display = 'flex';

        if (this.entries.length === 0) {
            dictationArea.innerHTML = '<div class="info">No hay vocablos disponibles.</div>';
            return;
        }

        if (this.elements.btnReveal) this.elements.btnReveal.style.display = 'none';
        if (this.elements.rollVal) this.elements.rollVal.style.display = 'none';
        if (this.elements.imgContainer) this.elements.imgContainer.style.display = 'none';
        if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';

        // Select entry using SRS
        const dummyTableData = { title: this.packId, entries: this.entries };
        const entry = Srs.selectNextSrsEntry(dummyTableData, this.lastSpanishText);
        if (!entry) return;

        const parts = entry.text.split('->');
        const es = parts[0].trim();
        const en = parts[1]?.split('||')[0].trim() || '';
        this.lastSpanishText = es;
        this.lastEnglishText = en;

        if (this.elements.mainText) this.elements.mainText.innerText = '🎵 Escucha y escribe en español';

        dictationArea.innerHTML = `
            <div class="dictation-instructions">Escucha la pronunciación en inglés y escribe la traducción al español</div>
            <button class="dictation-replay-btn" id="dictationReplayBtn">🔊 Escuchar de nuevo</button>
            <input type="text" class="dictation-input" id="dictationInput" placeholder="Escribe la traducción en español..." autocomplete="off">
            <div class="dictation-feedback" id="dictationFeedback"></div>
            <button class="srs-btn srs-btn-good" id="dictationCheckBtn" style="width:auto;padding:10px 24px;margin-top:8px;">✅ Verificar</button>
        `;

        dictationArea.style.display = 'flex';

        // Auto-speak
        setTimeout(() => {
            Speech.speak(en,
                this.elements.voiceSelect?.value,
                this.elements.speedSlider?.value
            );
        }, 400);

        const replayBtn = dictationArea.querySelector('#dictationReplayBtn');
        replayBtn.addEventListener('click', () => {
            Speech.speak(en,
                this.elements.voiceSelect?.value,
                this.elements.speedSlider?.value
            );
        });

        const checkFn = () => {
            const inputEl = dictationArea.querySelector('#dictationInput');
            const feedbackEl = dictationArea.querySelector('#dictationFeedback');
            const val = Utils.cleanText(inputEl?.value || '');
            const target = Utils.cleanText(es);

            if (!val) return;

            const isCorrect = Utils.compareText(val, target);

            if (isCorrect) {
                feedbackEl.innerHTML = `<span class="dictation-correct">✅ ¡Correcto! La traducción es <strong>${es}</strong></span>`;
                inputEl.classList.add('dictation-input-correct');
                inputEl.disabled = true;
                this.rateSrs(true);
                this.speak();
            } else {
                feedbackEl.innerHTML = `<span class="dictation-incorrect">❌ Era: <strong>${es}</strong></span>`;
                inputEl.classList.add('dictation-input-wrong');
                inputEl.disabled = true;
                this.rateSrs(false);
            }

            // Show next button
            const checkBtn = dictationArea.querySelector('#dictationCheckBtn');
            if (checkBtn) {
                checkBtn.innerText = '➡️ Siguiente';
                checkBtn.onclick = () => this.startDictationQuestion();
            }
        };

        const checkBtn = dictationArea.querySelector('#dictationCheckBtn');
        checkBtn.addEventListener('click', checkFn);

        const inputEl = dictationArea.querySelector('#dictationInput');
        inputEl.focus();
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') checkFn();
        });
    }
}
