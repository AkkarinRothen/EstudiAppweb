import * as Srs from '../srs.js';
import * as Fx from '../fx.js';

export class WordleGame {
    constructor(engine) {
        this.engine = engine;
        this.target = "";
        this.guesses = [];
        this.currentGuess = "";
        this.gameOver = false;
    }

    start() {
        const wordleArea = this.engine.elements.wordleArea;
        if (!wordleArea) return;

        this.engine.activeEntry = Srs.selectNextSrsEntry({ entries: this.engine.entries }, this.engine.lastSpanishText);
        if (!this.engine.activeEntry) return;

        const parts = this.engine.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts[1]?.split(/[/\;,]/)[0].trim().toLowerCase() || "";

        if (english.length < 3 || english.length > 8) {
            this.start();
            return;
        }

        this.engine.lastSpanishText = spanish;
        this.engine.lastEnglishText = english;
        this.target = english;
        this.guesses = [];
        this.currentGuess = "";
        this.gameOver = false;

        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = spanish;
        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.exampleText) this.engine.elements.exampleText.style.display = 'none';

        wordleArea.style.display = 'flex';
        wordleArea.innerHTML = '';
        wordleArea.style.setProperty('--word-length', english.length);

        const grid = document.createElement('div');
        grid.className = 'wordle-grid';
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('div');
            row.className = 'wordle-row';
            for (let j = 0; j < english.length; j++) {
                const tile = document.createElement('div');
                tile.className = 'wordle-tile';
                row.appendChild(tile);
            }
            grid.appendChild(row);
        }
        wordleArea.appendChild(grid);

        const keyboard = this._createKeyboard();
        wordleArea.appendChild(keyboard);

        this._updateGrid();
    }

    _createKeyboard() {
        const kb = document.createElement('div');
        kb.className = 'wordle-keyboard';
        const rows = [
            ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
            ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
            ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '←']
        ];

        rows.forEach(row => {
            const rowEl = document.createElement('div');
            rowEl.className = 'keyboard-row';
            row.forEach(key => {
                const btn = document.createElement('button');
                btn.className = 'key-btn';
                if (key === 'Enter' || key === '←') btn.classList.add('wide');
                btn.innerText = key;
                btn.onclick = () => this._handleKey(key);
                btn.dataset.key = key;
                rowEl.appendChild(btn);
            });
            kb.appendChild(rowEl);
        });
        return kb;
    }

    _handleKey(key) {
        if (this.gameOver) return;

        if (key === '←' || key === 'Backspace') {
            this.currentGuess = this.currentGuess.slice(0, -1);
        } else if (key === 'Enter') {
            this._submitGuess();
        } else if (/^[a-z]$/i.test(key) && this.currentGuess.length < this.target.length) {
            this.currentGuess += key.toLowerCase();
        }
        this._updateGrid();
    }

    _submitGuess() {
        if (this.currentGuess.length !== this.target.length) {
            Fx.shake(this.engine.elements.wordleArea.querySelector('.wordle-row:not(.filled)'));
            return;
        }

        const guess = this.currentGuess;
        this.guesses.push(guess);
        this.currentGuess = "";

        const isCorrect = guess === this.target;
        if (isCorrect || this.guesses.length >= 6) {
            this.gameOver = true;
            this.engine.rateSrs(isCorrect);
            if (isCorrect) {
                Fx.celebrate('burst');
                this.engine.speak();
            } else {
                Fx.playSound('error');
            }

            setTimeout(() => {
                const actionBtn = this.engine.elements.actionBtn;
                if (actionBtn) {
                    actionBtn.innerText = 'Siguiente Palabra';
                    actionBtn.onclick = () => this.start();
                }
                if (!isCorrect && this.engine.elements.mainText) {
                    this.engine.elements.mainText.innerText = `${this.engine.lastSpanishText} -> ${this.target}`;
                }
            }, 1000);
        }
    }

    _updateGrid() {
        const rows = this.engine.elements.wordleArea.querySelectorAll('.wordle-row');

        // Update submitted guesses
        this.guesses.forEach((guess, i) => {
            const row = rows[i];
            row.classList.add('filled');
            const tiles = row.querySelectorAll('.wordle-tile');

            // Simplified Wordle logic for coloring
            const targetArr = this.target.split('');
            const guessArr = guess.split('');
            const status = new Array(guess.length).fill('absent');

            // 1. Correct (Green)
            guessArr.forEach((char, idx) => {
                if (char === targetArr[idx]) {
                    status[idx] = 'correct';
                    targetArr[idx] = null;
                }
            });

            // 2. Present (Yellow)
            guessArr.forEach((char, idx) => {
                if (status[idx] === 'absent') {
                    const foundIdx = targetArr.indexOf(char);
                    if (foundIdx !== -1) {
                        status[idx] = 'present';
                        targetArr[foundIdx] = null;
                    }
                }
            });

            tiles.forEach((tile, idx) => {
                tile.innerText = guess[idx];
                tile.className = `wordle-tile ${status[idx]}`;

                // Update keyboard
                const keyBtn = this.engine.elements.wordleArea.querySelector(`.key-btn[data-key="${guess[idx]}"]`);
                if (keyBtn) {
                    if (status[idx] === 'correct') {
                        keyBtn.className = 'key-btn correct';
                    } else if (status[idx] === 'present' && !keyBtn.classList.contains('correct')) {
                        keyBtn.className = 'key-btn present';
                    } else if (status[idx] === 'absent' && !keyBtn.classList.contains('correct') && !keyBtn.classList.contains('present')) {
                        keyBtn.className = 'key-btn absent';
                    }
                }
            });
        });

        // Update current active row
        if (this.guesses.length < 6 && !this.gameOver) {
            const activeRow = rows[this.guesses.length];
            const tiles = activeRow.querySelectorAll('.wordle-tile');
            tiles.forEach((tile, i) => {
                tile.innerText = this.currentGuess[i] || "";
                tile.className = 'wordle-tile' + (i === this.currentGuess.length ? ' active' : '');
            });
        }
    }
}
