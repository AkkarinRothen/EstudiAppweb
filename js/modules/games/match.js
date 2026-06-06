import * as Utils from '../utils.js';
import * as Difficulty from '../difficulty-manager.js';

export class MatchGame {
    constructor(engine) {
        this.engine = engine;
        this.activeTimers = [];
    }

    start() {
        const matchArea = this.engine.elements.matchArea;
        if (!matchArea) return;
        
        this.stop();

        matchArea.innerHTML = '';
        matchArea.style.display = 'flex';
        
        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = "Empareja las palabras";

        if (this.engine.entries.length < 3) {
            matchArea.innerHTML = '<div class="info">Se necesitan al menos 3 vocablos para jugar al Memorama.</div>';
            return;
        }

        // Calculate difficulty settings
        const factor = Difficulty.getDifficultyFactor(0); // Fixed for grid games
        const params = Difficulty.lerpParams(
            { gridSize: 4, flipDelay: 2000 }, // Easy
            { gridSize: 10, flipDelay: 600 },  // Hard
            factor
        );

        const gameSize = Math.min(Math.floor(params.gridSize), this.engine.entries.length);
        const shuffledEntries = [...this.engine.entries].sort(() => Math.random() - 0.5);
        const selected = shuffledEntries.slice(0, gameSize);

        const cards = [];
        selected.forEach((entry, idx) => {
            const parts = entry.text.split("->");
            const es = parts[0].trim();
            const en = parts[1]?.trim() || "";
            
            let imgUrl = "";
            if (parts.length > 2) {
                const third = parts[2].trim();
                if (third.startsWith("http://") || third.startsWith("https://") || third.startsWith("data:")) {
                     imgUrl = third;
                } else if (!third.startsWith('http')) {
                     imgUrl = third;
                }
            }
            if (!imgUrl) {
                const queryWord = Utils.extractImageKeyword(en);
                if (queryWord && (this.engine.elements.enableImages ? this.engine.elements.enableImages.checked : true)) {
                    imgUrl = "https://loremflickr.com/320/240/" + encodeURIComponent(queryWord);
                }
            }
            if (imgUrl && !imgUrl.startsWith('http://') && !imgUrl.startsWith('https://') && !imgUrl.startsWith('data:')) {
                if (this.engine.isModal) {
                    if (imgUrl.startsWith('../')) imgUrl = imgUrl.substring(3);
                } else {
                    if (!imgUrl.startsWith('../')) imgUrl = '../' + imgUrl;
                }
            }

            // Card A (Spanish/Image)
            cards.push({
                id: `card_${idx}_es`,
                pairId: idx,
                type: 'es',
                content: (imgUrl && (this.engine.elements.enableImages ? this.engine.elements.enableImages.checked : true)) 
                    ? `<img src="${imgUrl}" alt="${es}">` 
                    : `<span>${es}</span>`
            });

            // Card B (English translation)
            cards.push({
                id: `card_${idx}_en`,
                pairId: idx,
                type: 'en',
                content: `<span>${en}</span>`
            });
        });

        cards.sort(() => Math.random() - 0.5);

        const grid = document.createElement('div');
        grid.className = 'match-grid';
        
        cards.forEach(cardData => {
            const cardEl = document.createElement('div');
            cardEl.className = 'match-card';
            cardEl.dataset.id = cardData.id;
            cardEl.dataset.pairId = cardData.pairId;
            
            // Accessibility
            cardEl.setAttribute('role', 'button');
            cardEl.setAttribute('tabindex', '0');

            cardEl.innerHTML = `
                <div class="match-card-inner">
                    <div class="match-card-front">❓</div>
                    <div class="match-card-back">
                        ${cardData.content}
                    </div>
                </div>
            `;
            grid.appendChild(cardEl);
        });

        this.setupEventListeners(grid, gameSize);
        matchArea.appendChild(grid);
    }

    setupEventListeners(grid, gameSize) {
        let activeCards = [];
        let matchedCount = 0;

        this.clickHandler = (e) => {
            const cardEl = e.target.closest('.match-card');
            if (!cardEl || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched') || activeCards.length >= 2) {
                return;
            }

            cardEl.classList.add('flipped');
            activeCards.push(cardEl);

            if (activeCards.length === 2) {
                const [card1, card2] = activeCards;
                if (card1.dataset.pairId === card2.dataset.pairId) {
                    const t1 = setTimeout(() => {
                        card1.classList.add('matched');
                        card2.classList.add('matched');
                        activeCards = [];
                        matchedCount++;

                        if (matchedCount === gameSize) {
                            this.showWinScreen();
                        }
                    }, 500);
                    this.activeTimers.push(t1);
                } else {
                    // Use dynamic difficulty parameters if available, else fallback
                    const factor = Difficulty.getDifficultyFactor(0);
                    const params = Difficulty.lerpParams({ flipDelay: 2000 }, { flipDelay: 600 }, factor);

                    const t2 = setTimeout(() => {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                        activeCards = [];
                    }, params.flipDelay);
                    this.activeTimers.push(t2);
                }
            }
        };

        grid.addEventListener('click', this.clickHandler);
    }

    showWinScreen() {
        const matchArea = this.engine.elements.matchArea;
        if (!matchArea) return;

        matchArea.innerHTML = `
            <div class="match-win-screen">
                <h3 style="color:var(--success); font-size:24px; margin:0;">¡Felicidades! 🎉</h3>
                <p class="info" style="font-size:14px;">Has emparejado todos los términos correctamente.</p>
                <button class="srs-btn srs-btn-good" style="margin-top:10px; width:auto; padding:12px 24px;" role="button" tabindex="0">Jugar de nuevo</button>
            </div>
        `;
        const btn = matchArea.querySelector('button');
        if (btn) btn.onclick = () => this.start();
    }

    stop() {
        this.activeTimers.forEach(timer => clearTimeout(timer));
        this.activeTimers = [];

        const matchArea = this.engine.elements.matchArea;
        const grid = matchArea?.querySelector('.match-grid');
        if (grid && this.clickHandler) {
            grid.removeEventListener('click', this.clickHandler);
        }
    }
}
