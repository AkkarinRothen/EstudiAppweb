/**
 * Level Badge Web Component
 * Encapsulates the progression UI in a native custom element.
 */
import * as Gamification from './gamification.js';
import { AppStore } from './state.js';

class EstudiAppLevelBadge extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._unsubscribe = null;
    }

    connectedCallback() {
        this.render();
        // Subscribe to state changes
        this._unsubscribe = AppStore.subscribe(() => {
            this.render();
        });
    }

    disconnectedCallback() {
        if (this._unsubscribe) this._unsubscribe();
    }

    render() {
        const prog = Gamification.getProgression();
        const nextXp = Gamification.getXpForLevel(prog.level + 1);
        const prevXp = Gamification.getXpForLevel(prog.level);
        const progressPercent = Math.min(100, Math.floor(((prog.xp - prevXp) / (nextXp - prevXp)) * 100));

        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
            }
            .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                width: 100%;
            }
            .level-circle {
                width: 50px;
                height: 50px;
                background: var(--primary, #6750A4);
                color: var(--on-primary, #ffffff);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Orbitron', sans-serif;
                font-weight: 700;
                font-size: 14px;
                box-shadow: 0 4px 12px rgba(103, 80, 164, 0.3);
                border: 2px solid var(--primary-container, #eaddff);
            }
            .xp-bar-outer {
                width: 100%;
                height: 10px;
                background: var(--surface-variant, #e7e0ec);
                border-radius: 5px;
                overflow: hidden;
                border: 1px solid var(--outline, #79747e);
            }
            .xp-bar-inner {
                height: 100%;
                background: linear-gradient(90deg, var(--primary, #6750A4), #8bc34a);
                width: ${progressPercent}%;
                transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .xp-text {
                font-size: 11px;
                font-family: 'Outfit', sans-serif;
                opacity: 0.8;
                font-weight: 500;
                color: var(--on-surface, #1c1b1f);
            }
        </style>
        <div class="container">
            <div class="level-circle">Lvl ${prog.level}</div>
            <div class="xp-bar-outer">
                <div class="xp-bar-inner"></div>
            </div>
            <div class="xp-text">${prog.xp} / ${nextXp} XP</div>
        </div>
        `;
    }
}

// Register the component
if (!customElements.get('estudiapp-level-badge')) {
    customElements.define('estudiapp-level-badge', EstudiAppLevelBadge);
}
