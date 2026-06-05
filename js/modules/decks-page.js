// Decks Page Module — Unified deck management (official + custom)
import * as Storage from './storage.js';

let allOfficialPacks = [];
let currentFilter = 'Todos';
let currentQuery = '';

// ─── Callbacks ────────────────────────────────────────────────────────────────

let _onOpenCustomDeck = null;
let _onDeleteCustomDeck = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads official packs from JSON and renders the unified grid.
 * @param {Function} onOpenCustomDeck  Called with deckData when a CSV deck card is clicked
 * @param {Function} onDeleteCustomDeck Called with deckId when delete is triggered
 */
export async function init(onOpenCustomDeck, onDeleteCustomDeck) {
    _onOpenCustomDeck = onOpenCustomDeck;
    _onDeleteCustomDeck = onDeleteCustomDeck;

    try {
        const res = await fetch('data/packs.json');
        allOfficialPacks = await res.json();
    } catch (e) {
        console.error('Error loading packs.json:', e);
        allOfficialPacks = [];
    }

    setupFilters();
    setupSearch();
    renderAll();
    updateGlobalStats();
}

/** Re-renders the grid (call after custom deck changes). */
export function refresh() {
    renderAll();
    updateGlobalStats();
}

// ─── Filter & Search ──────────────────────────────────────────────────────────

function setupSearch() {
    const input = document.getElementById('decksSearchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        currentQuery = input.value.toLowerCase().trim();
        renderAll();
    });
}

function setupFilters() {
    const chips = document.querySelectorAll('.decks-filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.dataset.filter;
            renderAll();
        });
    });
}

// ─── Render ───────────────────────────────────────────────────────────────────

function renderAll() {
    renderOfficialSection();
    renderCustomSection();
    checkEmptyState();
}

function renderOfficialSection() {
    const grid = document.getElementById('officialGrid');
    if (!grid) return;

    const srsData = Storage.getSrsData();

    // Filter: hide whole section if "Personalizados" selected
    const officialSection = document.getElementById('officialSection');
    if (currentFilter === 'Personalizados') {
        if (officialSection) officialSection.style.display = 'none';
        return;
    }
    if (officialSection) officialSection.style.display = 'block';

    grid.innerHTML = '';

    const packs = allOfficialPacks.filter(p => {
        const matchesLevel = currentFilter === 'Todos' || p.level === currentFilter;
        const matchesQuery = !currentQuery ||
            p.title.toLowerCase().includes(currentQuery) ||
            p.desc.toLowerCase().includes(currentQuery) ||
            p.category.toLowerCase().includes(currentQuery);
        return matchesLevel && matchesQuery;
    });

    if (packs.length === 0) {
        grid.innerHTML = '<p class="decks-empty-inline">No hay packs que coincidan.</p>';
        return;
    }

    packs.forEach((pack, index) => {
        const { percent, encountered } = computePackStats(pack.id, srsData);
        const card = document.createElement('a');
        card.href = pack.file;
        card.className = 'deck-card';
        card.setAttribute('data-level', pack.level);
        card.style.animationDelay = `${index * 40}ms`;
        card.innerHTML = buildOfficialCardHTML(pack, percent, encountered);
        grid.appendChild(card);
    });
}

function renderCustomSection() {
    const grid = document.getElementById('customDeckGrid');
    const section = document.getElementById('customDeckSection');
    if (!grid || !section) return;

    const customDecks = Storage.getCustomDecks();
    const srsData = Storage.getSrsData();

    // Filter: show only personalizados or hide section if level filter active
    if (currentFilter !== 'Todos' && currentFilter !== 'Personalizados') {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    grid.innerHTML = '';

    const filtered = customDecks.filter(deck => {
        if (!currentQuery) return true;
        return deck.title.toLowerCase().includes(currentQuery) ||
               (deck.desc || '').toLowerCase().includes(currentQuery);
    });

    if (filtered.length === 0) {
        if (currentFilter === 'Personalizados') {
            grid.innerHTML = buildCustomEmptyState();
        } else {
            grid.innerHTML = '';
            section.style.display = 'none';
        }
        return;
    }

    filtered.forEach((deck, index) => {
        const packId = 'csv_' + deck.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const { percent, encountered } = computePackStats(packId, srsData);
        const wordCount = deck.entries ? deck.entries.length : 0;

        const card = document.createElement('div');
        card.className = 'deck-card deck-card--custom';
        card.style.animationDelay = `${index * 40}ms`;
        card.innerHTML = buildCustomCardHTML(deck, percent, encountered, wordCount);
        grid.appendChild(card);

        // Clickable area
        const clickArea = card.querySelector('.deck-card-click');
        if (clickArea && _onOpenCustomDeck) {
            clickArea.addEventListener('click', () => _onOpenCustomDeck(deck));
        }

        // Delete button
        const delBtn = card.querySelector('.deck-delete-btn');
        if (delBtn && _onDeleteCustomDeck) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _onDeleteCustomDeck(deck.id);
            });
        }
    });
}

function checkEmptyState() {
    const noResults = document.getElementById('decksNoResults');
    if (!noResults) return;
    const srsData = Storage.getSrsData();
    const customDecks = Storage.getCustomDecks();

    const hasOfficials = allOfficialPacks.some(p => {
        if (currentFilter === 'Personalizados') return false;
        const matchesLevel = currentFilter === 'Todos' || p.level === currentFilter;
        const matchesQuery = !currentQuery ||
            p.title.toLowerCase().includes(currentQuery) ||
            p.desc.toLowerCase().includes(currentQuery);
        return matchesLevel && matchesQuery;
    });

    const hasCustom = customDecks.some(d => {
        if (currentFilter !== 'Todos' && currentFilter !== 'Personalizados') return false;
        if (!currentQuery) return true;
        return d.title.toLowerCase().includes(currentQuery) ||
               (d.desc || '').toLowerCase().includes(currentQuery);
    });

    noResults.style.display = (!hasOfficials && !hasCustom) ? 'flex' : 'none';
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function computePackStats(packId, srsData) {
    let encountered = 0;
    let mastered = 0;
    const packSrs = srsData[packId];
    if (packSrs) {
        Object.values(packSrs).forEach(info => {
            encountered++;
            if (info.box === 5) mastered++;
        });
    }
    const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;
    return { percent, encountered, mastered };
}

function updateGlobalStats() {
    const stats = Storage.getStats();
    const srsData = Storage.getSrsData();

    let totalEncountered = 0;
    let totalMastered = 0;
    Object.values(srsData).forEach(packSrs => {
        Object.values(packSrs).forEach(info => {
            totalEncountered++;
            if (info.box === 5) totalMastered++;
        });
    });

    const masteryPercent = totalEncountered > 0
        ? Math.round((totalMastered / totalEncountered) * 100) : 0;

    const streakEl = document.getElementById('decksStatStreak');
    const dominioEl = document.getElementById('decksStatDominio');
    const progressEl = document.getElementById('decksStatProgress');
    const repasoEl = document.getElementById('decksStatRepasos');
    const totalDecksEl = document.getElementById('decksStatTotal');

    if (streakEl) streakEl.textContent = `🔥 ${stats.streak} ${stats.streak === 1 ? 'día' : 'días'}`;
    if (dominioEl) dominioEl.textContent = `${masteryPercent}%`;
    if (progressEl) progressEl.style.width = `${masteryPercent}%`;
    if (repasoEl) repasoEl.textContent = stats.totalReviews;
    if (totalDecksEl) {
        const customCount = Storage.getCustomDecks().length;
        totalDecksEl.textContent = allOfficialPacks.length + customCount;
    }
}

// ─── HTML Builders ────────────────────────────────────────────────────────────

function buildOfficialCardHTML(pack, percent, encountered) {
    const reviewedLabel = encountered > 0
        ? `${encountered} palabras revisadas`
        : 'Sin iniciar';

    return `
        <div class="deck-card-type deck-card-type--official">Oficial</div>
        <div class="deck-card-body">
            <div class="deck-card-header">
                <h3>${pack.title}</h3>
                <span class="level-badge level-${pack.level.toLowerCase()}">${pack.level}</span>
            </div>
            <p class="deck-card-desc">${pack.desc}</p>
            <div class="deck-card-meta">
                <span class="deck-meta-category">${pack.category}</span>
                <span class="deck-meta-reviewed">${reviewedLabel}</span>
            </div>
            <div class="deck-progress-row">
                <span class="deck-progress-label">Dominio SRS</span>
                <span class="deck-progress-pct">${percent}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
        </div>
        <div class="deck-card-footer">
            <span class="deck-btn-open">Practicar →</span>
        </div>
    `;
}

function buildCustomCardHTML(deck, percent, encountered, wordCount) {
    const reviewedLabel = encountered > 0
        ? `${encountered} palabras revisadas`
        : 'Sin iniciar';

    const wordLabel = wordCount > 0 ? `${wordCount} palabras` : '';

    return `
        <div class="deck-card-type deck-card-type--custom">Personalizado</div>
        <div class="deck-card-body deck-card-click" style="cursor:pointer">
            <div class="deck-card-header">
                <h3>${deck.title}</h3>
                <button class="deck-delete-btn" title="Eliminar mazo">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            <p class="deck-card-desc">${deck.desc || 'Mazo personalizado guardado.'}</p>
            <div class="deck-card-meta">
                <span class="deck-meta-category">${wordLabel}</span>
                <span class="deck-meta-reviewed">${reviewedLabel}</span>
            </div>
            <div class="deck-progress-row">
                <span class="deck-progress-label">Dominio SRS</span>
                <span class="deck-progress-pct">${percent}%</span>
            </div>
            <div class="progress-container">
                <div class="progress-fill" style="width:${percent}%"></div>
            </div>
        </div>
        <div class="deck-card-footer deck-card-click" style="cursor:pointer">
            <span class="deck-btn-open">Practicar →</span>
        </div>
    `;
}

function buildCustomEmptyState() {
    return `
        <div class="decks-empty-state" id="decksEmptyCustom">
            <div class="decks-empty-icon">📂</div>
            <h3>Aún no tenés mazos personalizados</h3>
            <p>Importá un archivo CSV desde el portal principal o desde la app de EstudiApp para crear tu primer mazo.</p>
            <a href="index.html" class="decks-empty-cta">← Ir al Portal</a>
        </div>
    `;
}
