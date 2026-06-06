import * as Utils from '../utils.js';
import * as Fx from '../fx.js';
import * as Storage from '../storage.js';

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
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const val = Utils.cleanText(input.value);
                if (!val) return;
                this._checkAnswer(val);
                input.value = '';
            }
        });

        // Start dynamic spawns
        this._scheduleNextSpawn();
    }

    _scheduleNextSpawn() {
        if (this.sniperSpawnTimeout) clearTimeout(this.sniperSpawnTimeout);

        // Spawn delay decreases down to 1000ms as score increases
        const delay = Math.max(1000, 2400 - (this.sniperScore * 120));
        this.sniperSpawnTimeout = setTimeout(() => {
            this._spawnWord();
            this._scheduleNextSpawn();
        }, delay);
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

        // Calculate fall speed (decreases down to 1.8s)
        const duration = Math.max(1.8, 4.0 - (this.sniperScore * 0.15));
        word.style.animation = `sniperFall ${duration}s linear forwards`;

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
                        <p class="info" style="font-size:12px;opacity:0.8;">Récord actual: <strong>${best}</strong></p>
                        <button class="srs-btn srs-btn-good" style="width:auto;padding:12px 24px;margin-top:10px;">Jugar de nuevo</button>
                    </div>
                `;
                sniperArea.querySelector('button').onclick = () => this.start();
            }
        }
    }

    stop() {
        if (this.sniperSpawnTimeout) {
            clearTimeout(this.sniperSpawnTimeout);
            this.sniperSpawnTimeout = null;
        }
        this._sniperTarget = null;
    }
}
