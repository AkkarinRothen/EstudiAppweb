/**
 * Simple UI helper for Gamification
 */
import * as Gamification from './gamification.js';

export function renderLevelBadge(container) {
    const prog = Gamification.getProgression();
    const nextXp = Gamification.getXpForLevel(prog.level + 1);
    const prevXp = Gamification.getXpForLevel(prog.level);
    const progressPercent = Math.min(100, Math.floor(((prog.xp - prevXp) / (nextXp - prevXp)) * 100));

    container.innerHTML = `
        <div class="level-badge-container">
            <div class="level-circle">Lvl ${prog.level}</div>
            <div class="xp-bar-outer">
                <div class="xp-bar-inner" style="width: ${progressPercent}%"></div>
            </div>
            <div class="xp-text">${prog.xp} / ${nextXp} XP</div>
        </div>
    `;
}
