import * as Fx from '../fx.js';
import * as Difficulty from '../difficulty-manager.js';

export class TimeAttackGame {
    constructor(engine) {
        this.engine = engine;
    }

    start() {
        this.engine.isTimeAttackActive = true;
        
        // Calculate difficulty
        const factor = Difficulty.getDifficultyFactor(0); // Fixed for time attack start
        const params = Difficulty.lerpParams(
            { timeLimit: 90 }, // Easy
            { timeLimit: 30 }, // Hard
            factor
        );

        this.engine.timeLeft = Math.floor(params.timeLimit);
        this.engine.timeAttackScore = 0;

        Fx.playSound('transition');

        const timerVal = this.engine.elements.timerVal;
        const timerContainer = this.engine.elements.timerContainer;
        if (timerVal) timerVal.innerText = this.engine.timeLeft + "s";
        if (timerContainer) timerContainer.style.display = 'flex';
        
        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) actionBtn.style.display = 'none';

        this.nextEntry();

        this.engine.timerInterval = setInterval(() => {
            this.engine.timeLeft--;
            if (timerVal) timerVal.innerText = this.engine.timeLeft + "s";
            if (this.engine.timeLeft <= 0) {
                this.stop();
                this.showResults();
            }
        }, 1000);
    }

    stop() {
        this.engine.isTimeAttackActive = false;
        if (this.engine.timerInterval) clearInterval(this.engine.timerInterval);
        this.engine.timerInterval = null;
        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) actionBtn.style.display = 'block';
    }

    nextEntry() {
        if (!this.engine.isTimeAttackActive) return;

        // Calculate difficulty for quiz options
        const factor = Difficulty.getDifficultyFactor(this.engine.timeAttackScore);
        const params = Difficulty.lerpParams(
            { numOptions: 2 }, // Easy (0.0)
            { numOptions: 6 }, // Hard (1.0)
            factor
        );

        this.engine.quizGame.start(Math.floor(params.numOptions));
    }

    showResults() {
        const scrambledArea = this.engine.elements.scrambledArea;

        Fx.playSound('victory');
        Fx.celebrate('burst');

        if (scrambledArea) {
            scrambledArea.innerHTML = `
                <div class="time-attack-results" role="alert" aria-live="assertive">
                    <div class="results-label">¡Tiempo agotado!</div>
                    <div class="results-score">${this.engine.timeAttackScore}</div>
                    <div class="results-label">Aciertos</div>
                </div>
            `;
            scrambledArea.style.display = 'flex';
        }
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = "Fin del Juego";
        if (this.engine.elements.quizOptions) this.engine.elements.quizOptions.style.display = 'none';

        const actionBtn = this.engine.elements.actionBtn;
        if (actionBtn) {
            actionBtn.innerText = 'Volver a intentar';
            actionBtn.setAttribute('role', 'button');
            actionBtn.setAttribute('tabindex', '0');
            this.retryHandler = () => this.engine.setMode('timeAttack');
            actionBtn.onclick = this.retryHandler;
        }
    }
}
