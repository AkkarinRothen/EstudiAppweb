/**
 * Difficulty Manager for EstudiApp
 * Centralizes difficulty logic for games and study modes.
 */

import * as Storage from './storage.js';

export const DIFFICULTY_MODES = {
    LINEAR: 'linear',
    PROGRESSIVE: 'progressive'
};

export const DIFFICULTY_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

const DEFAULT_SETTINGS = {
    mode: DIFFICULTY_MODES.PROGRESSIVE,
    level: DIFFICULTY_LEVELS.MEDIUM
};

/**
 * Get current difficulty settings.
 */
export function getSettings() {
    return Storage.getDifficultySettings() || DEFAULT_SETTINGS;
}

/**
 * Save difficulty settings.
 */
export function saveSettings(settings) {
    Storage.saveDifficultySettings(settings);
}

/**
 * Calculates a difficulty factor (0.0 to 1.0) based on settings and progress.
 * 0.0 = easiest, 1.0 = hardest.
 * @param {number} currentScore - For progressive mode.
 */
export function getDifficultyFactor(currentScore = 0) {
    const settings = getSettings();
    
    if (settings.mode === DIFFICULTY_MODES.LINEAR) {
        switch (settings.level) {
            case DIFFICULTY_LEVELS.EASY: return 0.2;
            case DIFFICULTY_LEVELS.HARD: return 0.8;
            default: return 0.5;
        }
    } else {
        // Progressive mode: scales from 0.3 to 1.0 based on score
        // Reaches 1.0 difficulty at score 50 (customizable per game)
        return Math.min(1.0, 0.3 + (currentScore * 0.014));
    }
}

/**
 * Helper to get game-specific parameters based on difficulty factor.
 * @param {object} easyParams - Values for min difficulty (0.0).
 * @param {object} hardParams - Values for max difficulty (1.0).
 * @param {number} factor - Current difficulty factor.
 */
export function lerpParams(easyParams, hardParams, factor) {
    const result = {};
    for (const key in easyParams) {
        const min = easyParams[key];
        const max = hardParams[key];
        result[key] = min + (max - min) * factor;
    }
    return result;
}

/**
 * Checks if a mode is a "Study Mode" (difficulty should be disabled).
 */
export function isStudyMode(modeId) {
    const studyModes = ['direct', 'flashcard', 'write', 'dictation'];
    return studyModes.includes(modeId);
}
