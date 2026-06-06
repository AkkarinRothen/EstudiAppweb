import * as Utils from '../utils.js';
import * as Fx from '../fx.js';
import * as Storage from '../storage.js';
import * as Difficulty from '../difficulty-manager.js';

export class SniperGame {
    constructor(engine) {
        this.engine = engine;
        this.sniperSpawnTimeout = null;
        this._sniperTarget = null;
        this.sniperLives = 3;
        this.sniperScore = 0;
    }

    start() {
        const sniperArea = this.engine.elements.sniperArea;
        if (!sniperArea) return;

        this.stop();

        if (this.engine.entries.length < 2) {
            sniperArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar al Sniper.</div>';
            sniperArea.style.display = 'flex';
            return;
        }

        this.sniperLives = 3;
        this.sniperScore = 0;

        const best = Storage.getHighScore(this.engine.packId, 'sniper');

        sniperArea.innerHTML = `
            <div class="sniper-hud">
                <span class="sniper-lives-display" id="sniperLives">❤️❤️❤️</span>
                <span class="sniper-score-display" id="sniperScore">🎯 0 disparos</span>
                <span class="sniper-highscore-display" id="sniperHighScore">🏆 Récord: ${best}</span>
            </div>
            <div class="sniper-target-box" id="sniperTarget">Cargando...</div>
            <div class="sniper-lanes crt" id="sniperLanes"></div>
            <div class="sniper-input-row">
                <input type="text" class="sniper-input" id="sniperInput" placeholder="Escribe la traducción en español y pulsa Enter..." autocomplete="off">
            </div>
        `;
        sniperArea.style.display = 'flex';

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = '';

        this._pickNextTarget();

        const input = sniperArea.querySelector('#sniperInput');
        input.focus();
        this.keydownHandler = (e) => {
            if (e.key === 'Enter') {
                const val = Utils.cleanText(input.value);
                if (!val) return;
                this._checkAnswer(val);
                input.value = '';
            }
        };
        input.addEventListener('keydown', this.keydownHandler);

        // Start dynamic spawns
        this._scheduleNextSpawn();
    }

    _scheduleNextSpawn() {
        if (this.sniperSpawnTimeout) clearTimeout(this.sniperSpawnTimeout);

        // Use DifficultyManager for dynamic delay
        const factor = Difficulty.getDifficultyFactor(this.sniperScore);
        const params = Difficulty.lerpParams(
            { spawnDelay: 2800 }, // Easy (0.0)
            { spawnDelay: 800 },  // Hard (1.0)
            factor
        );

        this.sniperSpawnTimeout = setTimeout(() => {
            this._spawnWord();
            this._scheduleNextSpawn();
        }, params.spawnDelay);
    }

    _pickNextTarget() {
        if (!this.engine.entries || this.engine.entries.length === 0) return;
        const rand = this.engine.entries[Math.floor(Math.random() * this.engine.entries.length)];
        const parts = rand.text.split('->');
        this._sniperTarget = {
            es: parts[0].trim(),
            en: parts[1]?.split('||')[0].trim() || ''
        };
        const box = document.getElementById('sniperTarget');
        if (box) {
            box.innerHTML = `
                <svg class="sniper-crosshair" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
                    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" />
                    <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                <span>OBJETIVO: "${this._sniperTarget.en}"</span>
            `;
        }
    }

    _spawnWord() {
        const lanes = document.getElementById('sniperLanes');
        if (!lanes || !this._sniperTarget) return;

        const isCorrect = Math.random() < 0.4;
        let wordText = '';

        if (isCorrect) {
            wordText = this._sniperTarget.es;
        } else {
            const distractors = this.engine.entries.filter(e => {
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

        // Accessibility
        word.setAttribute('role', 'button');
        word.setAttribute('tabindex', '0');

        // Calculate fall speed using DifficultyManager
        const factor = Difficulty.getDifficultyFactor(this.sniperScore);
        const params = Difficulty.lerpParams(
            { duration: 5.0 }, // Easy (0.0)
            { duration: 1.5 }, // Hard (1.0)
            factor
        );
        
        word.style.animation = `sniperFall ${params.duration}s linear forwards`;

        word.addEventListener('animationend', () => {
            if (word.parentNode) {
                word.remove();
                if (word.dataset.correct === '1') {
                    this._loseLife();
                }
            }
        });

        lanes.appendChild(word);
    }

    _checkAnswer(val) {
        if (!this._sniperTarget) return;
        const target = Utils.cleanText(this._sniperTarget.es);

        if (Utils.compareText(val, target)) {
            this.sniperScore++;
            const scoreEl = document.getElementById('sniperScore');
            if (scoreEl) scoreEl.innerText = `🎯 ${this.sniperScore} disparos`;

            // Draw laser beam
            const input = document.getElementById('sniperInput');
            const targetWordEl = Array.from(document.querySelectorAll('.sniper-word')).find(w => w.dataset.correct === '1');
            if (input && targetWordEl) {
                this._drawLaserBeam(input, targetWordEl);
            }

            // Play laser sound effect
            Fx.playSound('laser');

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
            this.engine.rateSrs(true);
            this.engine.speak();
            this._pickNextTarget();
        } else {
            const input = document.getElementById('sniperInput');
            if (input) {
                input.classList.add('sniper-wrong');
                setTimeout(() => input.classList.remove('sniper-wrong'), 600);
            }
        }
    }

    _drawLaserBeam(fromEl, toEl) {
        const lanes = document.getElementById('sniperLanes');
        if (!lanes) return;

        const lanesRect = lanes.getBoundingClientRect();
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        const startX = fromRect.left + fromRect.width / 2 - lanesRect.left;
        const endX = toRect.left + toRect.width / 2 - lanesRect.left;
        const endY = toRect.top + toRect.height / 2 - lanesRect.top;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'laser-beam-svg');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '3';

        svg.innerHTML = `
            <line x1="${startX}" y1="${lanesRect.height}" x2="${endX}" y2="${endY}" 
                  stroke="var(--primary)" stroke-width="4" stroke-linecap="round"
                  style="filter: drop-shadow(0 0 8px var(--primary));" />
            <line x1="${startX}" y1="${lanesRect.height}" x2="${endX}" y2="${endY}" 
                  stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
        `;

        lanes.appendChild(svg);

        setTimeout(() => {
            svg.style.opacity = '0';
            setTimeout(() => svg.remove(), 150);
        }, 150);
    }

    _loseLife() {
        if (!this.sniperLives) return;
        this.sniperLives--;
        const livesEl = document.getElementById('sniperLives');
        if (livesEl) {
            livesEl.innerText = '❤️'.repeat(this.sniperLives) + '🖤'.repeat(3 - this.sniperLives);
        }
        if (this.sniperLives <= 0) {
            this.stop();
            const newRecord = Storage.saveHighScore(this.engine.packId, 'sniper', this.sniperScore);
            const best = Storage.getHighScore(this.engine.packId, 'sniper');

            if (newRecord) {
                Fx.playSound('victory');
            }

            const sniperArea = this.engine.elements.sniperArea;
            if (sniperArea) {
                sniperArea.innerHTML = `
                    <div class="sniper-gameover">
                        <div style="font-size:48px;">${newRecord ? '🏆' : '💀'}</div>
                        <h3>${newRecord ? '¡Nuevo Récord!' : 'Game Over'}</h3>
                        <p class="info">Disparos acertados: <strong>${this.sniperScore}</strong></p>
                        <p class="info" style="font-size:12px;opacity:0.8;margin-bottom:12px;">Récord actual: <strong>${best}</strong></p>
                        
                        <div class="form-group" style="margin-top:10px;width:100%;text-align:left;border-top:1px dashed var(--outline);padding-top:12px;">
                            <label style="font-size:12px;font-family:'Outfit',sans-serif;">¿Deseas código de tarea para tu profesor?</label>
                            <div style="display:flex;gap:8px;margin-top:6px;">
                                <input type="text" id="studentNameInput" class="write-input" style="padding:8px;font-size:13px;font-family:'Outfit',sans-serif;" placeholder="Apellido_Nombre (ej: Perez_Juan)" />
                                <button id="btnGenTaskCode" class="srs-btn srs-btn-good" style="padding:8px;font-size:13px;width:auto;font-family:'Outfit',sans-serif;margin-top:0;">Generar</button>
                            </div>
                            <div id="taskCodeResult" style="display:none;margin-top:10px;">
                                <textarea id="taskCodeTextarea" readonly style="width:100%;height:60px;font-family:monospace;font-size:11px;padding:6px;border-radius:6px;border:1px solid var(--outline);background:var(--surface-variant);color:var(--on-surface-variant);box-sizing:border-box;resize:none;"></textarea>
                                <button id="btnCopyTaskCode" class="srs-btn" style="padding:6px;font-size:11px;width:100%;margin-top:4px;background:var(--secondary-container);color:var(--on-secondary-container);">📋 Copiar Código</button>
                            </div>
                        </div>

                        <button id="btnRetrySniper" class="srs-btn srs-btn-good" style="width:auto;padding:12px 24px;margin-top:15px;">Jugar de nuevo</button>
                    </div>
                `;
                
                // Play again action
                sniperArea.querySelector('#btnRetrySniper').onclick = () => this.start();

                // Code generation action
                const btnGen = sniperArea.querySelector('#btnGenTaskCode');
                if (btnGen) {
                    btnGen.onclick = async () => {
                        const nameInput = sniperArea.querySelector('#studentNameInput');
                        const nameVal = nameInput ? nameInput.value.trim() : "";

                        // Validation format: Apellido_Nombre with initial upper-case letter
                        const regexNombre = /^[A-ZÁÉÍÓÚ][a-zñáéíóú]+_[A-ZÁÉÍÓÚ][a-zñáéíóú]+$/;
                        if (!regexNombre.test(nameVal)) {
                            alert("Por favor, introduce tu nombre en el formato: Apellido_Nombre (ej: Perez_Juan) con mayúscula inicial.");
                            return;
                        }

                        // Basic profanity list filter
                        const badWords = ["mierda", "puto", "puta", "joder", "cabron", "pendejo", "concha", "culiao", "fuck", "shit"];
                        const lowerName = nameVal.toLowerCase();
                        const hasBadWord = badWords.some(w => lowerName.includes(w));
                        if (hasBadWord) {
                            alert("El nombre contiene palabras no permitidas. Por favor utiliza tu nombre real.");
                            return;
                        }

                        // Generate verification code: studentName-gameId-packId-score-hash
                        const rawData = `${nameVal}|sniper|${this.engine.packId}|${this.sniperScore}`;
                        const hash = await Utils.sha256(rawData + "|estudiapp_secret_salt_2026");
                        const verifCode = `${nameVal}-sniper-${this.engine.packId}-${this.sniperScore}-${hash.substring(0, 16)}`;

                        const resultDiv = sniperArea.querySelector('#taskCodeResult');
                        const textCode = sniperArea.querySelector('#taskCodeTextarea');
                        if (resultDiv && textCode) {
                            textCode.value = verifCode;
                            resultDiv.style.display = 'block';
                        }
                    };
                }

                // Copy code action
                const btnCopy = sniperArea.querySelector('#btnCopyTaskCode');
                if (btnCopy) {
                    btnCopy.onclick = () => {
                        const textCode = sniperArea.querySelector('#taskCodeTextarea');
                        if (textCode) {
                            textCode.select();
                            document.execCommand('copy');
                            btnCopy.innerText = "¡Copiado! ✓";
                            setTimeout(() => btnCopy.innerText = "📋 Copiar Código", 2000);
                        }
                    };
                }
            }
        }
    }

    stop() {
        if (this.sniperSpawnTimeout) {
            clearTimeout(this.sniperSpawnTimeout);
            this.sniperSpawnTimeout = null;
        }

        const sniperArea = this.engine.elements.sniperArea;
        const input = sniperArea?.querySelector('#sniperInput');
        if (input && this.keydownHandler) {
            input.removeEventListener('keydown', this.keydownHandler);
        }

        this._sniperTarget = null;
    }
}
