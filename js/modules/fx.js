// Effects and Animations Module
// Centralizes the use of external lightweight libraries for FX

// CDN Imports for ES6 compatibility
import confetti from 'https://cdn.skypack.dev/canvas-confetti';
import { Howl } from 'https://cdn.skypack.dev/howler';
import anime from 'https://cdn.skypack.dev/animejs@3.2.1';

// Sound Manager
const sounds = {
    success: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'], volume: 0.5 }),
    error: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'], volume: 0.3 }),
    click: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], volume: 0.2 }),
    transition: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/2571/2568-preview.mp3'], volume: 0.2 }),
    victory: new Howl({ src: ['https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'], volume: 0.6 })
};

/**
 * Plays a predefined sound effect
 * @param {string} key - 'success', 'error', 'click', 'transition', 'victory'
 */
export function playSound(key) {
    if (sounds[key]) sounds[key].play();
}

/**
 * Triggers a confetti celebration
 * @param {string} mode - 'simple', 'burst', 'side'
 */
export function celebrate(mode = 'simple') {
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
export function animate(target, params) {
    return anime({
        targets: target,
        ...params
    });
}

/**
 * Standard entrance animation for cards/modals
 * @param {string|HTMLElement} target 
 */
export function animateEntrance(target) {
    return anime({
        targets: target,
        translateY: [20, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutElastic(1, .8)'
    });
}

/**
 * Shake animation for errors
 * @param {string|HTMLElement} target 
 */
export function shake(target) {
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
