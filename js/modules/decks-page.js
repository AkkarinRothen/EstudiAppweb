// Decks Page Module — Unified deck management (official + custom) with folder explorer
import * as Storage from './storage.js';
import { animateCounter } from './utils.js';
import { FOLDERS_CONFIG as DEFAULT_FOLDERS, DECK_FOLDER_MAPPINGS as DEFAULT_MAPPINGS } from './folders-config.js';
import { AppStore } from './state.js';

let allOfficialPacks = [];
let currentFilter = 'Todos';
let currentQuery = '';
let currentFolderId = null; // null represents the root level

// Dynamic config derived from Storage or Defaults
let activeFolders = [];
let activeMappings = {};

// ─── Callbacks ────────────────────────────────────────────────────────────────

let _onOpenCustomDeck = null;
let _onDeleteCustomDeck = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Loads official packs from JSON and renders the unified explorer.
 */
export async function init(onOpenCustomDeck, onDeleteCustomDeck) {
    _onOpenCustomDeck = onOpenCustomDeck;
    _onDeleteCustomDeck = onDeleteCustomDeck;

    console.log('📦 DecksPage: Iniciando explorador...');

    try {
        const res = await fetch('data/packs.json');
        allOfficialPacks = await res.json();
        console.log(`✅ DecksPage: ${allOfficialPacks.length} packs oficiales cargados.`);
    } catch (e) {
        console.error('❌ DecksPage: Error cargando packs.json:', e);
        allOfficialPacks = [];
    }

    // Cargar configuración de carpetas (priorizando Storage si el usuario usó el admin)
    const adminState = Storage.getAdminState();
    activeFolders = adminState.folders || DEFAULT_FOLDERS;
    activeMappings = adminState.mappings || DEFAULT_MAPPINGS;

    setupFilters();
    setupSearch();

    // Suscribirse al AppStore para re-renderizar si cambian las estadísticas o el progreso
    AppStore.subscribe(() => {
        console.log('🔄 DecksPage: Detectado cambio en el estado, refrescando...');
        renderAll();
        updateGlobalStats();
    });

    renderAll();
    updateGlobalStats();
}

/** Re-renders the explorer (call after custom deck changes). */
export function refresh() {
    renderAll();
    updateGlobalStats();
}

// ─── Filter & Search ──────────────────────────────────────────────────────────

function setupSearch() {
    const input = document.getElementById('decksSearchInput') || document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', () => {
        currentQuery = input.value.toLowerCase().trim();
        renderAll();
    });
}

function setupFilters() {
    const chips = document.querySelectorAll('.decks-filter-chip, .filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            let filter = chip.dataset.filter;
            if (!filter) {
                const text = chip.textContent;
                if (text.includes('A1')) filter = 'A1';
                else if (text.includes('A2')) filter = 'A2';
                else if (text.includes('B1')) filter = 'B1';
                else if (text.includes('B2')) filter = 'B2';
                else if (text.includes('Personalizados')) filter = 'Personalizados';
                else filter = 'Todos';
            }

            currentFilter = filter;

            if (currentFilter === 'Personalizados') {
                currentFolderId = 'personalizados';
            } else if (currentFolderId === 'personalizados' && currentFilter !== 'Todos') {
                currentFolderId = null;
            }

            renderAll();
        });
    });
}

// ─── Unified Render Logic ─────────────────────────────────────────────────────

function renderAll() {
    const isSearchActive = currentQuery.length > 0;
    const isFilterActive = currentFilter !== 'Todos' && currentFilter !== 'Personalizados';

    if (isSearchActive || isFilterActive) {
        renderFlattened();
    } else {
        renderExplorer();
    }
}

// ─── Explorer Mode: Folders + Decks ──────────────────────────────────────────

function renderExplorer() {
    const grid = document.getElementById('explorerGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const breadcrumbs = document.getElementById('explorerBreadcrumbs');
    const srsData = Storage.getSrsData();

    renderBreadcrumbs(breadcrumbs);

    // 1. Filtrar subcarpetas
    const currentFolders = activeFolders.filter(f => f.parentId === currentFolderId);

    // 2. Obtener mazos en la carpeta actual
    const { officialList, customList } = getDecksForFolder(currentFolderId);

    const totalItems = currentFolders.length + officialList.length + customList.length;

    if (totalItems === 0) {
        if (currentFolderId === 'personalizados') {
            grid.innerHTML = buildCustomEmptyState();
        } else {
            grid.innerHTML = '<p class="decks-empty-inline">Esta carpeta está vacía.</p>';
        }
        showNoResultsState(false);
        return;
    }

    showNoResultsState(false);
    let elementIndex = 0;

    // 3. Renderizar Carpetas
    currentFolders.forEach(folder => {
        const counts = getFolderContentsCount(folder.id);
        const countLabel = formatFolderContentsLabel(counts);
        const folderWrapper = document.createElement('div');
        folderWrapper.innerHTML = buildFolderCardHTML(folder, countLabel);

        const element = folderWrapper.firstElementChild;
        element.style.setProperty('--i', elementIndex);
        element.style.animationDelay = `${elementIndex * 30}ms`;
        grid.appendChild(element);

        element.addEventListener('click', () => {
            currentFolderId = folder.id;

            const chips = document.querySelectorAll('.decks-filter-chip, .filter-chip');
            chips.forEach(c => {
                c.classList.remove('active');

                let isPersonalizados = (c.dataset.filter === 'Personalizados' || c.textContent.includes('Personalizados'));
                let isTodos = (c.dataset.filter === 'Todos' || c.textContent.includes('Todos'));

                if (folder.id === 'personalizados' && isPersonalizados) {
                    c.classList.add('active');
                    currentFilter = 'Personalizados';
                } else if (folder.id !== 'personalizados' && isTodos) {
                    c.classList.add('active');
                    currentFilter = 'Todos';
                }
            });

            renderAll();

            const expSec = document.getElementById('explorerSection');
            if (expSec) expSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        elementIndex++;
    });

    // 4. Renderizar Mazos Oficiales
    officialList.forEach(pack => {
        const { percent, encountered, mastered } = computePackStats(pack.id, srsData);
        const card = document.createElement('a');
        card.href = pack.file;
        card.className = 'deck-card';
        card.setAttribute('data-level', pack.level);
        card.style.setProperty('--i', elementIndex);
        card.style.animationDelay = `${elementIndex * 30}ms`;
        card.innerHTML = buildOfficialCardHTML(pack, percent, encountered, mastered);
        grid.appendChild(card);
        elementIndex++;
    });

    // 5. Renderizar Mazos Personalizados
    customList.forEach(deck => {
        const packId = 'csv_' + deck.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const { percent, encountered, mastered } = computePackStats(packId, srsData);
        const wordCount = deck.entries ? deck.entries.length : 0;

        const card = document.createElement('div');
        card.className = 'deck-card deck-card--custom';
        card.style.setProperty('--i', elementIndex);
        card.style.animationDelay = `${elementIndex * 30}ms`;
        card.innerHTML = buildCustomCardHTML(deck, percent, encountered, wordCount, mastered);
        grid.appendChild(card);

        const clickArea = card.querySelector('.deck-card-click');
        if (clickArea && _onOpenCustomDeck) {
            clickArea.addEventListener('click', () => _onOpenCustomDeck(deck));
        }

        const delBtn = card.querySelector('.deck-delete-btn');
        if (delBtn && _onDeleteCustomDeck) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _onDeleteCustomDeck(deck.id);
            });
        }
        elementIndex++;
    });
}

// ─── Flattened Mode ──────────────────────────────────────────────────────────

function renderFlattened() {
    const grid = document.getElementById('explorerGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const srsData = Storage.getSrsData();
    const customDecks = Storage.getCustomDecks();

    let filteredOfficials = [];
    if (currentFilter !== 'Personalizados') {
        filteredOfficials = allOfficialPacks.filter(p => {
            const matchesLevel = currentFilter === 'Todos' || p.level === currentFilter;
            const matchesQuery = !currentQuery ||
                p.title.toLowerCase().includes(currentQuery) ||
                p.desc.toLowerCase().includes(currentQuery) ||
                p.category.toLowerCase().includes(currentQuery);
            return matchesLevel && matchesQuery;
        });
    }

    let filteredCustom = [];
    if (currentFilter === 'Todos' || currentFilter === 'Personalizados') {
        filteredCustom = customDecks.filter(deck => {
            const matchesQuery = !currentQuery ||
                deck.title.toLowerCase().includes(currentQuery) ||
                (deck.desc || '').toLowerCase().includes(currentQuery);
            return matchesQuery;
        });
    }

    const totalCount = filteredOfficials.length + filteredCustom.length;
    const breadcrumbs = document.getElementById('explorerBreadcrumbs');
    if (breadcrumbs) {
        let filterLabel = currentFilter === 'Todos' ? 'Todos los niveles' : `Nivel ${currentFilter}`;
        if (currentFilter === 'Personalizados') filterLabel = 'Mazos Personalizados';

        breadcrumbs.innerHTML = `
            <span class="breadcrumb-item" id="btnBackToExplorer">← Volver al Explorador</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item active">Resultados (${filterLabel}${currentQuery ? `: "${currentQuery}"` : ''})</span>
        `;

        document.getElementById('btnBackToExplorer').onclick = () => {
            const searchInput = document.getElementById('decksSearchInput') || document.getElementById('searchInput');
            if (searchInput) searchInput.value = '';
            currentQuery = '';

            const chips = document.querySelectorAll('.decks-filter-chip, .filter-chip');
            chips.forEach(c => {
                c.classList.remove('active');
                if (c.dataset.filter === 'Todos' || c.textContent.includes('Todos')) c.classList.add('active');
            });
            currentFilter = 'Todos';
            currentFolderId = null;
            renderAll();
        };
    }

    if (totalCount === 0) {
        grid.innerHTML = '<p class="decks-empty-inline">No se encontraron mazos que coincidan con la búsqueda.</p>';
        showNoResultsState(true);
        return;
    }

    showNoResultsState(false);
    let elementIndex = 0;

    filteredOfficials.forEach(pack => {
        const { percent, encountered, mastered } = computePackStats(pack.id, srsData);
        const card = document.createElement('a');
        card.href = pack.file;
        card.className = 'deck-card';
        card.setAttribute('data-level', pack.level);
        card.style.setProperty('--i', elementIndex);
        card.style.animationDelay = `${elementIndex * 30}ms`;
        card.innerHTML = buildOfficialCardHTML(pack, percent, encountered, mastered);
        grid.appendChild(card);
        elementIndex++;
    });

    filteredCustom.forEach(deck => {
        const packId = 'csv_' + deck.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const { percent, encountered, mastered } = computePackStats(packId, srsData);
        const wordCount = deck.entries ? deck.entries.length : 0;

        const card = document.createElement('div');
        card.className = 'deck-card deck-card--custom';
        card.style.setProperty('--i', elementIndex);
        card.style.animationDelay = `${elementIndex * 30}ms`;
        card.innerHTML = buildCustomCardHTML(deck, percent, encountered, wordCount, mastered);
        grid.appendChild(card);

        const clickArea = card.querySelector('.deck-card-click');
        if (clickArea && _onOpenCustomDeck) {
            clickArea.addEventListener('click', () => _onOpenCustomDeck(deck));
        }

        const delBtn = card.querySelector('.deck-delete-btn');
        if (delBtn && _onDeleteCustomDeck) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                _onDeleteCustomDeck(deck.id);
            });
        }
        elementIndex++;
    });
}

// ─── Explorer Helpers ─────────────────────────────────────────────────────────

function renderBreadcrumbs(container) {
    if (!container) return;
    container.innerHTML = '';

    const trail = [{ id: null, title: 'Inicio' }];

    if (currentFolderId !== null) {
        const path = [];
        let current = activeFolders.find(f => f.id === currentFolderId);
        while (current) {
            path.unshift(current);
            current = activeFolders.find(f => f.id === current.parentId);
        }
        trail.push(...path);
    }

    trail.forEach((item, index) => {
        const isLast = index === trail.length - 1;
        const span = document.createElement('span');
        span.className = `breadcrumb-item ${isLast ? 'active' : ''}`;
        span.textContent = item.title;

        if (!isLast) {
            span.addEventListener('click', () => {
                currentFolderId = item.id;

                const chips = document.querySelectorAll('.decks-filter-chip, .filter-chip');
                chips.forEach(c => {
                    c.classList.remove('active');
                    let isPersonalizados = (c.dataset.filter === 'Personalizados' || c.textContent.includes('Personalizados'));
                    let isTodos = (c.dataset.filter === 'Todos' || c.textContent.includes('Todos'));

                    if (item.id === 'personalizados' && isPersonalizados) {
                        c.classList.add('active');
                        currentFilter = 'Personalizados';
                    } else if (item.id !== 'personalizados' && isTodos) {
                        c.classList.add('active');
                        currentFilter = 'Todos';
                    }
                });

                renderAll();
            });
        }

        container.appendChild(span);

        if (!isLast) {
            const sep = document.createElement('span');
            sep.className = 'breadcrumb-separator';
            sep.textContent = '/';
            container.appendChild(sep);
        }
    });
}

function getFolderContentsCount(folderId) {
    const subfolders = activeFolders.filter(f => f.parentId === folderId);

    let mazoCount = 0;
    let tablaCount = 0;
    let cartaCount = 0;

    const { officialList, customList } = getDecksForFolder(folderId);

    const allItems = [...officialList, ...customList];
    allItems.forEach(item => {
        const type = (item.type || 'tabla').toLowerCase();
        if (type === 'mazo') mazoCount++;
        else if (type === 'tabla') tablaCount++;
        else if (type === 'carta') cartaCount++;
    });

    subfolders.forEach(sub => {
        const subCounts = getFolderContentsCount(sub.id);
        mazoCount += subCounts.mazo;
        tablaCount += subCounts.tabla;
        cartaCount += subCounts.carta;
    });

    return { mazo: mazoCount, tabla: tablaCount, carta: cartaCount };
}

function formatFolderContentsLabel(counts) {
    const parts = [];
    if (counts.mazo > 0) parts.push(counts.mazo === 1 ? '1 mazo' : `${counts.mazo} mazos`);
    if (counts.tabla > 0) parts.push(counts.tabla === 1 ? '1 tabla' : `${counts.tabla} tablas`);
    if (counts.carta > 0) parts.push(counts.carta === 1 ? '1 carta' : `${counts.carta} cartas`);
    return parts.length === 0 ? 'Vacío' : parts.join(', ');
}

function getDecksForFolder(folderId) {
    const customDecks = Storage.getCustomDecks();
    let officialList = [];
    let customList = [];

    if (folderId === 'generales') {
        officialList = allOfficialPacks.filter(pack => (pack.type || 'tabla').toLowerCase() === 'mazo');
    } else if (folderId === 'tablas') {
        officialList = allOfficialPacks.filter(pack => {
            const type = (pack.type || 'tabla').toLowerCase();
            return type === 'tabla' || type === 'carta';
        });
        customList = customDecks;
    } else if (folderId === 'personalizados') {
        customList = customDecks;
    } else if (folderId === null) {
        // Root Level
        officialList = allOfficialPacks.filter(pack => {
            const folders = activeMappings[pack.id] || [];
            return folders.length === 0;
        });

        customList = customDecks.filter(deck => {
            const folders = deck.folders || [];
            return folders.length === 0;
        });
    } else {
        // Inside specific folder
        officialList = allOfficialPacks.filter(pack => {
            const folders = activeMappings[pack.id] || [];
            return folders.includes(folderId);
        });

        customList = customDecks.filter(deck => {
            const folders = deck.folders || [];
            return folders.includes(folderId);
        });
    }

    return { officialList, customList };
}

function showNoResultsState(visible) {
    const noResults = document.getElementById('decksNoResults');
    if (noResults) noResults.style.display = visible ? 'flex' : 'none';
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
    const stats = AppStore.state.stats;
    const srsData = Storage.getSrsData();

    let totalEncountered = 0;
    let totalMastered = 0;
    Object.values(srsData).forEach(packSrs => {
        Object.values(packSrs).forEach(info => {
            totalEncountered++;
            if (info.box === 5) totalMastered++;
        });
    });

    const masteryPercent = totalEncountered > 0 ? Math.round((totalMastered / totalEncountered) * 100) : 0;

    const streakEl = document.getElementById('statStreak');
    const dominioEl = document.getElementById('statDominio');
    const progressEl = document.getElementById('statProgressFill');
    const repasoEl = document.getElementById('statRepasos');

    if (streakEl) {
        const prev = parseInt(streakEl.dataset.value || "0", 10);
        streakEl.dataset.value = stats.streak;
        animateCounter(streakEl, prev, stats.streak, 800, "🔥 ", stats.streak === 1 ? ' día' : ' días');
    }
    if (dominioEl) {
        const prev = parseInt(dominioEl.dataset.value || "0", 10);
        dominioEl.dataset.value = masteryPercent;
        animateCounter(dominioEl, prev, masteryPercent, 800, "", "%");
    }
    if (progressEl) progressEl.style.width = `${masteryPercent}%`;
    if (repasoEl) {
        const prev = parseInt(repasoEl.dataset.value || "0", 10);
        repasoEl.dataset.value = stats.totalReviews;
        animateCounter(repasoEl, prev, stats.totalReviews, 800, "", "");
    }
}

// ─── HTML Builders ────────────────────────────────────────────────────────────

function buildFolderCardHTML(folder, countLabel) {
    const coverUrl = `https://loremflickr.com/400/180/${encodeURIComponent(folder.coverKeyword)}`;
    return `
        <div class="folder-card-wrapper folder-${folder.color}" data-folder-id="${folder.id}">
            <div class="folder-tab"></div>
            <div class="folder-card">
                <img class="folder-cover-img" src="${coverUrl}" alt="${folder.title}" loading="lazy" onload="this.classList.add('loaded');">
                <div class="folder-cover-overlay"></div>
                <div class="folder-content">
                    <div class="folder-header">
                        <h3>${folder.title}</h3>
                        <span class="folder-icon">📁</span>
                    </div>
                    <p class="folder-desc">${folder.desc}</p>
                    <div class="folder-meta">
                        <span>Carpeta</span>
                        <span>${countLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getResourceTypeBadgeHTML(type) {
    const t = (type || 'tabla').toLowerCase();
    if (t === 'carta') return '<span class="badge-resource-type badge-type-carta">🎴 Carta</span>';
    if (t === 'mazo') return '<span class="badge-resource-type badge-type-mazo">🗂️ Mazo</span>';
    return '<span class="badge-resource-type badge-type-tabla">📋 Tabla</span>';
}

function getPackIcon(title, category) {
    const text = (title + ' ' + category).toLowerCase();
    if (text.includes('salud') || text.includes('health') || text.includes('médico')) return '🏥';
    if (text.includes('comida') || text.includes('restaurante') || text.includes('food')) return '🍎';
    if (text.includes('viaje') || text.includes('aeropuerto') || text.includes('airport')) return '✈️';
    if (text.includes('ocio') || text.includes('hobby')) return '🎮';
    if (text.includes('academico') || text.includes('estudio')) return '📚';
    if (text.includes('rutina') || text.includes('time')) return '⏰';
    return '📋';
}

function buildOfficialCardHTML(pack, percent, encountered, mastered = 0) {
    const reviewedLabel = encountered > 0 ? `${encountered} palabras` : 'Sin iniciar';
    const icon = getPackIcon(pack.title, pack.category);
    return `
        <div class="deck-card-badges-row">
            ${getResourceTypeBadgeHTML(pack.type)}
            <span class="badge-origin badge-origin-official">Oficial</span>
        </div>
        <div class="deck-card-body">
            <div class="deck-card-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:24px;">${icon}</span>
                    <h3>${pack.title}</h3>
                </div>
                <span class="level-badge level-${pack.level.toLowerCase()}">${pack.level}</span>
            </div>
            <p class="deck-card-desc">${pack.desc}</p>
            <div class="deck-card-meta">
                <span class="deck-meta-category">${pack.category}</span>
                <span class="deck-meta-reviewed">${reviewedLabel} (${mastered} ✅)</span>
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

function buildCustomCardHTML(deck, percent, encountered, wordCount, mastered = 0) {
    const reviewedLabel = encountered > 0 ? `${encountered} palabras` : 'Sin iniciar';
    const wordLabel = wordCount > 0 ? `${wordCount} palabras` : '';
    return `
        <div class="deck-card-badges-row">
            ${getResourceTypeBadgeHTML(deck.type || 'tabla')}
            <span class="badge-origin badge-origin-custom">Personalizado</span>
        </div>
        <div class="deck-card-body deck-card-click" style="cursor:pointer">
            <div class="deck-card-header">
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:24px;">📦</span>
                    <h3>${deck.title}</h3>
                </div>
                <button class="deck-delete-btn" title="Eliminar mazo">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            <p class="deck-card-desc">${deck.desc || 'Mazo personalizado guardado.'}</p>
            <div class="deck-card-meta">
                <span class="deck-meta-category">${wordLabel}</span>
                <span class="deck-meta-reviewed">${reviewedLabel} (${mastered} ✅)</span>
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
            <p>Importá un archivo CSV arriba para crear tu primer mazo personalizado.</p>
        </div>
    `;
}
