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
                sounds.laser = new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1681/1681-preview.mp3'], volume: 0.4 });
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
 * Standard exit animation for cards/modals/containers
 * @param {string|HTMLElement} target 
 * @returns {Promise}
 */
export async function animateExit(target) {
    await ensureInit();
    if (anime && target) {
        return anime({
            targets: target,
            translateY: [0, 20],
            opacity: [1, 0],
            duration: 250,
            easing: 'easeInQuad'
        }).finished;
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

/**
 * Creates high-fidelity CSS particles at a specific position.
 */
export function createParticles(x, y, color = '#6750A4', count = 8) {
    const container = document.body;
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'fx-particle';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;
        
        const size = Math.random() * 8 + 4;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        const destinationX = (Math.random() - 0.5) * 200;
        const destinationY = (Math.random() - 0.5) * 200;
        
        particle.style.setProperty('--dx', `${destinationX}px`);
        particle.style.setProperty('--dy', `${destinationY}px`);
        
        container.appendChild(particle);
        particle.addEventListener('animationend', () => particle.remove());
    }
}

/**
 * Triggers a visual flash effect on an area or element.
 */
export function impactFlash(container) {
    if (!container) return;
    const flash = document.createElement('div');
    flash.className = 'fx-impact-flash';
    container.appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove());
}

/**
 * Creates a expanding success ripple at a specific position.
 */
export function successRipple(x, y, size = 100) {
    const container = document.body;
    const ripple = document.createElement('div');
    ripple.className = 'fx-success-ripple';
    ripple.style.left = `${x - size / 2}px`;
    ripple.style.top = `${y - size / 2}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    
    container.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

/**
 * Shows a full-screen level up splash
 * @param {number} level 
 */
export async function showLevelUp(level) {
    const splash = document.createElement('div');
    splash.className = 'level-up-splash';
    splash.innerHTML = `
        <h2>¡NIVEL ${level}!</h2>
        <p>Tu conocimiento sigue creciendo ✨</p>
    `;
    document.body.appendChild(splash);

    await celebrate('burst');
    await playSound('victory');

    setTimeout(() => {
        splash.style.transition = 'opacity 1s, transform 1s';
        splash.style.opacity = '0';
        splash.style.transform = 'translate(-50%, -60%) scale(0.8)';
        setTimeout(() => splash.remove(), 1000);
    }, 3000);
}

/**
 * Card swipe animation for Flashcard mode
 * @param {HTMLElement} target 
 * @param {string} direction - 'left' or 'right'
 * @returns {Promise}
 */
export async function animateCardSwipe(target, direction) {
    await ensureInit();
    if (!anime || !target) return;

    const xMove = direction === 'right' ? 500 : -500;
    const rotation = direction === 'right' ? 30 : -30;

    return anime({
        targets: target,
        translateX: xMove,
        rotate: rotation,
        opacity: 0,
        duration: 400,
        easing: 'easeInCubic'
    }).finished;
}

/**
 * Triggers a vibration pattern on mobile devices
 * @param {string|number|Array} pattern - 'success', 'error', or a custom array
 */
export function vibrate(pattern) {
    if (!navigator.vibrate) return;

    if (pattern === 'success') {
        navigator.vibrate(50); // Single short vibration
    } else if (pattern === 'error') {
        navigator.vibrate([100, 50, 100]); // Two short vibrations
    } else {
        navigator.vibrate(pattern);
    }
}
