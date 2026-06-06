export class DragGame {
    constructor(engine) {
        this.engine = engine;
        this.activeTimers = [];
    }

    start() {
        const dragArea = this.engine.elements.dragArea;
        if (!dragArea) return;

        this.stop();

        dragArea.innerHTML = '';
        dragArea.style.display = 'flex';

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = 'Conecta cada palabra con su traducción';

        if (this.engine.entries.length < 2) {
            dragArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar a Conectar.</div>';
            return;
        }

        const gameSize = Math.min(6, this.engine.entries.length);
        const selected = [...this.engine.entries].sort(() => Math.random() - 0.5).slice(0, gameSize);

        const esWords = selected.map((e, i) => ({ id: i, text: e.text.split('->')[0].trim() }));
        const enWords = selected.map((e, i) => ({ id: i, text: e.text.split('->')[1]?.split('||')[0].trim() || '' }));
        const shuffledEn = [...enWords].sort(() => Math.random() - 0.5);

        let selectedEs = null;
        let matchedCount = 0;

        // Build layout
        dragArea.innerHTML = `
            <div class="drag-wrapper">
                <svg class="drag-svg" id="dragSvg"></svg>
                <div class="drag-col" id="dragColEs"></div>
                <div class="drag-col" id="dragColEn"></div>
            </div>
        `;

        const svg = dragArea.querySelector('#dragSvg');
        const colEs = dragArea.querySelector('#dragColEs');
        const colEn = dragArea.querySelector('#dragColEn');

        const drawLine = (el1, el2, color = 'var(--primary)') => {
            const r1 = el1.getBoundingClientRect();
            const r2 = el2.getBoundingClientRect();
            const svgR = svg.getBoundingClientRect();

            const x1 = r1.right - svgR.left;
            const y1 = r1.top + r1.height / 2 - svgR.top;
            const x2 = r2.left - svgR.left;
            const y2 = r2.top + r2.height / 2 - svgR.top;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const cx = (x1 + x2) / 2;
            line.setAttribute('d', `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`);
            line.setAttribute('stroke', color);
            line.setAttribute('stroke-width', '3');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            svg.appendChild(line);
            return line;
        };

        esWords.forEach(word => {
            const el = document.createElement('div');
            el.className = 'drag-word';
            el.innerText = word.text;
            el.dataset.id = word.id;

            el.addEventListener('click', () => {
                if (el.classList.contains('matched')) return;
                dragArea.querySelectorAll('.drag-word.selected').forEach(w => w.classList.remove('selected'));
                if (selectedEs?.id === word.id) {
                    selectedEs = null;
                } else {
                    selectedEs = { id: word.id, el };
                    el.classList.add('selected');
                }
            });

            colEs.appendChild(el);
        });

        shuffledEn.forEach(word => {
            const el = document.createElement('div');
            el.className = 'drag-word';
            el.innerText = word.text;
            el.dataset.id = word.id;

            el.addEventListener('click', () => {
                if (el.classList.contains('matched') || !selectedEs) return;

                const isCorrect = selectedEs.id === word.id;

                if (isCorrect) {
                    selectedEs.el.classList.remove('selected');
                    selectedEs.el.classList.add('matched');
                    el.classList.add('matched');

                    // Draw permanent green line
                    const t1 = setTimeout(() => {
                        drawLine(selectedEs.el, el, 'var(--success, #4CAF50)');
                    }, 10);
                    this.activeTimers.push(t1);

                    this.engine.rateSrs(true);
                    matchedCount++;
                    selectedEs = null;

                    if (matchedCount === gameSize) {
                        const t2 = setTimeout(() => {
                            dragArea.innerHTML = `
                                <div class="match-win-screen">
                                    <h3 style="color:var(--success,#4CAF50);font-size:24px;margin:0;">¡Perfecto! 🎉</h3>
                                    <p class="info">Has conectado todos los pares correctamente.</p>
                                    <button class="srs-btn srs-btn-good" style="margin-top:10px;width:auto;padding:12px 24px;">Jugar de nuevo</button>
                                </div>
                            `;
                            const btn = dragArea.querySelector('button');
                            if (btn) btn.onclick = () => this.start();
                        }, 600);
                        this.activeTimers.push(t2);
                    }
                } else {
                    // Flash wrong
                    el.classList.add('drag-wrong');
                    const targetEl = selectedEs.el;
                    targetEl.classList.add('drag-wrong');
                    const t3 = setTimeout(() => {
                        el.classList.remove('drag-wrong');
                        targetEl.classList.remove('drag-wrong');
                        targetEl.classList.remove('selected');
                    }, 700);
                    this.activeTimers.push(t3);
                    selectedEs = null;
                    this.engine.rateSrs(false);
                }
            });

            colEn.appendChild(el);
        });
    }

    stop() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeTimers = [];
    }
}
