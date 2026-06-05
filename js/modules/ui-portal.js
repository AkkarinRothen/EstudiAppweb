// Portal UI Module
import * as Storage from './storage.js';

let currentFilter = 'Todos';

export function setFilter(level, el, onFilter) {
    currentFilter = level;
    document.querySelectorAll('.filter-section .filter-chip').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    if (onFilter) onFilter();
}

export function filterPacks() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const cards = document.querySelectorAll('#grid .card');
    let visibleCount = 0;

    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        const desc = card.querySelector('p').innerText.toLowerCase();
        const level = card.getAttribute('data-level');

        const matchesSearch = title.includes(query) || desc.includes(query);
        const matchesFilter = currentFilter === 'Todos' || level === currentFilter;

        if (matchesSearch && matchesFilter) {
            card.style.display = 'flex';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });

    const grid = document.getElementById('grid');
    const noRes = document.querySelector('.no-results');
    if (visibleCount === 0) {
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

export function renderPacks(packs) {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    const srsData = Storage.getSrsData();

    packs.forEach(pack => {
        // Calculate mastery for this pack
        let encountered = 0;
        let mastered = 0;
        if (srsData[pack.id]) {
            Object.keys(srsData[pack.id]).forEach(key => {
                encountered++;
                if (srsData[pack.id][key].box === 5) {
                    mastered++;
                }
            });
        }
        const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;

        const card = document.createElement('a');
        card.href = pack.file;
        card.className = 'card';
        card.setAttribute('data-level', pack.level);
        card.innerHTML = `
            <div class="card-header">
                <h3>${pack.title}</h3>
                <span class="level-badge level-${pack.level.toLowerCase()}">${pack.level}</span>
            </div>
            <p>${pack.desc}</p>
            <div style="margin-top: auto; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; color: var(--on-surface-variant); display: flex; justify-content: space-between; margin-bottom: 4px;">
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
        `;
        grid.appendChild(card);
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
                if (srsData[packId][key].box === 5) {
                    mastered++;
                }
            });
        }
        const percent = encountered > 0 ? Math.round((mastered / encountered) * 100) : 0;
        
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-header-with-delete">
                <div class="card-header" style="flex: 1; border: none; padding: 0; margin-bottom: 0;">
                    <h3 style="cursor: pointer;" id="title_${deck.id}">${deck.title}</h3>
                </div>
                <button class="btn-delete" id="btnDelete_${deck.id}" title="Eliminar mazo">
                    <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
            </div>
            <p id="desc_${deck.id}" style="cursor: pointer;">${deck.desc || 'Tabla personalizada guardada.'}</p>
            <div id="stats_${deck.id}" style="margin-top: auto; margin-bottom: 12px; cursor: pointer;">
                <div style="font-size: 12px; font-weight: 600; color: var(--on-surface-variant); display: flex; justify-content: space-between; margin-bottom: 4px;">
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
