/**
 * Gamification & Progression Module for EstudiApp
 * Handles XP, Levels, and Achievements.
 */

import * as Storage from './storage.js';
import * as Fx from './fx.js';
import { AppStore } from './state.js';

// Configuration
const XP_PER_CORRECT = 10;
const XP_PER_STREAK_BONUS = 5; // Extra XP for each day of streak
const LEVEL_BASE_XP = 100;
const LEVEL_MULTIPLIER = 1.2; // Each level requires 20% more XP than previous

export function getProgression() {
    return AppStore.state.progression;
}

export function saveProgression(data) {
    AppStore.state.progression = data;
}

/**
 * Calculate XP required for a specific level.
 */
export function getXpForLevel(level) {
    if (level === 1) return 0;
    return Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_MULTIPLIER, level - 2));
}

/**
 * Adds XP and handles level ups.
 */
export function addXp(amount) {
    const progression = AppStore.state.progression;
    progression.xp += amount;

    const nextLevelXp = getXpForLevel(progression.level + 1);
    
    if (progression.xp >= nextLevelXp) {
        progression.level++;
        onLevelUp(progression.level);
    }

    // Proxy automatically triggers persistence through state.js subscription
    return progression;
}

function onLevelUp(newLevel) {
    console.log(`🎉 ¡Subida de nivel! Ahora eres Nivel ${newLevel}`);
    Fx.showLevelUp(newLevel);
}

/**
 * Achievement Definitions
 */
const ACHIEVEMENTS = [
    {
        id: 'elite_sniper',
        name: 'Tirador de Élite',
        description: 'Alcanza 50 puntos en el juego Sniper.',
        check: (stats, gameStats) => gameStats.gameId === 'sniper' && gameStats.score >= 50
    },
    {
        id: 'streak_master',
        name: 'Maestro de la Racha',
        description: 'Mantén una racha de 7 días.',
        check: (stats) => stats.streak >= 7
    },
    {
        id: 'polyglot',
        name: 'Políglota Novato',
        description: 'Repasa 100 palabras en total.',
        check: (stats) => stats.totalReviews >= 100
    }
];

/**
 * Checks and unlocks achievements based on recent events.
 */
export function checkAchievements(gameStats = {}) {
    const progression = AppStore.state.progression;
    const stats = AppStore.state.stats;
    let unlockedAny = false;

    ACHIEVEMENTS.forEach(ach => {
        const alreadyHas = progression.achievements.some(a => a.id === ach.id);
        if (!alreadyHas && ach.check(stats, gameStats)) {
            progression.achievements.push({ id: ach.id, date: new Date().toISOString() });
            onAchievementUnlocked(ach);
            unlockedAny = true;
        }
    });

    // Proxy automatically handles save if achievements changed
}

function onAchievementUnlocked(ach) {
    console.log(`🏆 Logro Desbloqueado: ${ach.name}`);
    Fx.celebrate('simple');
}
