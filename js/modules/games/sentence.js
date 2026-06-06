import * as Speech from '../speech.js';
import * as Fx from '../fx.js';

export class SentenceGame {
    constructor(engine) {
        this.engine = engine;
        this.sentenceTargetWords = [];
        this.sentenceCurrentWords = [];
        this.sentenceGameOver = false;
        this.timeoutId = null;
    }

    start() {
        const sentenceArea = this.engine.elements.sentenceArea;
        if (!sentenceArea) return;

        this.stop();

        // Find an entry that HAS an example sentence
        const entriesWithExample = this.engine.entries.filter(e => {
            const parts = e.text.split("->");
            return parts.length > 2 && !parts[2].trim().startsWith('http');
        });

        if (entriesWithExample.length === 0) {
            if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = "Este mazo no tiene frases de ejemplo.";
            return;
        }

        this.engine.activeEntry = entriesWithExample[Math.floor(Math.random() * entriesWithExample.length)];
        const parts = this.engine.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const englishExample = parts[2].trim();

        this.engine.lastSpanishText = spanish;
        this.sentenceTargetWords = englishExample.split(/\s+/).filter(w => w.length > 0);
        this.sentenceCurrentWords = [];
        this.sentenceGameOver = false;

        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = spanish;
        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.exampleText) this.engine.elements.exampleText.style.display = 'none';

        sentenceArea.style.display = 'flex';
        sentenceArea.innerHTML = `
            <div class="sentence-target-slots" id="sentenceSlots"></div>
            <div class="sentence-word-chips" id="sentenceChips"></div>
        `;

        const slotsContainer = sentenceArea.querySelector('#sentenceSlots');
        const chipsContainer = sentenceArea.querySelector('#sentenceChips');

        // Create empty slots
        this.sentenceTargetWords.forEach(() => {
            const slot = document.createElement('div');
            slot.className = 'sentence-slot';
            slot.setAttribute('role', 'button');
            slot.setAttribute('tabindex', '0');
            slotsContainer.appendChild(slot);
        });

        // Create shuffled chips
        const shuffledWords = [...this.sentenceTargetWords]
            .map((word, index) => ({ word, originalIndex: index }))
            .sort(() => Math.random() - 0.5);

        shuffledWords.forEach((item) => {
            const chip = document.createElement('div');
            chip.className = 'word-chip';
            chip.innerText = item.word;
            chip.dataset.word = item.word;
            
            // Accessibility
            chip.setAttribute('role', 'button');
            chip.setAttribute('tabindex', '0');
            
            chipsContainer.appendChild(chip);
        });

        this.setupEventListeners(slotsContainer, chipsContainer);
    }

    setupEventListeners(slotsContainer, chipsContainer) {
        this.chipHandler = (e) => {
            const chip = e.target.closest('.word-chip');
            if (!chip || this.sentenceGameOver || chip.classList.contains('disabled')) return;

            const word = chip.dataset.word;
            this.sentenceCurrentWords.push(word);
            chip.classList.add('disabled');

            const slots = slotsContainer.querySelectorAll('.sentence-slot');
            const nextSlot = Array.from(slots).find(s => !s.innerText);
            if (nextSlot) {
                nextSlot.innerText = word;
                nextSlot.dataset.word = word;
                nextSlot.classList.add('filled');
            }

            if (this.sentenceCurrentWords.length === this.sentenceTargetWords.length) {
                this._validateSentence();
            }
        };

        this.slotHandler = (e) => {
            const slot = e.target.closest('.sentence-slot');
            if (!slot || this.sentenceGameOver || !slot.classList.contains('filled')) return;

            const word = slot.dataset.word;
            const idx = this.sentenceCurrentWords.indexOf(word);
            if (idx !== -1) {
                this.sentenceCurrentWords.splice(idx, 1);
                slot.innerText = "";
                slot.dataset.word = "";
                slot.classList.remove('filled');
                
                const chip = chipsContainer.querySelector(`.word-chip[data-word="${word}"].disabled`);
                if (chip) chip.classList.remove('disabled');
            }
        };

        chipsContainer.addEventListener('click', this.chipHandler);
        slotsContainer.addEventListener('click', this.slotHandler);
    }

    _validateSentence() {
        const slots = this.engine.elements.sentenceArea.querySelectorAll('.sentence-slot');
        const isCorrect = this.sentenceCurrentWords.join(' ') === this.sentenceTargetWords.join(' ');
        
        this.sentenceGameOver = true;
        this.engine.rateSrs(isCorrect);

        slots.forEach((slot, i) => {
            slot.classList.add(isCorrect ? 'correct' : 'incorrect');
            slot.onclick = null; // Disable removal
        });

        if (isCorrect) {
            Fx.celebrate('burst');
            Fx.playSound('success');
            // Speak the whole sentence
            Speech.speak(this.sentenceTargetWords.join(' '), this.engine.elements.voiceSelect, this.engine.elements.speedSlider);
        } else {
            Fx.playSound('error');
            Fx.shake(this.engine.elements.sentenceArea.querySelector('.sentence-target-slots'));
        }

        this.timeoutId = setTimeout(() => {
            const actionBtn = this.engine.elements.actionBtn;
            if (actionBtn) {
                actionBtn.innerText = 'Siguiente Frase';
                actionBtn.onclick = () => this.start();
            }
            if (!isCorrect && this.engine.elements.mainText) {
                this.engine.elements.mainText.innerText = `${this.engine.lastSpanishText} -> ${this.sentenceTargetWords.join(' ')}`;
            }
        }, 1000);
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }

        const sentenceArea = this.engine.elements.sentenceArea;
        const slotsContainer = sentenceArea?.querySelector('#sentenceSlots');
        const chipsContainer = sentenceArea?.querySelector('#sentenceChips');

        if (chipsContainer && this.chipHandler) chipsContainer.removeEventListener('click', this.chipHandler);
        if (slotsContainer && this.slotHandler) slotsContainer.removeEventListener('click', this.slotHandler);
        
        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) actionBtn.onclick = null;
    }
}
