// Effects and Animations Module
// Centralizes the use of external lightweight libraries for FX

let confetti = null;
let Howl = null;
let anime = null;

// Sound instances cache
const sounds = {};

/**
 * Initializes the FX module by pre-loading external libraries.
 */
async function ensureInit() {
    try {
        if (!confetti) {
            const module = await import('https://cdn.skypack.dev/canvas-confetti');
            confetti = module.default;
        }
        if (!Howl) {
            const module = await import('https://cdn.skypack.dev/howler');
            Howl = module.Howl;
            
            // Initialize sounds if Howl is now available
            if (Howl && Object.keys(sounds).length === 0) {
                sounds.success = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'], volume: 0.5 });
                sounds.error = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'], volume: 0.3 });
                sounds.click = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.2 });
                sounds.transition = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2568-preview.mp3'], volume: 0.2 });
                sounds.victory = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.6 });
            }
        }
        if (!anime) {
            const module = await import('https://cdn.skypack.dev/animejs@3.2.1');
            anime = module.default;
        }
    } catch (e) {
        console.warn('Fx Module: Failed to load external libraries. FX will be disabled.', e);
    }
}

/**
 * Plays a predefined sound effect
 * @param {string} key - 'success', 'error', 'click', 'transition', 'victory'
 */
export async function playSound(key) {
    await ensureInit();
    if (sounds[key]) sounds[key].play();
}

/**
 * Triggers a confetti celebration
 * @param {string} mode - 'simple', 'burst', 'side'
 */
export async function celebrate(mode = 'simple') {
    await ensureInit();
    if (!confetti) return;

    if (mode === 'simple') {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6750A4', '#958DA5', '#D0BCFF']
        });
    } else if (mode === 'burst') {
        const count = 200;
        const defaults = { origin: { y: 0.7 }, colors: ['#6750A4', '#958DA5', '#D0BCFF'] };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }
}

/**
 * Animates an element using Anime.js
 * @param {string|HTMLElement} target 
 * @param {object} params - Anime.js parameters
 */
export async function animate(target, params) {
    await ensureInit();
    if (anime) {
        return anime({
            targets: target,
            ...params
        });
    }
}

/**
 * Standard entrance animation for cards/modals
 * @param {string|HTMLElement} target 
 */
export async function animateEntrance(target) {
    await ensureInit();
    if (anime) {
        return anime({
            targets: target,
            translateY: [20, 0],
            opacity: [0, 1],
            duration: 800,
            easing: 'easeOutElastic(1, .8)'
        });
    }
}

/**
 * Shake animation for errors
 * @param {string|HTMLElement} target 
 */
export async function shake(target) {
    await ensureInit();
    if (anime) {
        return anime({
            targets: target,
            translateX: [
                { value: -10, duration: 100 },
                { value: 10, duration: 100 },
                { value: -10, duration: 100 },
                { value: 10, duration: 100 },
                { value: 0, duration: 100 }
            ],
            easing: 'easeInOutSine'
        });
    }
}
