import * as Storage from './storage.js';
import * as Srs from './srs.js';
import * as Speech from './speech.js';
import * as Utils from './utils.js';
import * as Fx from './fx.js';
import { WordleGame } from './games/wordle.js';
import { MatchGame } from './games/match.js';
import { BubbleGame } from './games/bubble.js';
import { SniperGame } from './games/sniper.js';
import { DragGame } from './games/drag.js';
import { SentenceGame } from './games/sentence.js';
import { QuizGame } from './games/quiz.js';
import { WriteGame } from './games/write.js';
import { ScrambledGame } from './games/scrambled.js';
import { DictationGame } from './games/dictation.js';
import { TimeAttackGame } from './games/timeAttack.js';

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

        // Games
        this.wordleGame = new WordleGame(this);
        this.matchGame = new MatchGame(this);
        this.bubbleGame = new BubbleGame(this);
        this.sniperGame = new SniperGame(this);
        this.dragGame = new DragGame(this);
        this.sentenceGame = new SentenceGame(this);
        this.quizGame = new QuizGame(this);
        this.writeGame = new WriteGame(this);
        this.scrambledGame = new ScrambledGame(this);
        this.dictationGame = new DictationGame(this);
        this.timeAttackGame = new TimeAttackGame(this);

        // Internal State
        this.currentMode = 'direct';
        this.activeEntry = null;
        this.isRevealed = true;
        this.lastSpanishText = "";
        this.lastEnglishText = "";
        this.lastExampleText = "";
        this.isEditing = false;
        
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
        this.setupEditListeners();
    }

    setupEditListeners() {
        if (this.elements.btnEdit) {
            this.elements.btnEdit.onclick = () => this.toggleEdit();
        }
        if (this.elements.btnCancelEdit) {
            this.elements.btnCancelEdit.onclick = () => this.toggleEdit();
        }
        if (this.elements.btnSaveEdit) {
            this.elements.btnSaveEdit.onclick = () => this.saveEdit();
        }
        if (this.elements.btnLaunchpad) {
            this.elements.btnLaunchpad.onclick = () => this.toggleLaunchpad();
        }
    }

    toggleLaunchpad() {
        const area = this.elements.launchpadArea;
        if (!area) return;

        const isVisible = area.style.display === 'flex';
        if (isVisible) {
            area.style.display = 'none';
            this.updateVisibility();
        } else {
            this._renderLaunchpad();
            area.style.display = 'flex';
            
            // Hide other areas
            if (this.elements.resultArea) this.elements.resultArea.style.display = 'none';
            if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
            if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
            if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
            if (this.elements.matchArea) this.elements.matchArea.style.display = 'none';
            if (this.elements.bubbleArea) this.elements.bubbleArea.style.display = 'none';
            if (this.elements.sniperArea) this.elements.sniperArea.style.display = 'none';
            if (this.elements.dragArea) this.elements.dragArea.style.display = 'none';
            if (this.elements.dictationArea) this.elements.dictationArea.style.display = 'none';
            if (this.elements.wordleArea) this.elements.wordleArea.style.display = 'none';
            
            Fx.animateEntrance(area);
        }
    }

    _renderLaunchpad() {
        const area = this.elements.launchpadArea;
        area.innerHTML = '';

        const groups = [
            {
                title: '📖 Repaso inicial',
                icon: '📚',
                modes: [
                    { id: 'direct', title: 'Modo Directo', desc: 'Estudio libre con dados.', icon: '🎲' },
                    { id: 'flashcard', title: 'Flashcards', desc: 'Sistema clásico de tarjetas.', icon: '🎴' }
                ]
            },
            {
                title: '📝 Producción y Escritura',
                icon: '✍️',
                modes: [
                    { id: 'write', title: 'Escritura', desc: 'Escribe la traducción exacta.', icon: '⌨️' },
                    { id: 'scrambled', title: 'Letras', desc: 'Ordena las letras mezcladas.', icon: '🧩' },
                    { id: 'dictation', title: 'Dictado', desc: 'Escucha y escribe lo que oyes.', icon: '🎧' },
                    { id: 'wordle', title: 'Wordle', desc: 'Adivina la palabra en 6 intentos.', icon: '🧩' }
                ]
            },
            {
                title: '🧩 Conexión y Lógica',
                icon: '🔗',
                modes: [
                    { id: 'quiz', title: 'Modo Quiz', desc: 'Elige la opción correcta.', icon: '✅' },
                    { id: 'match', title: 'Memorama', desc: 'Empareja conceptos (Esp vs Ing).', icon: '🧠' },
                    { id: 'drag', title: 'Conectar', desc: 'Une palabras con líneas.', icon: '🔗' }
                ]
            },
            {
                title: '🏗️ Gramática y Estructura',
                icon: '🏗️',
                modes: [
                    { id: 'sentence', title: 'Constructor', desc: 'Ordena la frase de ejemplo.', icon: '🏗️' }
                ]
            },
            {
                title: '🎮 Desafío y Velocidad',
                icon: '⚡',
                modes: [
                    { id: 'timeAttack', title: 'Contrarreloj', desc: 'Acierta todo lo que puedas en 60s.', icon: '⏱️' },
                    { id: 'bubble', title: 'Burbujas', desc: 'Estalla las pompas correctas.', icon: '🫧' },
                    { id: 'sniper', title: '🎯 Sniper', desc: 'Dispara a las palabras que caen.', icon: '🎯' }
                ]
            }
        ];

        groups.forEach(group => {
            const groupEl = document.createElement('div');
            groupEl.className = 'launchpad-group';
            groupEl.innerHTML = `<div class="launchpad-group-title">${group.title}</div>`;

            const grid = document.createElement('div');
            grid.className = 'launchpad-grid';

            group.modes.forEach(mode => {
                const card = document.createElement('div');
                card.className = 'mode-card' + (this.currentMode === mode.id ? ' active' : '');
                card.innerHTML = `
                    <div class="mode-card-header">
                        <div class="mode-card-icon">${mode.icon}</div>
                        <div class="mode-card-title">${mode.title}</div>
                    </div>
                    <div class="mode-card-desc">${mode.desc}</div>
                `;
                card.onclick = () => {
                    this.setMode(mode.id);
                    this.toggleLaunchpad();
                };
                grid.appendChild(card);
            });

            groupEl.appendChild(grid);
            area.appendChild(groupEl);
        });
    }

    toggleEdit() {
        if (!this.elements.editArea) return;
        this.isEditing = !this.isEditing;
        
        if (this.isEditing) {
            this.elements.editArea.style.display = 'flex';
            if (this.elements.mainText) this.elements.mainText.parentElement.style.display = 'none';
            if (this.elements.subContainer) this.elements.subContainer.style.display = 'none';
            if (this.elements.exampleText) this.elements.exampleText.style.display = 'none';
            
            if (this.elements.editEs) this.elements.editEs.value = this.lastSpanishText;
            if (this.elements.editEn) this.elements.editEn.value = this.lastEnglishText;
            if (this.elements.editEx) this.elements.editEx.value = this.lastExampleText;
        } else {
            this.elements.editArea.style.display = 'none';
            if (this.elements.mainText) this.elements.mainText.parentElement.style.display = 'flex';
            this.updateVisibility();
        }
    }

    saveEdit() {
        if (!this.activeEntry) return;

        const newEs = this.elements.editEs.value.trim();
        const newEn = this.elements.editEn.value.trim();
        const newEx = this.elements.editEx.value.trim();

        if (!newEs || !newEn) return;

        // Update local entry
        const oldEs = this.lastSpanishText;
        this.lastSpanishText = newEs;
        this.lastEnglishText = newEn;
        this.lastExampleText = newEx;
        
        // Update the entry in the array
        const textParts = [newEs, newEn];
        if (newEx) textParts.push(newEx);
        this.activeEntry.text = textParts.join(" -> ");

        // If it's a custom deck, persist to localStorage
        if (this.isModal && this.packId.startsWith('csv_')) {
            const customDecks = Storage.getCustomDecks();
            // We need to find which custom deck this is. 
            // The packId is derived from the title.
            const deck = customDecks.find(d => {
                const id = 'csv_' + d.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
                return id === this.packId;
            });

            if (deck) {
                const entryIdx = deck.entries.findIndex(e => e.min === this.activeEntry.min && e.max === this.activeEntry.max);
                if (entryIdx !== -1) {
                    deck.entries[entryIdx].text = this.activeEntry.text;
                    Storage.saveCustomDecks(customDecks);
                    Fx.playSound('success');
                }
            }
        }

        if (this.elements.mainText) this.elements.mainText.innerText = newEs;
        if (this.elements.subText) this.elements.subText.innerText = newEn;
        if (this.elements.exampleText) this.elements.exampleText.innerText = newEx;

        this.toggleEdit();
        this.updateVisibility();
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
        this.timeAttackGame.stop();
        this.bubbleGame.stop();
        this.sniperGame.stop();

        Fx.playSound('click');

        // Reset elements style
        if (this.elements.launchpadArea) this.elements.launchpadArea.style.display = 'none';
        if (this.elements.resultArea) this.elements.resultArea.style.display = 'flex';

        if (this.elements.quizScore) this.elements.quizScore.style.display = 'none';
        if (this.elements.writeArea) this.elements.writeArea.style.display = 'none';
        if (this.elements.scrambledArea) this.elements.scrambledArea.style.display = 'none';
        if (this.elements.quizOptions) this.elements.quizOptions.style.display = 'none';
        if (this.elements.srsFeedback) this.elements.srsFeedback.style.display = 'none';
        if (this.elements.matchArea) this.elements.matchArea.style.display = 'none';
        if (this.elements.bubbleArea) this.elements.bubbleArea.style.display = 'none';
        if (this.elements.wordleArea) this.elements.wordleArea.style.display = 'none';
        if (this.elements.sentenceArea) this.elements.sentenceArea.style.display = 'none';

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
                actionBtn.onclick = () => {
                    if (mode === 'quiz') this.quizGame.start();
                    else if (mode === 'write') this.writeGame.start();
                    else this.scrambledGame.start();
                };
            } else if (mode === 'timeAttack') {
                actionBtn.innerText = '¡Empezar contrarreloj!';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.timeAttackGame.start();
                if (this.elements.mainText) this.elements.mainText.innerText = "Prepárate...";
                if (this.elements.rollVal) this.elements.rollVal.innerText = "Modo Contrarreloj";
            } else if (mode === 'match' || mode === 'bubble') {
                actionBtn.innerText = 'Reiniciar Juego';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => {
                    if (mode === 'match') this.matchGame.start();
                    else this.bubbleGame.start();
                };
            } else if (mode === 'sniper') {
                actionBtn.innerText = 'Reiniciar Sniper';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.sniperGame.start();
            } else if (mode === 'drag') {
                actionBtn.innerText = 'Reiniciar Conectar';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.dragGame.start();
            } else if (mode === 'dictation') {
                actionBtn.innerText = 'Siguiente Dictado';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.dictationGame.start();
            } else if (mode === 'wordle') {
                actionBtn.innerText = 'Pasar Palabra';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.wordleGame.start();
            } else if (mode === 'sentence') {
                actionBtn.innerText = 'Pasar Frase';
                actionBtn.style.display = 'block';
                actionBtn.onclick = () => this.sentenceGame.start();
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
            this.quizGame.start();
        } else if (mode === 'write') {
            this.writeGame.start();
        } else if (mode === 'scrambled') {
            this.scrambledGame.start();
        } else if (mode === 'match') {
            this.matchGame.start();
        } else if (mode === 'bubble') {
            this.bubbleGame.start();
        } else if (mode === 'sniper') {
            this.sniperGame.start();
        } else if (mode === 'drag') {
            this.dragGame.start();
        } else if (mode === 'dictation') {
            this.dictationGame.start();
        } else if (mode === 'wordle') {
            this.wordleGame.start();
        } else if (mode === 'sentence') {
            this.sentenceGame.start();
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
        const example = parts.length > 2 && !parts[2].trim().startsWith('http') ? parts[2].trim() : "";

        this.setEntry(main, sub, example);

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
            if (this.elements.exampleText) {
                this.elements.exampleText.innerText = example;
                this.elements.exampleText.style.display = 'none';
            }
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

            if (this.elements.resultArea) {
                Fx.animate(this.elements.resultArea, {
                    scale: [0.98, 1],
                    duration: 500,
                    easing: 'easeOutElastic(1, .8)'
                });
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
        
        if (isCorrect) {
            Fx.playSound('success');
            if (this.currentMode !== 'timeAttack') Fx.celebrate('simple');
        } else {
            Fx.playSound('error');
        }

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
        if (this.elements.launchpadArea && this.elements.launchpadArea.style.display === 'flex') return;

        const subContainer = this.elements.subContainer;
        const btnReveal = this.elements.btnReveal;
        const imgContainer = this.elements.imgContainer;
        const exampleText = this.elements.exampleText;
        const showImages = this.elements.enableImages ? this.elements.enableImages.checked : true;
        const area = this.elements.resultArea;
        const isSupportedMode = !['quiz', 'write', 'scrambled', 'timeAttack', 'match', 'bubble', 'wordle'].includes(this.currentMode);

        if (this.isRevealed) {
            if (subContainer) subContainer.classList.remove('hidden');
            if (btnReveal) btnReveal.style.display = 'none';
            if (exampleText) exampleText.style.display = this.lastExampleText ? 'block' : 'none';
            
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
            if (exampleText) exampleText.style.display = 'none';
            
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
            this.quizGame.start();
        } else if (this.currentMode === 'write') {
            const actionBtn = this.elements.actionBtn;
            if (actionBtn && actionBtn.innerText === 'Comprobar') {
                this.writeGame.checkAnswer();
            } else {
                this.writeGame.start();
            }
        } else if (this.currentMode === 'scrambled') {
            this.scrambledGame.start();
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

    setEntry(main, sub, example = "") {
        this.lastSpanishText = main;
        this.lastEnglishText = sub;
        this.lastExampleText = example;
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
