import * as Srs from '../srs.js';

export class QuizGame {
    constructor(engine) {
        this.engine = engine;
        this.timeoutId = null;
    }

    start(numOptions = 4) {
        this.stop();

        if (this.engine.entries.length < 2) {
            if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = "Se necesitan al menos 2 elementos para jugar.";
            return;
        }

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.writeArea) this.engine.elements.writeArea.style.display = 'none';
        if (this.engine.elements.scrambledArea) this.engine.elements.scrambledArea.style.display = 'none';
        if (this.engine.elements.srsFeedback) this.engine.elements.srsFeedback.style.display = 'none';

        const dummyTableData = { title: this.engine.packId, entries: this.engine.entries };
        this.engine.activeEntry = Srs.selectNextSrsEntry(dummyTableData, this.engine.lastSpanishText);
        if (!this.engine.activeEntry) return;

        const parts = this.engine.activeEntry.text.split("->");
        const spanish = parts[0].trim();
        const english = parts.length > 1 ? parts[1].trim() : "";

        this.engine.setEntry(spanish, english);

        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = spanish;

        // Distractors
        const options = [english];
        const otherEntries = this.engine.entries.filter(e => e.text.split("->")[0].trim() !== spanish);
        const distractors = otherEntries
            .map(e => e.text.split("->")[1]?.trim() || "")
            .filter(txt => txt !== "" && txt !== english);
        const uniqueDistractors = [...new Set(distractors)];

        const targetOptionsCount = Math.min(numOptions, uniqueDistractors.length + 1);
        while (options.length < targetOptionsCount) {
            const randomDist = uniqueDistractors[Math.floor(Math.random() * uniqueDistractors.length)];
            if (!options.includes(randomDist)) {
                options.push(randomDist);
            }
        }

        options.sort(() => Math.random() - 0.5);

        const optionsContainer = this.engine.elements.quizOptions;
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            optionsContainer.style.display = 'flex';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'quiz-option';
                btn.innerText = opt;
                btn.setAttribute('role', 'button');
                btn.setAttribute('tabindex', '0');
                optionsContainer.appendChild(btn);
            });

            this.setupEventListeners(optionsContainer, english);
        }
    }

    setupEventListeners(container, correctAnswer) {
        this.optionHandler = (e) => {
            const btn = e.target.closest('.quiz-option');
            if (!btn || btn.disabled) return;

            const buttons = container.querySelectorAll('.quiz-option');
            buttons.forEach(b => b.disabled = true);

            const opt = btn.innerText;
            const isCorrect = (opt === correctAnswer);
            this.engine.quizAttempts++;

            if (isCorrect) {
                btn.classList.add('correct');
                this.engine.quizCorrect++;
                this.engine.speak();
                if (this.engine.isTimeAttackActive) {
                    this.engine.timeAttackScore++;
                    this.timeoutId = setTimeout(() => this.engine.timeAttackGame.nextEntry(), 500);
                }
            } else {
                btn.classList.add('incorrect');
                buttons.forEach(b => {
                    if (b.innerText === correctAnswer) b.classList.add('correct');
                });
                if (this.engine.isTimeAttackActive) {
                    this.timeoutId = setTimeout(() => this.engine.timeAttackGame.nextEntry(), 800);
                }
            }

            if (!this.engine.isTimeAttackActive) {
                this.engine.rateSrs(isCorrect);
                this.engine.updateQuizScoreDisplay();
            }
        };

        container.addEventListener('click', this.optionHandler);
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        
        const container = this.engine.elements.quizOptions;
        if (container && this.optionHandler) {
            container.removeEventListener('click', this.optionHandler);
        }
    }
}
