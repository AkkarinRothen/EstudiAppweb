import * as Utils from '../utils.js';

export class SniperGame {
    constructor(engine) {
        this.engine = engine;
        this.sniperSpawnInterval = null;
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

        this.sniperSpawnInterval = setInterval(() => {
            this._spawnWord();
        }, 2200);
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
        if (box) box.innerText = `Traduce al español: "${this._sniperTarget.en}"`;
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

    _loseLife() {
        if (!this.sniperLives) return;
        this.sniperLives--;
        const livesEl = document.getElementById('sniperLives');
        if (livesEl) {
            livesEl.innerText = '❤️'.repeat(this.sniperLives) + '🖤'.repeat(3 - this.sniperLives);
        }
        if (this.sniperLives <= 0) {
            this.stop();
            const sniperArea = this.engine.elements.sniperArea;
            if (sniperArea) {
                sniperArea.innerHTML = `
                    <div class="sniper-gameover">
                        <div style="font-size:48px;">💀</div>
                        <h3>Game Over</h3>
                        <p class="info">Disparos acertados: <strong>${this.sniperScore}</strong></p>
                        <button class="srs-btn srs-btn-good" style="width:auto;padding:12px 24px;margin-top:10px;">Jugar de nuevo</button>
                    </div>
                `;
                sniperArea.querySelector('button').onclick = () => this.start();
            }
        }
    }

    stop() {
        if (this.sniperSpawnInterval) {
            clearInterval(this.sniperSpawnInterval);
            this.sniperSpawnInterval = null;
        }
        this._sniperTarget = null;
    }
}
