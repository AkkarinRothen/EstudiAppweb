/**
 * Mission Launchpad Web Component
 * Native Custom Element for game mode selection.
 */

class EstudiAppLaunchpad extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._currentMode = 'direct';
        
        this.groups = [
            {
                title: '📖 Repaso inicial',
                modes: [
                    { id: 'direct', title: 'Modo Directo', desc: 'Estudio libre con dados.', icon: '🎲' },
                    { id: 'flashcard', title: 'Flashcards', desc: 'Sistema clásico de tarjetas.', icon: '🎴' }
                ]
            },
            {
                title: '📝 Producción y Escritura',
                modes: [
                    { id: 'write', title: 'Escritura', desc: 'Escribe la traducción exacta.', icon: '⌨️' },
                    { id: 'scrambled', title: 'Letras', desc: 'Ordena las letras mezcladas.', icon: '🧩' },
                    { id: 'dictation', title: 'Dictado', desc: 'Escucha y escribe lo que oyes.', icon: '🎧' },
                    { id: 'wordle', title: 'Wordle', desc: 'Adivina la palabra en 6 intentos.', icon: '🧩' }
                ]
            },
            {
                title: '🧩 Conexión y Lógica',
                modes: [
                    { id: 'quiz', title: 'Modo Quiz', desc: 'Elige la opción correcta.', icon: '✅' },
                    { id: 'match', title: 'Memorama', desc: 'Empareja conceptos (Esp vs Ing).', icon: '🧠' },
                    { id: 'drag', title: 'Conectar', desc: 'Une palabras con líneas.', icon: '🔗' },
                    { id: 'diagram', title: 'Diagrama', desc: 'Arrastra etiquetas sobre el plano.', icon: '🏷️' }
                ]
            },
            {
                title: '🏗️ Gramática y Estructura',
                modes: [
                    { id: 'sentence', title: 'Constructor', desc: 'Ordena la frase de ejemplo.', icon: '🏗️' }
                ]
            },
            {
                title: '🎮 Desafío y Velocidad',
                modes: [
                    { id: 'timeAttack', title: 'Contrarreloj', desc: 'Acierta todo lo que puedas en 60s.', icon: '⏱️' },
                    { id: 'bubble', title: 'Burbujas', desc: 'Estalla las pompas correctas.', icon: '🫧' },
                    { id: 'sniper', title: '🎯 Sniper', desc: 'Dispara a las palabras que caen.', icon: '🎯' }
                ]
            }
        ];
    }

    static get observedAttributes() {
        return ['current-mode'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'current-mode' && oldVal !== newVal) {
            this._currentMode = newVal;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    set currentMode(val) {
        this.setAttribute('current-mode', val);
    }

    get currentMode() {
        return this.getAttribute('current-mode') || 'direct';
    }

    render() {
        this.shadowRoot.innerHTML = `
        <style>
            :host {
                display: flex;
                flex-direction: column;
                gap: 24px;
                width: 100%;
                padding: 10px 0;
                text-align: left;
                color: var(--on-surface, #1c1b1f);
                font-family: 'Outfit', sans-serif;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .header h3 {
                margin: 0;
                color: var(--primary, #6750A4);
                font-size: 18px;
            }

            .close-btn {
                background: var(--surface-variant, #e7e0ec);
                color: var(--on-surface-variant, #49454f);
                border: none;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.2s;
            }

            .close-btn:hover {
                background: var(--outline-variant, #cac4d0);
            }

            .launchpad-group {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .launchpad-group-title {
                font-size: 14px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
                opacity: 0.6;
                padding-left: 4px;
            }

            .launchpad-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                gap: 12px;
            }

            .mode-card {
                background: var(--surface, #fef7ff);
                border: 1px solid var(--outline-variant, #cac4d0);
                border-radius: 16px;
                padding: 16px;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                flex-direction: column;
                gap: 8px;
                position: relative;
                overflow: hidden;
            }

            .mode-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 20px rgba(0,0,0,0.1);
                border-color: var(--primary, #6750A4);
            }

            .mode-card.active {
                background: var(--primary-container, #eaddff);
                border-color: var(--primary, #6750A4);
                box-shadow: 0 4px 12px rgba(103, 80, 164, 0.15);
            }

            .mode-card-header {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .mode-card-icon {
                font-size: 24px;
                background: var(--surface-variant, #e7e0ec);
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                transition: all 0.2s;
            }

            .active .mode-card-icon {
                background: var(--primary, #6750A4);
                color: white;
            }

            .mode-card-title {
                font-weight: 700;
                font-size: 16px;
                color: var(--on-surface, #1c1b1f);
            }

            .mode-card-desc {
                font-size: 13px;
                line-height: 1.4;
                opacity: 0.7;
            }

            @media (max-width: 600px) {
                .launchpad-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        
        <div class="header">
            <h3>Modos de Estudio</h3>
            <button class="close-btn" id="closeBtn">
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/></svg>
            </button>
        </div>

        ${this.groups.map(group => `
            <div class="launchpad-group">
                <div class="launchpad-group-title">${group.title}</div>
                <div class="launchpad-grid">
                    ${group.modes.map(mode => `
                        <div class="mode-card ${this._currentMode === mode.id ? 'active' : ''}" data-mode="${mode.id}">
                            <div class="mode-card-header">
                                <div class="mode-card-icon">${mode.icon}</div>
                                <div class="mode-card-title">${mode.title}</div>
                            </div>
                            <div class="mode-card-desc">${mode.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
        `;

        this.shadowRoot.getElementById('closeBtn').onclick = () => {
            this.dispatchEvent(new CustomEvent('close'));
        };

        this.shadowRoot.querySelectorAll('.mode-card').forEach(card => {
            card.onclick = () => {
                const modeId = card.dataset.mode;
                this.dispatchEvent(new CustomEvent('mode-select', {
                    detail: { modeId },
                    bubbles: true,
                    composed: true
                }));
            };
        });
    }
}

if (!customElements.get('estudiapp-launchpad')) {
    customElements.define('estudiapp-launchpad', EstudiAppLaunchpad);
}
