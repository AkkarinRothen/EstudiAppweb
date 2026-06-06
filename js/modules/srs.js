// Spaced Repetition System (SRS) Logic Module
import { getSrsData, saveSrsData } from './storage.js';
import { AppStore } from './state.js';

/**
 * Validates and resets the study streak if the user missed a day.
 * @returns {Object} Updated stats
 */
export function validateStreak() {
    let stats = AppStore.state.stats;
    if (!stats.lastStudyDate) {
        if (stats.streak !== 0) {
            stats.streak = 0;
        }
        return stats;
    }
    
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (stats.lastStudyDate !== todayStr) {
        const lastDate = new Date(stats.lastStudyDate + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        const diffTime = Math.abs(today - lastDate);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            stats.streak = 0;
        }
    }
    return stats;
}

/**
 * Records a study attempt and updates global statistics
 * @param {boolean} isCorrect 
 */
export function recordSrsAttempt(isCorrect) {
    let stats = AppStore.state.stats;
    stats.totalReviews++;
    if (isCorrect) stats.totalCorrect++;

    // Calculate Streak
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (stats.lastStudyDate !== todayStr) {
        if (stats.lastStudyDate) {
            const lastDate = new Date(stats.lastStudyDate + 'T00:00:00');
            const today = new Date(todayStr + 'T00:00:00');
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                stats.streak++;
            } else if (diffDays > 1) {
                stats.streak = 1;
            }
        } else {
            stats.streak = 1;
        }
        stats.lastStudyDate = todayStr;
    }
    // Proxy handles save
}

/**
 * Updates the SRS status for a specific word
 */
export function updateWordSrs(packId, wordKey, isCorrect) {
    if (!packId || !wordKey) return;
    let srsData = getSrsData();
    if (!srsData[packId]) srsData[packId] = {};
    if (!srsData[packId][wordKey]) {
        srsData[packId][wordKey] = { box: 1, nextReview: 0, lastAttempt: 0 };
    }
    
    let entry = srsData[packId][wordKey];
    entry.lastAttempt = Date.now();
    
    if (isCorrect) {
        entry.box = Math.min(5, entry.box + 1);
    } else {
        entry.box = 1;
    }
    
    // Set nextReview intervals
    let interval = 60 * 1000; // 1 min
    if (entry.box === 2) interval = 10 * 60 * 1000;
    else if (entry.box === 3) interval = 60 * 60 * 1000;
    else if (entry.box === 4) interval = 24 * 60 * 60 * 1000;
    else if (entry.box === 5) interval = 4 * 24 * 60 * 60 * 1000;
    
    entry.nextReview = Date.now() + interval;
    saveSrsData(srsData);
    
    recordSrsAttempt(isCorrect);
}

/**
 * Helper to select an entry randomly but weighted by the SRS box (lower box = higher weight)
 * @param {Array} candidates 
 * @param {Object} srsData 
 * @returns {Object}
 */
function weightedRandomSelect(candidates, srsData) {
    if (candidates.length === 0) return null;
    
    const weightedCandidates = candidates.map(entry => {
        const wordKey = entry.text.split("->")[0].trim();
        const srsInfo = srsData[wordKey];
        const box = srsInfo ? srsInfo.box : 1; // Default to box 1 if never reviewed
        const weight = 6 - box; // Box 1 = 5, Box 2 = 4, Box 3 = 3, Box 4 = 2, Box 5 = 1
        return { entry, weight };
    });
    
    const totalWeight = weightedCandidates.reduce((sum, item) => sum + item.weight, 0);
    let randomVal = Math.random() * totalWeight;
    
    for (const item of weightedCandidates) {
        randomVal -= item.weight;
        if (randomVal <= 0) {
            return item.entry;
        }
    }
    return candidates[0]; // Fallback
}

/**
 * Logic to select the next entry using SRS weights and avoiding consecutive repeats
 * @param {Object} tableData 
 * @param {string} [excludeWordKey] Word key to avoid selecting consecutively
 * @returns {Object|null}
 */
export function selectNextSrsEntry(tableData, excludeWordKey) {
    if (!tableData || tableData.entries.length === 0) return null;
    const packId = "csv_" + tableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const srsData = getSrsData()[packId] || {};
    
    // 1. Filter out consecutive repeat if there are multiple entries
    let filteredEntries = tableData.entries;
    if (excludeWordKey && tableData.entries.length > 1) {
        filteredEntries = tableData.entries.filter(entry => {
            const wordKey = entry.text.split("->")[0].trim();
            return wordKey !== excludeWordKey;
        });
    }
    
    // 2. Classify filtered entries
    const dueOrUnseen = [];
    filteredEntries.forEach(entry => {
        const wordKey = entry.text.split("->")[0].trim();
        const srsInfo = srsData[wordKey];
        
        if (!srsInfo || srsInfo.nextReview <= Date.now()) {
            dueOrUnseen.push(entry);
        }
    });
    
    // 3. Selection
    if (dueOrUnseen.length > 0) {
        return weightedRandomSelect(dueOrUnseen, srsData);
    } else {
        return weightedRandomSelect(filteredEntries, srsData);
    }
}
