/**
 * Legendary Streak Web Component
 * Features an animated fire SVG that reacts to the study streak.
 */
import { AppStore } from './state.js';

class EstudiAppStreak extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        this._unsubscribe = AppStore.subscribe(() => {
            this.render();
        });
    }

    disconnectedCallback() {
        if (this._unsubscribe) this._unsubscribe();
    }

    render() {
        const streak = AppStore.state.stats.streak || 0;
        const intensity = Math.min(10, streak); // Scale intensity up to 10 days
        const flameColor = streak >= 7 ? 'var(--streak-high, #00d2ff)' : 'var(--streak-low, #ff9800)';
        const glowColor = streak >= 7 ? 'rgba(0, 210, 255, 0.5)' : 'rgba(255, 152, 0, 0.5)';
        
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                width: 100%;
            }

            .streak-container {
                position: relative;
                width: 60px;
                height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .flame-svg {
                width: 100%;
                height: 100%;
                fill: ${flameColor};
                filter: drop-shadow(0 0 10px ${glowColor});
                transition: fill 0.5s, filter 0.5s;
                animation: flicker 0.15s infinite alternate;
                transform-origin: center bottom;
                transform: scale(${0.8 + (intensity * 0.05)});
            }

            @keyframes flicker {
                0% { transform: scale(${0.8 + (intensity * 0.05)}) rotate(-2deg); opacity: 0.9; }
                100% { transform: scale(${0.85 + (intensity * 0.05)}) rotate(2deg); opacity: 1; }
            }

            .streak-value {
                font-family: 'Orbitron', sans-serif;
                font-size: 24px;
                font-weight: 900;
                color: var(--primary, #6750A4);
                text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .streak-label {
                font-size: 11px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--on-surface-variant, #49454f);
                opacity: 0.8;
            }

            .empty-streak {
                filter: grayscale(1) opacity(0.3);
            }
        </style>

        <div class="streak-container ${streak === 0 ? 'empty-streak' : ''}">
            <svg class="flame-svg" viewBox="0 0 24 24">
                <path d="M12,2C12,2 10.5,5.5 10.5,8C10.5,10.5 12,12 12,12C12,12 13.5,10.5 13.5,8C13.5,5.5 12,2 12,2M12,22C12,22 17,18.5 17,14C17,11.5 15.5,9.5 14,8.5C14.5,10.5 14,12.5 13,14C12,15.5 10,16 8.5,15.5C9,17.5 10.5,19 12,20C10.5,19 9.5,17.5 9,15.5C7.5,16.5 7,18.5 7,20.5C7,21.5 8,22 12,22Z" />
            </svg>
        </div>
        <div class="streak-value">${streak} ${streak === 1 ? 'DÍA' : 'DÍAS'}</div>
        <div class="streak-label">Estudiando sin parar</div>
        `;
    }
}

if (!customElements.get('estudiapp-streak')) {
    customElements.define('estudiapp-streak', EstudiAppStreak);
}
