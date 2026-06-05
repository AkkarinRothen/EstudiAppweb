// Storage and Statistics Management Module

export const STORAGE_KEYS = {
    SRS_DATA: 'estudiapp_srs_data',
    STATS: 'estudiapp_stats',
    CUSTOM_DECKS: 'estudiapp_custom_decks',
    TTS_PREF: 'estudiapp_tts_pref',
    GH_OWNER: 'gh_owner',
    GH_REPO: 'gh_repo',
    GH_TOKEN: 'gh_token'
};

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
}
