// Spaced Repetition System (SRS) Logic Module
import { getSrsData, saveSrsData, getStats, saveStats } from './storage.js';

/**
 * Records a study attempt and updates global statistics
 * @param {boolean} isCorrect 
 * @param {Function} onUpdateStatsUI Callback to refresh UI
 */
export function recordSrsAttempt(isCorrect, onUpdateStatsUI) {
    let stats = getStats();
    stats.totalReviews++;
    if (isCorrect) stats.totalCorrect++;

    // Calculate Streak
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    if (stats.lastStudyDate !== todayStr) {
        if (stats.lastStudyDate) {
            const lastDate = new Date(stats.lastStudyDate);
            const today = new Date(todayStr);
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
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
    saveStats(stats);
    if (onUpdateStatsUI) onUpdateStatsUI();
}

/**
 * Updates the SRS status for a specific word
 * @param {string} packId 
 * @param {string} wordKey 
 * @param {boolean} isCorrect 
 * @param {Function} onUpdateStatsUI 
 */
export function updateWordSrs(packId, wordKey, isCorrect, onUpdateStatsUI) {
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
    let interval = 60 * 1000; // 1 min (box 1)
    if (entry.box === 2) interval = 10 * 60 * 1000; // 10 mins
    else if (entry.box === 3) interval = 60 * 60 * 1000; // 1 hour
    else if (entry.box === 4) interval = 24 * 60 * 60 * 1000; // 1 day
    else if (entry.box === 5) interval = 4 * 24 * 60 * 60 * 1000; // 4 days
    
    entry.nextReview = Date.now() + interval;
    saveSrsData(srsData);
    
    recordSrsAttempt(isCorrect, onUpdateStatsUI);
}

/**
 * Logic to select the next entry using SRS weights
 * @param {Object} tableData 
 * @returns {Object|null}
 */
export function selectNextSrsEntry(tableData) {
    if (!tableData || tableData.entries.length === 0) return null;
    const packId = "csv_" + tableData.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const srsData = getSrsData()[packId] || {};
    
    let dueEntries = [];
    let neverReviewed = [];
    let lowBoxEntries = [];
    
    tableData.entries.forEach(entry => {
        const parts = entry.text.split("->");
        const wordKey = parts[0].trim();
        const srsInfo = srsData[wordKey];
        
        if (!srsInfo) {
            neverReviewed.push(entry);
        } else if (srsInfo.nextReview <= Date.now()) {
            dueEntries.push(entry);
        } else {
            lowBoxEntries.push({ entry, box: srsInfo.box });
        }
    });
    
    if (dueEntries.length > 0) {
        return dueEntries[Math.floor(Math.random() * dueEntries.length)];
    } else if (neverReviewed.length > 0) {
        return neverReviewed[Math.floor(Math.random() * neverReviewed.length)];
    } else {
        lowBoxEntries.sort((a, b) => a.box - b.box);
        return lowBoxEntries.length > 0 ? lowBoxEntries[0].entry : tableData.entries[Math.floor(Math.random() * tableData.entries.length)];
    }
}
