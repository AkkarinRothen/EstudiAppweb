// General Purpose Utilities

/**
 * Computes the SHA-256 hash of a string
 * @param {string} message 
 * @returns {Promise<string>}
 */
export async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Clean text for validation
 * @param {string} txt 
 * @returns {string}
 */
export function cleanText(txt) {
    if (!txt) return "";
    return txt.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")      // remove punctuation
        .replace(/\s+/g, " ")                             // normalize spaces
        .trim();
}

/**
 * Simple difference highlight side-by-side helper
 * @param {string} typed 
 * @param {string} correct 
 * @returns {string} HTML markup
 */
export function getDiffHighlight(typed, correct) {
    let html = "";
    const len = Math.max(typed.length, correct.length);
    for (let i = 0; i < len; i++) {
        if (typed[i] === correct[i]) {
            html += typed[i];
        } else {
            if (typed[i]) html += `<span class="diff-del">${typed[i]}</span>`;
            if (correct[i]) html += `<span class="diff-ins">${correct[i]}</span>`;
        }
    }
    return html;
}
