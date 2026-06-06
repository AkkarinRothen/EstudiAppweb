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
        .replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()]/g, "")      // remove punctuation
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

/**
 * Extracts the most meaningful single keyword from a vocabulary phrase for image search.
 * Removes common English and Spanish stopwords (articles, prepositions, auxiliary verbs, etc.)
 * and returns the longest remaining word, which is most likely a content noun or verb.
 *
 * Examples:
 *   "A table for two"     → "table"
 *   "Still water"         → "water"
 *   "To order food"       → "order"
 *   "I am a vegetarian"   → "vegetarian"
 *   "The check, please"   → "check"
 *
 * @param {string} phrase - The English (or Spanish) translation phrase
 * @returns {string} A single lowercase keyword suitable for an image API query
 */
export function extractImageKeyword(phrase) {
    if (!phrase) return "";
    
    // Normalize: lowercase, remove punctuation, collapse spaces
    const normalized = phrase
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    // Common English stopwords to strip
    const EN_STOPWORDS = new Set([
        "a","an","the","this","that","these","those",
        "i","you","he","she","it","we","they","me","him","her","us","them",
        "my","your","his","its","our","their",
        "is","am","are","was","were","be","been","being",
        "have","has","had","do","does","did","will","would","could","should","may","might","shall","can",
        "to","of","in","on","at","by","for","with","about","from","into","through","during",
        "before","after","above","below","between","out","off","over","under","again","further",
        "then","once","here","there","where","why","how","all","both","each","few","more","most",
        "other","some","such","no","nor","not","only","same","so","than","too","very","just",
        "and","but","or","as","if","when","up","please","still","any","let","get","go","give","put"
    ]);

    // Common Spanish stopwords to strip
    const ES_STOPWORDS = new Set([
        "el","la","los","las","un","una","unos","unas",
        "de","del","al","en","con","por","para","sin","sobre","entre","hasta","desde","hacia","como","que","si",
        "yo","tu","él","ella","nosotros","ellos","me","te","se","nos","lo","le","les",
        "es","son","era","fue","ser","estar","hay","he","has","ha","han",
        "y","o","pero","sino","aunque","porque","cuando","donde","como","que","si","muy","mas","ya","no","ni",
        "mi","tu","su","nuestro","vuestro","su","este","ese","aquel","esta","esa"
    ]);

    const words = normalized.split(" ").filter(w => w.length > 0);

    // Filter out stopwords from both languages
    const contentWords = words.filter(w => !EN_STOPWORDS.has(w) && !ES_STOPWORDS.has(w));

    // Return the longest content word (most likely a meaningful noun or verb)
    const candidates = contentWords.length > 0 ? contentWords : words;
    candidates.sort((a, b) => b.length - a.length);

    return candidates[0] || "";
}

/**
 * Parses a dice formula (e.g., "1d6") and returns a random roll result.
 * @param {string} formula 
 * @returns {number}
 */
export function rollDice(formula) {
    if (!formula) return 1;
    const parts = formula.toLowerCase().split('d');
    const count = parseInt(parts[0]) || 1;
    const faces = parseInt(parts[1]) || 6;
    let total = 0;
    for (let i = 0; i < count; i++) {
        total += Math.floor(Math.random() * faces) + 1;
    }
    return total;
}

/**
 * Compares two strings robustly by cleaning them first.
 * @param {string} a 
 * @param {string} b 
 * @returns {boolean}
 */
export function compareText(a, b) {
    return cleanText(a) === cleanText(b);
}

/**
 * Smoothly animates a numerical counter on an element

 * @param {HTMLElement} element 
 * @param {number} start 
 * @param {number} end 
 * @param {number} duration ms
 * @param {string} prefix 
 * @param {string} suffix 
 */
export function animateCounter(element, start, end, duration = 800, prefix = '', suffix = '') {
    if (!element) return;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out quad
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.round(start + (end - start) * easeProgress);
        
        element.textContent = `${prefix}${currentValue}${suffix}`;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

