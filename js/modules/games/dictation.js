import * as Srs from '../srs.js';
import * as Speech from '../speech.js';
import * as Utils from '../utils.js';

export class DictationGame {
    constructor(engine) {
        this.engine = engine;
    }

    start() {
        const dictationArea = this.engine.elements.dictationArea;
        if (!dictationArea) return;

        dictationArea.innerHTML = '';
        dictationArea.style.display = 'flex';

        if (this.engine.entries.length === 0) {
            dictationArea.innerHTML = '<div class="info">No hay vocablos disponibles.</div>';
            return;
        }

        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';

        // Select entry using SRS
        const dummyTableData = { title: this.engine.packId, entries: this.engine.entries };
        const entry = Srs.selectNextSrsEntry(dummyTableData, this.engine.lastSpanishText);
        if (!entry) return;

        const parts = entry.text.split('->');
        const es = parts[0].trim();
        const en = parts[1]?.split('||')[0].trim() || '';
        this.engine.lastSpanishText = es;
        this.engine.lastEnglishText = en;

        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = '🎵 Escucha y escribe en español';

        dictationArea.innerHTML = `
            <div class="dictation-instructions">Escucha la pronunciación en inglés y escribe la traducción al español</div>
            <button class="dictation-replay-btn" id="dictationReplayBtn">🔊 Escuchar de nuevo</button>
            <input type="text" class="dictation-input" id="dictationInput" placeholder="Escribe la traducción en español..." autocomplete="off">
            <div class="dictation-feedback" id="dictationFeedback"></div>
            <button class="srs-btn srs-btn-good" id="dictationCheckBtn" style="width:auto;padding:10px 24px;margin-top:8px;">✅ Verificar</button>
        `;

        dictationArea.style.display = 'flex';

        // Auto-speak
        setTimeout(() => {
            Speech.speak(en,
                this.engine.elements.voiceSelect?.value,
                this.engine.elements.speedSlider?.value
            );
        }, 400);

        const replayBtn = dictationArea.querySelector('#dictationReplayBtn');
        replayBtn.addEventListener('click', () => {
            Speech.speak(en,
                this.engine.elements.voiceSelect?.value,
                this.engine.elements.speedSlider?.value
            );
        });

        const checkFn = () => {
            const inputEl = dictationArea.querySelector('#dictationInput');
            const feedbackEl = dictationArea.querySelector('#dictationFeedback');
            const val = Utils.cleanText(inputEl?.value || '');
            const target = Utils.cleanText(es);

            if (!val) return;

            const isCorrect = Utils.compareText(val, target);

            if (isCorrect) {
                feedbackEl.innerHTML = `<span class="dictation-correct">✅ ¡Correcto! La traducción es <strong>${es}</strong></span>`;
                inputEl.classList.add('dictation-input-correct');
                inputEl.disabled = true;
                this.engine.rateSrs(true);
                this.engine.speak();
            } else {
                feedbackEl.innerHTML = `<span class="dictation-incorrect">❌ Era: <strong>${es}</strong></span>`;
                inputEl.classList.add('dictation-input-wrong');
                inputEl.disabled = true;
                this.engine.rateSrs(false);
            }

            // Show next button
            const checkBtn = dictationArea.querySelector('#dictationCheckBtn');
            if (checkBtn) {
                checkBtn.innerText = '➡️ Siguiente';
                checkBtn.onclick = () => this.start();
            }
        };

        const checkBtn = dictationArea.querySelector('#dictationCheckBtn');
        checkBtn.addEventListener('click', checkFn);

        const inputEl = dictationArea.querySelector('#dictationInput');
        inputEl.focus();
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                checkFn();
            }
        });
    }
}
