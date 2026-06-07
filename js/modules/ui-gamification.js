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
                gap: 12px;
                width: 100%;
                background: var(--surface-variant, #e7e0ec);
                padding: 16px;
                border-radius: 20px;
                border: 1px solid var(--outline-variant, #cac4d0);
            }
            .level-circle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, var(--primary, #6750A4), #9c27b0);
                color: var(--on-primary, #ffffff);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Orbitron', sans-serif;
                font-weight: 700;
                font-size: 16px;
                box-shadow: 0 4px 12px rgba(103, 80, 164, 0.4);
                border: 3px solid white;
            }
            .xp-bar-outer {
                width: 100%;
                height: 12px;
                background: rgba(0,0,0,0.05);
                border-radius: 6px;
                overflow: hidden;
                border: 1px solid rgba(0,0,0,0.1);
            }
            .xp-bar-inner {
                height: 100%;
                background: linear-gradient(90deg, #8bc34a, #4caf50);
                width: ${progressPercent}%;
                transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                box-shadow: 0 0 10px rgba(139, 195, 74, 0.5);
            }
            .xp-text {
                font-size: 12px;
                font-family: 'Outfit', sans-serif;
                font-weight: 700;
                color: var(--on-surface, #1c1b1f);
                letter-spacing: 0.5px;
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

/**
 * Achievements List Web Component
 */
class EstudiAppAchievements extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._unsubscribe = null;
        
        this.achData = [
            { id: 'elite_sniper', name: 'Tirador de Élite', icon: '🎯', desc: '50+ puntos en Sniper' },
            { id: 'streak_master', name: 'Maestro de la Racha', icon: '🔥', desc: 'Racha de 7 días' },
            { id: 'polyglot', name: 'Políglota Novato', icon: '🌍', desc: '100 repasos totales' }
        ];
    }

    connectedCallback() {
        this.render();
        this._unsubscribe = AppStore.subscribe(() => this.render());
    }

    disconnectedCallback() {
        if (this._unsubscribe) this._unsubscribe();
    }

    render() {
        const unlocked = AppStore.state.progression.achievements || [];
        
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: block;
                width: 100%;
            }
            .ach-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 12px;
                width: 100%;
            }
            .ach-card {
                background: var(--surface, #fef7ff);
                border: 1px solid var(--outline-variant, #cac4d0);
                border-radius: 16px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 8px;
                transition: all 0.3s;
                filter: grayscale(1);
                opacity: 0.5;
            }
            .ach-card.unlocked {
                filter: none;
                opacity: 1;
                border-color: var(--primary, #6750A4);
                background: var(--primary-container, #eaddff);
                transform: scale(1.05);
            }
            .ach-icon {
                font-size: 32px;
                background: var(--surface-variant, #e7e0ec);
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
            }
            .unlocked .ach-icon {
                background: var(--primary, #6750A4);
                color: white;
            }
            .ach-name {
                font-size: 13px;
                font-weight: 700;
                line-height: 1.2;
            }
            .ach-desc {
                font-size: 11px;
                opacity: 0.7;
            }
        </style>
        <div class="ach-grid">
            ${this.achData.map(ach => {
                const isUnlocked = unlocked.some(a => a.id === ach.id);
                return `
                <div class="ach-card ${isUnlocked ? 'unlocked' : ''}">
                    <div class="ach-icon">${ach.icon}</div>
                    <div class="ach-name">${ach.name}</div>
                    <div class="ach-desc">${ach.desc}</div>
                </div>
                `;
            }).join('')}
        </div>
        `;
    }
}

// Register the components
if (!customElements.get('estudiapp-level-badge')) {
    customElements.define('estudiapp-level-badge', EstudiAppLevelBadge);
}
if (!customElements.get('estudiapp-achievements')) {
    customElements.define('estudiapp-achievements', EstudiAppAchievements);
}
