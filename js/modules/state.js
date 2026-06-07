import * as Storage from './storage.js';

/**
 * Native Reactive State Module
 * Implements a lightweight observable store using JS Proxy.
 */

export function createStore(initialState = {}) {
    const listeners = new Set();

    const handler = {
        get(target, prop, receiver) {
            const value = Reflect.get(target, prop, receiver);
            if (typeof value === 'object' && value !== null) {
                return new Proxy(value, handler);
            }
            return value;
        },
        set(target, prop, value, receiver) {
            const oldValue = Reflect.get(target, prop, receiver);
            if (oldValue === value) return true;

            const result = Reflect.set(target, prop, value, receiver);
            listeners.forEach(callback => callback(AppStore.state));
            
            // Auto-persist specific branches
            if (target === AppStore.state) {
                if (prop === 'progression') Storage.saveProgression(value);
                if (prop === 'stats') Storage.saveStats(value);
                if (prop === 'difficulty') Storage.saveDifficultySettings(value);
            } else {
                // If sub-property changed, persist the root branch
                // (This is a simplified check for this project's structure)
                if (AppStore.state.progression === target || Object.values(AppStore.state.progression).includes(target)) {
                    Storage.saveProgression(AppStore.state.progression);
                }
                if (AppStore.state.stats === target || Object.values(AppStore.state.stats).includes(target)) {
                    Storage.saveStats(AppStore.state.stats);
                }
            }

            return result;
        }
    };

    const proxy = new Proxy(initialState, handler);

    return {
        state: proxy,
        subscribe: (callback) => {
            listeners.add(callback);
            return () => listeners.delete(callback);
        }
    };
}

// Create Global Application Store
export const AppStore = createStore({
    progression: Storage.getProgression(),
    stats: Storage.getStats(),
    difficulty: Storage.getDifficultySettings() || { mode: 'progressive', level: 'medium' }
});
