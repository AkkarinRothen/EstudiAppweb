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

/**
 * Calculates a word-specific difficulty modifier based on its SRS box.
 * Lower box (1-2) means not well learned -> gives a negative modifier (slower/easier speed).
 * Higher box (4-5) means well learned -> gives a positive modifier (faster/harder speed).
 * @param {string} packId 
 * @param {string} wordKey 
 * @returns {number} Modifier between -0.3 and 0.3
 */
export function getWordDifficultyModifier(packId, wordKey) {
    if (!packId || !wordKey) return 0;

    // Normalize packId (in case it is a CSV custom deck or raw ID)
    const normalizedPackId = packId.startsWith('csv_') 
        ? packId 
        : "csv_" + packId.toLowerCase().replace(/[^a-z0-9]/g, "_");

    const srsData = Storage.getSrsData() || {};
    const packSrs = srsData[normalizedPackId] || {};
    const entry = packSrs[wordKey];
    
    // Default to box 1 if never reviewed
    const box = entry ? entry.box : 1;
    
    // Map box [1..5] to modifier [-0.3..0.3]
    const boxModifiers = {
        1: -0.3,
        2: -0.15,
        3: 0.0,
        4: 0.15,
        5: 0.3
    };
    
    return boxModifiers[box] || 0;
}

/**
 * Combines the game's overall score-based difficulty factor with the specific word's SRS modifier.
 * Clamps the resulting factor between 0.0 (easiest) and 1.0 (hardest).
 */
export function getCombinedDifficultyFactor(currentScore = 0, packId = '', wordKey = '') {
    const baseFactor = getDifficultyFactor(currentScore);
    const wordModifier = getWordDifficultyModifier(packId, wordKey);
    return Math.max(0.0, Math.min(1.0, baseFactor + wordModifier));
}
