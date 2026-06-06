import * as Speech from '../speech.js';
import * as Fx from '../fx.js';

export class SentenceGame {
    constructor(engine) {
        this.engine = engine;
        this.sentenceTargetWords = [];
        this.sentenceCurrentWords = [];
        this.sentenceGameOver = false;
    }

    start() {
        const sentenceArea = this.engine.elements.sentenceArea;
        if (!sentenceArea) return;

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
            
            chip.onclick = () => {
                if (this.sentenceGameOver || chip.classList.contains('disabled')) return;
                
                // Add word to current guess
                this.sentenceCurrentWords.push(item.word);
                chip.classList.add('disabled');
                
                // Update slots
                const slots = slotsContainer.querySelectorAll('.sentence-slot');
                const nextSlot = Array.from(slots).find(s => !s.innerText);
                if (nextSlot) {
                    nextSlot.innerText = item.word;
                    nextSlot.classList.add('filled');
                    
                    // Allow clicking a filled slot to remove it
                    nextSlot.onclick = () => {
                        if (this.sentenceGameOver) return;
                        // Find the word in the current guess
                        const idx = this.sentenceCurrentWords.indexOf(item.word);
                        if (idx !== -1) {
                            this.sentenceCurrentWords.splice(idx, 1);
                            nextSlot.innerText = "";
                            nextSlot.classList.remove('filled');
                            chip.classList.remove('disabled');
                        }
                    };
                }

                // Check if sentence is complete
                if (this.sentenceCurrentWords.length === this.sentenceTargetWords.length) {
                    this._validateSentence();
                }
            };
            
            chipsContainer.appendChild(chip);
        });
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

        setTimeout(() => {
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
}
