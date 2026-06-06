import * as Srs from '../srs.js';

export class QuizGame {
    constructor(engine) {
        this.engine = engine;
        this.timeoutId = null;
    }

    start() {
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

        while (options.length < Math.min(4, uniqueDistractors.length + 1)) {
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
                btn.onclick = () => {
                    const buttons = optionsContainer.querySelectorAll('.quiz-option');
                    buttons.forEach(b => b.disabled = true);

                    const isCorrect = (opt === english);
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
                            if (b.innerText === english) b.classList.add('correct');
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
                optionsContainer.appendChild(btn);
            });
        }
    }

    stop() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
}
