import * as Utils from '../utils.js';

export class BubbleGame {
    constructor(engine) {
        this.engine = engine;
        this.bubbleSpawnInterval = null;
        this.bubbleTargetEntry = null;
        this.bubbleScore = 0;
    }

    start() {
        const bubbleArea = this.engine.elements.bubbleArea;
        if (!bubbleArea) return;

        this.stop();
        
        bubbleArea.style.display = 'flex';
        bubbleArea.innerHTML = `
            <div class="bubble-target-box" id="bubbleTargetBox">Cargando vocablo...</div>
            <div class="bubble-area" id="bubbleGamePlayground"></div>
        `;

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = "Estalla la traducción correcta";

        if (this.engine.entries.length < 2) {
            bubbleArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar a las Burbujas.</div>';
            return;
        }

        this.bubbleScore = 0;
        this.selectNextTarget();

        const playground = bubbleArea.querySelector('#bubbleGamePlayground');
        this.bubbleSpawnInterval = setInterval(() => {
            if (!this.bubbleTargetEntry) return;

            const isCorrect = Math.random() < 0.35;
            let text = "";
            let entry = null;

            if (isCorrect) {
                entry = this.bubbleTargetEntry;
                text = entry.en;
            } else {
                const distractors = this.engine.entries.filter(e => e.text.split("->")[0].trim() !== this.bubbleTargetEntry.es);
                entry = distractors[Math.floor(Math.random() * distractors.length)];
                text = entry ? entry.en : "";
            }

            if (!text) return;

            const bubble = document.createElement('div');
            bubble.className = 'bubble-element';
            bubble.innerText = text;
            bubble.style.left = `${5 + Math.random() * 75}%`;
            
            const size = 75 + Math.floor(Math.random() * 20);
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            
            bubble.addEventListener('click', () => {
                if (bubble.classList.contains('pop') || bubble.classList.contains('wrong')) return;

                const targetParts = this.bubbleTargetEntry.en.split(/[/\;,]/).map(s => Utils.cleanText(s.trim()));
                const cleanBubbleText = Utils.cleanText(text);
                const matchCorrect = targetParts.includes(cleanBubbleText);

                if (matchCorrect) {
                    bubble.classList.add('pop');
                    this.bubbleScore++;
                    this.engine.speak();
                    this.selectNextTarget();
                    
                    playground.querySelectorAll('.bubble-element').forEach(b => {
                        if (targetParts.includes(Utils.cleanText(b.innerText))) {
                            b.classList.add('pop');
                            setTimeout(() => b.remove(), 350);
                        }
                    });
                    
                    setTimeout(() => bubble.remove(), 350);
                } else {
                    bubble.classList.add('wrong');
                    setTimeout(() => bubble.classList.remove('wrong'), 500);
                }
            });

            bubble.addEventListener('animationend', (e) => {
                if (e.animationName === 'floatUp') {
                    bubble.remove();
                }
            });

            playground.appendChild(bubble);
        }, 1600);
    }

    selectNextTarget() {
        if (this.engine.entries.length === 0) return;
        
        const randEntry = this.engine.entries[Math.floor(Math.random() * this.engine.entries.length)];
        const parts = randEntry.text.split("->");
        const es = parts[0].trim();
        const en = parts[1]?.trim() || "";

        this.bubbleTargetEntry = { es, en };
        this.engine.lastEnglishText = en;

        const box = this.engine.elements.bubbleArea?.querySelector('#bubbleTargetBox');
        if (box) {
            box.innerText = `Encuentra la traducción de: ${es} (Puntos: ${this.bubbleScore})`;
        }
    }

    stop() {
        if (this.bubbleSpawnInterval) {
            clearInterval(this.bubbleSpawnInterval);
            this.bubbleSpawnInterval = null;
        }
        this.bubbleTargetEntry = null;
    }
}
