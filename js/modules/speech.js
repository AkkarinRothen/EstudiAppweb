// Text-to-Speech (TTS) Module
import * as Storage from './storage.js';

let ttsVoices = [];

/**
 * Initializes TTS controls and populates voice selection
 * @param {HTMLSelectElement} selectEl 
 * @param {HTMLInputElement} sliderEl 
 * @param {HTMLElement} labelEl 
 */
export function initTtsControls(selectEl, sliderEl, labelEl) {
    if (!selectEl) return;
    
    function populateVoices() {
        ttsVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
        selectEl.innerHTML = '<option value="">Voz predeterminada (Inglés)</option>';
        ttsVoices.forEach((voice, index) => {
            const opt = document.createElement('option');
            opt.value = index;
            opt.innerText = `${voice.name} (${voice.lang})`;
            selectEl.appendChild(opt);
        });
        
        loadTtsPreferences(selectEl, sliderEl, labelEl);
    }
    
    populateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = populateVoices;
    }
}

/**
 * Speaks the provided text
 * @param {string} text 
 * @param {HTMLSelectElement} selectEl 
 * @param {HTMLInputElement} sliderEl 
 */
export function speak(text, selectEl, sliderEl) {
    if (!text) return;
    const textToSpeak = text.split('/')[0].split(';')[0].trim();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    if (selectEl && selectEl.value !== "" && ttsVoices[selectEl.value]) {
        utterance.voice = ttsVoices[selectEl.value];
    }
    if (sliderEl) {
        utterance.rate = parseFloat(sliderEl.value);
    } else {
        utterance.rate = 1.0;
    }
    
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
}

/**
 * Saves TTS preferences to storage
 * @param {string} voiceIndex 
 * @param {string} speed 
 */
export function saveTtsPreferences(voiceIndex, speed) {
    Storage.saveTtsPreferences({ voiceIndex, speed });
}

/**
 * Loads TTS preferences and updates UI
 * @param {HTMLSelectElement} selectEl 
 * @param {HTMLInputElement} sliderEl 
 * @param {HTMLElement} labelEl 
 */
function loadTtsPreferences(selectEl, sliderEl, labelEl) {
    const pref = Storage.getTtsPreferences();
    if (pref) {
        if (selectEl) selectEl.value = pref.voiceIndex;
        if (sliderEl) sliderEl.value = pref.speed;
        if (labelEl) labelEl.innerText = parseFloat(pref.speed).toFixed(1) + "x";
    }
}
