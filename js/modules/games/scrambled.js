import * as Srs from '../srs.js';
import * as Utils from '../utils.js';
import * as Fx from '../fx.js';

export class ScrambledGame {
    constructor(engine) {
        this.engine = engine;
        this.timeoutId = null;
    }

    start() {
        this.stop();

        if (this.engine.entries.length === 0) return;

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.quizOptions) this.engine.elements.quizOptions.style.display = 'none';
        if (this.engine.elements.writeArea) this.engine.elements.writeArea.style.display = 'none';
        if (this.engine.elements.srsFeedback) this.engine.elements.srsFeedback.style.display = 'none';

        const dummyTableData = { title: this.engine.packId, entries: this.engine.entries };
        this.engine.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.engine.lastSpanishText);
        if (!this.engine.activeEntry) return;

        const parts = this.engine.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts.length > 1 ? parts[1].trim() : "";

        this.engine.setEntry(spanish, english);

        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = spanish;

        const scrambledArea = this.engine.elements.scrambledArea;
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
            
            // Accessibility
            tile.setAttribute('role', 'button');
            tile.setAttribute('tabindex', '0');

            lettersContainer.appendChild(tile);
        });

        scrambledArea.appendChild(slotsContainer);
        scrambledArea.appendChild(lettersContainer);

        this.setupEventListeners(scrambledArea, slots, baseAnswer);

        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Pasar / No sé';
            this.actionHandler = () => {
                this.engine.rateSrs(false);
                this.start();
            };
            actionBtn.onclick = this.actionHandler;
        }
    }

    setupEventListeners(scrambledArea, slots, baseAnswer) {
        const lettersContainer = scrambledArea.querySelector('.scrambled-letters');
        const slotsContainer = scrambledArea.querySelector('.scrambled-slots');

        this.tileHandler = (e) => {
            const tile = e.target.closest('.scrambled-tile');
            if (!tile || tile.classList.contains('disabled') || tile.parentNode !== lettersContainer) return;

            const emptySlot = slots.find(s => !s.hasChildNodes());
            if (emptySlot) {
                const clone = tile.cloneNode(true);
                clone.dataset.originalIndex = tile.dataset.index;
                emptySlot.appendChild(clone);
                tile.classList.add('disabled');

                if (slots.every(s => s.hasChildNodes())) {
                    this.checkScrambledWin(slots, baseAnswer, scrambledArea);
                }
            }
        };

        this.slotHandler = (e) => {
            const clone = e.target.closest('.scrambled-tile');
            if (!clone || clone.parentNode.parentNode !== slotsContainer) return;

            const slot = clone.parentNode;
            const originalIndex = clone.dataset.originalIndex;
            const originalTile = lettersContainer.querySelector(`.scrambled-tile[data-index="${originalIndex}"]`);
            
            slot.removeChild(clone);
            if (originalTile) originalTile.classList.remove('disabled');
        };

        lettersContainer.addEventListener('click', this.tileHandler);
        slotsContainer.addEventListener('click', this.slotHandler);
    }

    checkScrambledWin(slots, baseAnswer, scrambledArea) {
        const currentString = slots.map(s => s.firstChild.innerText).join('');
        const targetString = baseAnswer.replace(/\s/g, '');

        if (Utils.compareText(currentString, targetString)) {
            slots.forEach(s => s.firstChild.classList.add('correct'));
            this.engine.rateSrs(true);
            this.engine.speak();

            const actionBtn = this.engine.elements.actionBtn;
            if (actionBtn) {
                actionBtn.innerText = 'Siguiente Pregunta';
                this.nextHandler = () => this.start();
                actionBtn.onclick = this.nextHandler;
            }
        } else {
            slots.forEach(s => s.firstChild.classList.add('incorrect'));
            this.timeoutId = setTimeout(() => {
                slots.forEach(s => {
                    if (s.firstChild) s.removeChild(s.firstChild);
                });
                scrambledArea.querySelectorAll('.scrambled-tile').forEach(t => t.classList.remove('disabled'));
            }, 1000);
        }
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        const scrambledArea = this.engine.elements.scrambledArea;
        const lettersContainer = scrambledArea?.querySelector('.scrambled-letters');
        const slotsContainer = scrambledArea?.querySelector('.scrambled-slots');

        if (lettersContainer && this.tileHandler) lettersContainer.removeEventListener('click', this.tileHandler);
        if (slotsContainer && this.slotHandler) slotsContainer.removeEventListener('click', this.slotHandler);
        
        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) actionBtn.onclick = null;
    }
}
