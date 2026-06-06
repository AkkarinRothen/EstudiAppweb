// Storage and Statistics Management Module

let onSaveCallback = null;

export function registerOnSave(callback) {
    onSaveCallback = callback;
}

function triggerSave() {
    if (onSaveCallback) onSaveCallback();
}


export const STORAGE_KEYS = {
    SRS_DATA: 'estudiapp_srs_data',
    STATS: 'estudiapp_stats',
    PROGRESSION: 'estudiapp_progression',
    DIFFICULTY: 'estudiapp_difficulty',
    HIGH_SCORES: 'estudiapp_high_scores',
    CUSTOM_DECKS: 'estudiapp_custom_decks',
    TTS_PREF: 'estudiapp_tts_pref',
    GH_OWNER: 'gh_owner',
    GH_REPO: 'gh_repo',
    GH_TOKEN: 'gh_token',
    ADMIN_FOLDERS: 'admin_folders_state',
    ADMIN_MAPPINGS: 'admin_mappings_state',
    ADMIN_ORDER: 'admin_resource_order',
    PACK_OVERRIDES: 'pack_overrides'
};

export function getAdminState() {
    return {
        folders: JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_FOLDERS)),
        mappings: JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_MAPPINGS)),
        order: JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_ORDER)),
        overrides: JSON.parse(localStorage.getItem(STORAGE_KEYS.PACK_OVERRIDES))
    };
}

export function saveAdminFolders(folders) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_FOLDERS, JSON.stringify(folders));
}

export function saveAdminMappings(mappings) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_MAPPINGS, JSON.stringify(mappings));
}

export function saveAdminOrder(order) {
    localStorage.setItem(STORAGE_KEYS.ADMIN_ORDER, JSON.stringify(order));
}

export function savePackOverrides(overrides) {
    localStorage.setItem(STORAGE_KEYS.PACK_OVERRIDES, JSON.stringify(overrides));
}

export function clearAdminState() {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_FOLDERS);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_MAPPINGS);
}

export function getGitHubConfig() {
    return {
        owner: localStorage.getItem(STORAGE_KEYS.GH_OWNER),
        repo: localStorage.getItem(STORAGE_KEYS.GH_REPO)
    };
}

export function getDifficultySettings() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.DIFFICULTY));
    } catch (e) {
        return null;
    }
}

export function saveDifficultySettings(settings) {
    localStorage.setItem(STORAGE_KEYS.DIFFICULTY, JSON.stringify(settings));
    triggerSave();
}

export function getProgression() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESSION)) || { xp: 0, level: 1, achievements: [] };
    } catch (e) {
        return { xp: 0, level: 1, achievements: [] };
    }
}

export function saveProgression(data) {
    localStorage.setItem(STORAGE_KEYS.PROGRESSION, JSON.stringify(data));
    triggerSave();
}

export function getSrsData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.SRS_DATA)) || {};
    } catch (e) {
        console.error('Error reading SRS data:', e);
        return {};
    }
}

export function saveSrsData(data) {
    localStorage.setItem(STORAGE_KEYS.SRS_DATA, JSON.stringify(data));
    triggerSave();
}

export function getStats() {
    try {
        let stats = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATS));
        if (!stats) {
            stats = { streak: 0, lastStudyDate: null, totalReviews: 0, totalCorrect: 0 };
        }
        return stats;
    } catch (e) {
        return { streak: 0, lastStudyDate: null, totalReviews: 0, totalCorrect: 0 };
    }
}

export function saveStats(stats) {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    triggerSave();
}

export function getCustomDecks() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_DECKS)) || [];
    } catch (e) {
        return [];
    }
}

export function saveCustomDecks(decks) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DECKS, JSON.stringify(decks));
    triggerSave();
}

export function getTtsPreferences() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.TTS_PREF));
    } catch (e) {
        return null;
    }
}

export function saveTtsPreferences(pref) {
    localStorage.setItem(STORAGE_KEYS.TTS_PREF, JSON.stringify(pref));
    triggerSave();
}

// In-Memory Session Password (not persisted)
let sessionPassword = "";

export function setSessionPassword(pass) {
    sessionPassword = pass;
}

export function getSessionPassword() {
    return sessionPassword;
}

export async function getDecryptedToken() {
    const encryptedToken = localStorage.getItem('gh_token_encrypted');
    if (!encryptedToken || !sessionPassword) return null;
    return await decryptText(encryptedToken, sessionPassword);
}

// AES-GCM Cryptography Helpers for Sensitive Data
async function getCryptoKey(password) {
    const enc = new TextEncoder();
    const pwHash = await crypto.subtle.digest('SHA-256', enc.encode(password));
    return crypto.subtle.importKey(
        'raw',
        pwHash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encryptText(plaintext, password) {
    try {
        const enc = new TextEncoder();
        const key = await getCryptoKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            enc.encode(plaintext)
        );
        const cipherTextBytes = new Uint8Array(encrypted);
        
        const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
        const cipherHex = Array.from(cipherTextBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        return ivHex + ":" + cipherHex;
    } catch (e) {
        console.error("Encryption error:", e);
        return null;
    }
}

export async function decryptText(ciphertextWithIv, password) {
    try {
        const parts = ciphertextWithIv.split(":");
        if (parts.length !== 2) return null;
        
        const ivHex = parts[0];
        const cipherHex = parts[1];
        
        const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const ciphertext = new Uint8Array(cipherHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        
        const key = await getCryptoKey(password);
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            ciphertext
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption error:", e);
        return null;
    }
}

export function getHighScores() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.HIGH_SCORES)) || {};
    } catch (e) {
        return {};
    }
}

export function saveHighScores(scores) {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORES, JSON.stringify(scores));
    triggerSave();
}

export function getHighScore(packId, gameId) {
    const scores = getHighScores();
    return scores[`${packId}_${gameId}`] || 0;
}

export function saveHighScore(packId, gameId, score) {
    try {
        const scores = getHighScores();
        const key = `${packId}_${gameId}`;
        const currentBest = scores[key] || 0;
        if (score > currentBest) {
            scores[key] = score;
            saveHighScores(scores);
            return true; // New record!
        }
        return false;
    } catch (e) {
        return false;
    }
}
