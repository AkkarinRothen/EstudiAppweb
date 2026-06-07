import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import * as Storage from './storage.js';

const supabaseUrl = 'https://rcouhnowxowyhylmcyoe.supabase.co';
const supabaseKey = 'sb_publishable_eeQxJOUcegmozmwkjsDIQw_tIkznZEG';

export const supabase = createClient(supabaseUrl, supabaseKey);

let isSyncing = false;
let syncTimeout = null;

// ==========================================
// MÉTODOS DE AUTENTICACIÓN
// ==========================================

export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Updates the user's metadata (display name, avatar).
 */
export async function updateProfile(displayName, avatarUrl) {
    const { data, error } = await supabase.auth.updateUser({
        data: { display_name: displayName, avatar_url: avatarUrl }
    });
    if (error) throw error;
    return data.user;
}

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
}

// ==========================================
// MÉTODOS DE SINCRONIZACIÓN DE PROGRESO
// ==========================================

/**
 * Descarga el progreso de la nube y lo persiste localmente.
 */
export async function syncCloudToLocal() {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return false;

        // Sobrescribir almacenamiento local si hay datos remotos válidos
        if (data.srs_data) Storage.saveSrsData(data.srs_data);
        if (data.stats) Storage.saveStats(data.stats);
        if (data.progression) Storage.saveProgression(data.progression);
        if (data.difficulty) Storage.saveDifficultySettings(data.difficulty);
        if (data.high_scores) Storage.saveHighScores(data.high_scores);
        if (data.custom_decks) Storage.saveCustomDecks(data.custom_decks);
        if (data.tts_pref) Storage.saveTtsPreferences(data.tts_pref);

        console.log('☁️ Sincronización nube -> local completada con éxito.');
        return true;
    } catch (e) {
        console.error('Error al descargar progreso de Supabase:', e);
        return false;
    }
}

/**
 * Sube todo el progreso local a la nube.
 */
export async function syncLocalToCloud() {
    if (isSyncing) return;
    isSyncing = true;

    try {
        const user = await getCurrentUser();
        if (!user) {
            isSyncing = false;
            return;
        }

        // Empaquetar todo el estado actual del local storage
        const srs_data = Storage.getSrsData();
        const stats = Storage.getStats();
        const progression = Storage.getProgression();
        const difficulty = Storage.getDifficultySettings();
        const high_scores = Storage.getHighScores();
        const custom_decks = Storage.getCustomDecks();
        const tts_pref = Storage.getTtsPreferences() || {};

        const { error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: user.id,
                srs_data,
                stats,
                progression,
                difficulty,
                high_scores,
                custom_decks,
                tts_pref
            });

        if (error) throw error;
        console.log('☁️ Sincronización local -> nube completada con éxito.');
    } catch (e) {
        console.error('Error al subir progreso a Supabase:', e);
    } finally {
        isSyncing = false;
    }
}

/**
 * Dispara una sincronización local -> nube diferida (debounced)
 * para evitar llamadas repetitivas seguidas a la API.
 */
export function queueAutoSync() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
        syncLocalToCloud();
    }, 2500); // Sincroniza 2.5 segundos después del último cambio
}
