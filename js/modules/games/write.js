import * as Srs from '../srs.js';
import * as Utils from '../utils.js';
import * as Fx from '../fx.js';

export class WriteGame {
    constructor(engine) {
        this.engine = engine;
    }

    start() {
        this.stop();

        if (this.engine.entries.length === 0) return;

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.quizOptions) this.engine.elements.quizOptions.style.display = 'none';
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

        const writeArea = this.engine.elements.writeArea;
        if (writeArea) writeArea.style.display = 'flex';

        const input = this.engine.elements.writeInput;
        if (input) {
            input.value = "";
            input.disabled = false;
            input.focus();
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            };
        }

        const feedback = this.engine.elements.writeFeedback;
        if (feedback) {
            feedback.innerText = "";
            feedback.className = "write-feedback";
        }

        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Comprobar';
            actionBtn.setAttribute('role', 'button');
            actionBtn.setAttribute('tabindex', '0');
            actionBtn.onclick = () => this.checkAnswer();
        }
    }

    checkAnswer() {
        const input = this.engine.elements.writeInput;
        const feedback = this.engine.elements.writeFeedback;
        const actionBtn = this.engine.elements.actionBtn;

        if (!input || !feedback) return;

        const typed = input.value.trim();
        if (!typed) return;

        input.disabled = true;

        const correctOptions = this.engine.lastEnglishText.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
        const typedClean = Utils.cleanText(typed);
        const isCorrect = correctOptions.includes(typedClean);

        this.engine.rateSrs(isCorrect);

        if (isCorrect) {
            feedback.innerText = "¡Correcto! 🎉";
            feedback.className = "write-feedback correct";
            this.engine.speak();
        } else {
            const diffMarkup = Utils.getDiffHighlight(typed, this.engine.lastEnglishText.split(/[/\;,]/)[0].trim());
            feedback.innerHTML = `Incorrecto. <br>Tu intento: <span style="font-weight:normal;">${diffMarkup}</span><br>Correcto: <strong>${this.engine.lastEnglishText}</strong>`;
            feedback.className = "write-feedback incorrect";
            Fx.shake(input);
        }

        if (actionBtn) {
            actionBtn.innerText = 'Siguiente Pregunta';
            actionBtn.onclick = () => this.start();
        }
    }

    stop() {
        const input = this.engine.elements.writeInput;
        if (input) input.onkeydown = null;
        
        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) actionBtn.onclick = null;
    }
}
