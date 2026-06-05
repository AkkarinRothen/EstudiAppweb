// Portal UI Module
import * as Storage from './storage.js';

let currentFilter = 'Todos';

// Level configuration: order, label, accent color class
const LEVEL_CONFIG = [
    { key: 'A1', label: 'Nivel A1 — Principiante', colorClass: 'level-a1' },
    { key: 'A2', label: 'Nivel A2 — Elemental',    colorClass: 'level-a2' },
    { key: 'B1', label: 'Nivel B1 — Intermedio',   colorClass: 'level-b1' },
    { key: 'B2', label: 'Nivel B2 — Avanzado',     colorClass: 'level-b2' },
];

export function setFilter(level, el, onFilter) {
    currentFilter = level;
    document.querySelectorAll('.filter-section .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    if (onFilter) onFilter();
}

export function filterPacks() {
    const query = document.getElementById('searchInput').value.toLowerCase();

    // Show / hide individual cards
    const cards = document.querySelectorAll('#grid .card');
    cards.forEach(card => {
        const title = card.querySelector('h3')?.innerText.toLowerCase() || '';
        const desc  = card.querySelector('.card-desc')?.innerText.toLowerCase() || '';
        const level = card.getAttribute('data-level');

        const matchesSearch = title.includes(query) || desc.includes(query);
        const matchesFilter = currentFilter === 'Todos' || level === currentFilter;

        card.style.display = (matchesSearch && matchesFilter) ? 'flex' : 'none';
    });

    // Show / hide level sections based on whether they have visible cards
    const sections = document.querySelectorAll('#grid .level-section');
    sections.forEach(section => {
        const sectionLevel = section.getAttribute('data-section-level');
        const visibleInSection = section.querySelectorAll(
            `.card[data-level="${sectionLevel}"]`
        );
        const anyVisible = [...visibleInSection].some(c => c.style.display !== 'none');

        section.style.display = anyVisible ? 'block' : 'none';
    });

    // No-results message on the outer grid
    const grid = document.getElementById('grid');
    const noRes = document.querySelector('#grid > .no-results');
    const allHidden = [...document.querySelectorAll('#grid .level-section')].every(
        s => s.style.display === 'none'
    );

    if (allHidden) {
        if (!noRes) {
            const div = document.createElement('div');
            div.className = 'no-results';
            div.innerText = 'No se encontraron packs que coincidan con tu búsqueda.';
            grid.appendChild(div);
        }
    } else if (noRes) {
        noRes.remove();
    }
}

/**
 * Renders all official packs grouped by level, each group in a collapsible section.
 * Cards now include a cover image loaded from loremflickr using pack.coverKeyword.
 */
export function renderPacks(packs) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    const srsData = Storage.getSrsData();

    // Group packs by level
    const grouped = {};
    LEVEL_CONFIG.forEach(lc => { grouped[lc.key] = []; });
    packs.forEach(pack => {
        if (grouped[pack.level]) grouped[pack.level].push(pack);
    });

    LEVEL_CONFIG.forEach(lc => {
        const levelPacks = grouped[lc.key];
        if (levelPacks.length === 0) return;

        // ── Section wrapper ──────────────────────────────
        const section = document.createElement('div');
        section.className = 'level-section';
        section.setAttribute('data-section-level', lc.key);

        // ── Section header (clickable to collapse) ───────
        const header = document.createElement('div');
        header.className = 'level-section-header';
        header.innerHTML = `
            <div class="level-section-title">
                <span class="level-badge ${lc.colorClass}">${lc.key}</span>
                <span>${lc.label}</span>
                <span class="level-count">${levelPacks.length} pack${levelPacks.length > 1 ? 's' : ''}</span>
            </div>
            <svg class="level-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
        `;

        // ── Cards grid for this level ────────────────────
        const levelGrid = document.createElement('div');
        levelGrid.className = 'level-grid';

        levelPacks.forEach(pack => {
            // Calculate mastery
            let encountered = 0, mastered = 0;
            if (srsData[pack.id]) {
                Object.keys(srsData[pack.id]).forEach(key => {
                    encountered++;
                    if (srsData[pack.id][key].box === 5) mastered++;
                });
            }
            const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;

            // Cover image URL
            const keyword = pack.coverKeyword || pack.category || pack.id;
            const coverUrl = `https://loremflickr.com/400/180/${encodeURIComponent(keyword)}`;

            const card = document.createElement('a');
            card.href = pack.file;
            card.className = 'card';
            card.setAttribute('data-level', pack.level);
            card.innerHTML = `
                <div class="card-cover">
                    <img
                        class="card-cover-img"
                        src="${coverUrl}"
                        alt="${pack.title}"
                        loading="lazy"
                        onload="this.classList.add('loaded'); this.parentElement.style.animation='none'; this.parentElement.style.background='none';"
                        onerror="this.parentElement.classList.add('cover-error')"
                    >
                    <span class="level-badge ${lc.colorClass} card-cover-badge">${pack.level}</span>
                </div>
                <div class="card-body">
                    <div class="card-header">
                        <h3>${pack.title}</h3>
                    </div>
                    <p class="card-desc">${pack.desc}</p>
                    <div class="card-progress">
                        <div class="card-progress-row">
                            <span>Dominio SRS</span>
                            <span>${percent}%</span>
                        </div>
                        <div class="progress-container">
                            <div class="progress-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                    <div class="card-footer">
                        <span class="category">${pack.category}</span>
                        <span class="btn-open">Practicar →</span>
                    </div>
                </div>
            `;
            levelGrid.appendChild(card);
        });

        section.appendChild(header);
        section.appendChild(levelGrid);
        grid.appendChild(section);

        // Toggle collapse on header click
        header.addEventListener('click', () => {
            const isOpen = !section.classList.contains('collapsed');
            section.classList.toggle('collapsed', isOpen);
        });
    });
}

export function renderCustomDecks(onOpen, onDelete) {
    const customGrid = document.getElementById('customGrid');
    const customDecksSection = document.getElementById('customDecksSection');
    if (!customGrid || !customDecksSection) return;
    
    let customDecks = Storage.getCustomDecks();
    
    if (customDecks.length === 0) {
        customDecksSection.style.display = 'none';
        customGrid.innerHTML = '';
        return;
    }
    
    customDecksSection.style.display = 'block';
    customGrid.innerHTML = '';
    
    const srsData = Storage.getSrsData();
    
    customDecks.forEach(deck => {
        const packId = "csv_" + deck.title.toLowerCase().replace(/[^a-z0-9]/g, "_");
        let encountered = 0;
        let mastered = 0;
        
        if (srsData[packId]) {
            Object.keys(srsData[packId]).forEach(key => {
                encountered++;
                if (srsData[packId][key].box === 5) mastered++;
            });
        }
        const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-body">
                <div class="card-header-with-delete">
                    <div class="card-header" style="flex: 1; border: none; padding: 0; margin-bottom: 0;">
                        <h3 style="cursor: pointer;" id="title_${deck.id}">${deck.title}</h3>
                    </div>
                    <button class="btn-delete" id="btnDelete_${deck.id}" title="Eliminar mazo">
                        <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                    </button>
                </div>
                <p id="desc_${deck.id}" class="card-desc" style="cursor: pointer;">${deck.desc || 'Tabla personalizada guardada.'}</p>
                <div id="stats_${deck.id}" style="margin-top: auto; margin-bottom: 12px; cursor: pointer;">
                    <div class="card-progress-row">
                        <span>Dominio SRS</span>
                        <span>${percent}%</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${percent}%;"></div>
                    </div>
                </div>
                <div class="card-footer" id="footer_${deck.id}" style="cursor: pointer;">
                    <span class="category">Personalizado</span>
                    <span class="btn-open">Practicar →</span>
                </div>
            </div>
        `;
        customGrid.appendChild(card);
        
        const openFn = () => onOpen(deck);
        document.getElementById(`title_${deck.id}`).onclick = openFn;
        document.getElementById(`desc_${deck.id}`).onclick = openFn;
        document.getElementById(`stats_${deck.id}`).onclick = openFn;
        document.getElementById(`footer_${deck.id}`).onclick = openFn;

        document.getElementById(`btnDelete_${deck.id}`).onclick = (e) => {
            e.stopPropagation();
            onDelete(deck.id);
        };
    });
}
