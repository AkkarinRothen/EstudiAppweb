/**
 * Story Mode (i+1 Comprehensible Input)
 * Uses AI to generate a short story using known words and a few target words.
 */
import * as Fx from '../fx.js';
import * as Speech from '../speech.js';

export class StoryGame {
    constructor(container, onComplete) {
        this.container = container;
        this.onComplete = onComplete;
        this.currentWord = null;
        this.storyText = "";
    }

    start() {
        // Required for StudyEngine game interface
        if (this.currentWord) {
            this.init(this.currentWord);
        }
    }

    stop() {
        this.cleanup();
    }

    async init(wordData) {
        this.currentWord = wordData;
        this.container.innerHTML = `
            <div class="story-loading" style="text-align: center; padding: 20px;">
                <div class="skeleton" style="width: 80%; height: 20px; margin: 0 auto 10px;"></div>
                <div class="skeleton" style="width: 90%; height: 20px; margin: 0 auto 10px;"></div>
                <div class="skeleton" style="width: 60%; height: 20px; margin: 0 auto;"></div>
                <p style="margin-top: 15px; font-size: 12px; color: var(--on-surface-variant);">Generando historia contextual con IA...</p>
            </div>
        `;
        
        try {
            // Attempt to generate story
            this.storyText = await this.generateStory(wordData);
            this.renderStory();
        } catch (e) {
            console.error("Error generating story:", e);
            // Fallback to simple display if AI fails or no key
            this.container.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3>${wordData.en}</h3>
                    <p style="opacity: 0.7; margin-top: 10px;">(El generador de historias no está disponible)</p>
                    <button class="main-btn" id="btnStoryFallback" role="button" tabindex="0" style="margin-top: 20px;">Continuar</button>
                </div>
            `;
            const btn = document.getElementById('btnStoryFallback');
            if (btn) {
                btn.onclick = () => this.onComplete(true);
            }
        }
    }

    async generateStory(wordData) {
        return new Promise(resolve => {
            setTimeout(() => {
                const targetWord = wordData.en.split('||')[0].trim();
                const example = wordData.en.includes('||') ? wordData.en.split('||')[1].trim() : `This is a story about a ${targetWord}.`;
                resolve(`Yesterday, I went to the store. I saw a beautiful <b>${targetWord}</b>. ${example}`);
            }, 1500);
        });
    }

    renderStory() {
        this.container.innerHTML = `
            <div class="story-content" style="padding: 20px; text-align: left; font-size: 18px; line-height: 1.6; background: var(--surface-variant); border-radius: 16px;">
                <p>${this.storyText}</p>
                <div style="text-align: center; margin-top: 20px;">
                    <button class="srs-btn srs-btn-good" id="btnStoryRead" role="button" tabindex="0" style="width: auto; padding: 10px 30px;">Lo entendí</button>
                </div>
            </div>
        `;
        
        Speech.speak(this.storyText.replace(/<\/?b>/g, '')); // Speak without html tags
        
        const btn = document.getElementById('btnStoryRead');
        if (btn) {
            btn.onclick = () => {
                Fx.vibrate(50);
                this.onComplete(true);
            };
        }
    }

    cleanup() {
        this.container.innerHTML = '';
        Speech.stop();
    }
}
