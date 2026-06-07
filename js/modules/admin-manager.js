// ============================================================
// admin-manager.js — Admin Resource Manager Module
// Manages folders, subfolders and didactic resources (packs)
// with selection, drag-and-drop, CRUD and GitHub publishing.
// ============================================================

import { FOLDERS_CONFIG, DECK_FOLDER_MAPPINGS } from './folders-config.js';
import * as Storage from './storage.js';

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY_FOLDERS      = 'admin_folders_state';
const STORAGE_KEY_MAPPINGS     = 'admin_mappings_state';
const STORAGE_KEY_ORDER        = 'admin_resource_order';
const STORAGE_KEY_OVERRIDES    = 'pack_overrides';
const STORAGE_KEY_CUSTOM_DECKS = 'estudiapp_custom_decks';

const TYPE_ICONS  = { mazo: '🗂️', tabla: '📋', carta: '🎴' };
const COLOR_MAP   = {
    blue: '#1565C0', purple: '#6750A4', pink: '#C2185B',
    yellow: '#F57F17', green: '#2E7D32', black: '#263238',
    teal: '#00695C', red: '#B71C1C'
};
const FOLDER_EMOJI_MAP = {
    blue: '📘', purple: '📓', pink: '📒', yellow: '📔',
    green: '📗', black: '📕', teal: '📙', red: '📕'
};

// ── Module State ──────────────────────────────────────────────────────────────
let allPacks       = [];       // from packs.json + localStorage custom
let folders        = [];       // current folder tree
let folderMappings = {};       // packId → folderIds[]
let resourceOrder  = {};       // folderId → orderedPackIds[]
let packOverrides  = {};       // packId → { title, level, desc, type, ... }

let selectedIds    = new Set();// currently selected card IDs (pack or folder)
let activeFolderId = null;     // currently active folder (null = root/all)
let isListView     = false;
let dragState      = null;     // { type:'pack'|'folder', id }

// Callbacks injected from admin.js
let _onSwitchToCreate = null;
let _onEditVocab = null;

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initialize the resource manager.
 * @param {Array}    packs            All available packs (official + custom)
 * @param {Function} onSwitchToCreate Called when user clicks "+ Recurso" (opens create tab)
 * @param {Function} onEditVocab      Called when user clicks "📝 Vocabulario" to edit its entries
 */
export function init(packs, onSwitchToCreate, onEditVocab) {
    allPacks = packs;
    _onSwitchToCreate = onSwitchToCreate;
    _onEditVocab = onEditVocab;

    loadState();
    setupManagerUI();
    renderTree();
    renderMain();
}

/** Call after custom decks change (e.g. new import). */
export function setPacks(packs) {
    allPacks = packs;
    renderMain();
}

// ── State Load / Save ─────────────────────────────────────────────────────────

function loadState() {
    const adminState = Storage.getAdminState();
    let loadedFolders = adminState.folders;

    if (loadedFolders) {
        const hasTablas = loadedFolders.some(f => f.id === 'tablas');
        const hasDeleted = loadedFolders.some(f => f.id === 'viajes_aeropuerto');
        if (!hasTablas || hasDeleted) {
            loadedFolders = null; // force reload from FOLDERS_CONFIG
            Storage.clearAdminState();
        }
    }

    folders = loadedFolders ? loadedFolders : deepCopy(FOLDERS_CONFIG);
    folderMappings = (adminState.mappings && loadedFolders) ? adminState.mappings : deepCopy(DECK_FOLDER_MAPPINGS);
    resourceOrder = adminState.order || {};
    packOverrides = adminState.overrides || {};
}

function saveState() {
    Storage.saveAdminFolders(folders);
    Storage.saveAdminMappings(folderMappings);
    Storage.saveAdminOrder(resourceOrder);
    Storage.savePackOverrides(packOverrides);
}

// ── Setup UI Wiring ───────────────────────────────────────────────────────────

function setupManagerUI() {
    // Toolbar buttons
    bind('tbNewFolder',     () => openFolderModal());
    bind('tbNewResource',   () => _onSwitchToCreate && _onSwitchToCreate());
    bind('tbDeleteSel',     () => deleteSelected());
    bind('tbMoveSel',       () => openMoveModal());
    bind('tbSelectAll',     () => selectAll());
    bind('tbClearSel',      () => clearSelection());
    bind('tbViewToggle',    () => toggleView());
    bind('tbPublish',       () => publishChanges());

    // Keyboard shortcuts
    document.addEventListener('keydown', onKeydown);
}

function bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
}

function onKeydown(e) {
    const panel = document.getElementById('adminManagerPanel');
    if (!panel || panel.style.display === 'none') return;

    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        selectAll();
    }
    if (e.key === 'Escape') {
        clearSelection();
        closeAllModals();
    }
    if (e.key === 'Delete' && selectedIds.size > 0) {
        deleteSelected();
    }
}

// ── Tree Render ───────────────────────────────────────────────────────────────

function renderTree() {
    const sidebar = document.getElementById('managerSidebar');
    if (!sidebar) return;

    // Root folders (parentId === null)
    const roots = folders.filter(f => !f.parentId);

    let html = `<div class="manager-sidebar-title">Carpetas</div>`;

    // "All" item
    html += treeItemHTML({ id: '__all', title: 'Todos los recursos', color: 'purple' }, 0, activeFolderId === null);

    for (const folder of roots) {
        const children = folders.filter(f => f.parentId === folder.id);
        html += treeItemHTML(folder, 0, activeFolderId === folder.id);
        for (const child of children) {
            html += treeItemHTML(child, 1, activeFolderId === child.id);
        }
    }

    sidebar.innerHTML = html;

    // Bind events
    sidebar.querySelectorAll('.tree-item').forEach(el => {
        const fid = el.dataset.fid;
        el.addEventListener('click', () => {
            activeFolderId = fid === '__all' ? null : fid;
            clearSelection();
            renderTree();
            renderMain();
        });

        // Drag-over for dropping packs into a folder
        el.addEventListener('dragover', e => {
            if (!dragState) return;
            e.preventDefault();
            el.classList.add('drag-over-tree');
        });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over-tree'));
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-over-tree');
            if (dragState?.type === 'pack') {
                movePacksToFolder([dragState.id], fid === '__all' ? null : fid);
            }
            dragState = null;
        });
    });
}

function treeItemHTML(folder, indent, isActive) {
    const count = countPacksInFolder(folder.id);
    const emoji = FOLDER_EMOJI_MAP[folder.color] || '📁';
    return `
    <div class="tree-item${isActive ? ' active' : ''}" data-fid="${folder.id}">
        ${indent > 0 ? '<div class="tree-item-indent"></div>' : ''}
        <span class="tree-item-icon">${folder.id === '__all' ? '🗂️' : emoji}</span>
        <span class="tree-item-label">${esc(folder.title)}</span>
        ${count > 0 ? `<span class="tree-item-count">${count}</span>` : ''}
    </div>`;
}

function countPacksInFolder(folderId) {
    if (folderId === '__all') return allPacks.length;
    return allPacks.filter(p => getPackFolderIds(p.id).includes(folderId)).length;
}

function getPackFolderIds(packId) {
    return folderMappings[packId] || [];
}

// ── Main Panel Render ─────────────────────────────────────────────────────────

function renderMain() {
    const main = document.getElementById('managerMain');
    if (!main) return;

    const activeFolder = activeFolderId ? folders.find(f => f.id === activeFolderId) : null;

    // Breadcrumb
    let breadcrumb = `<span class="manager-breadcrumb">`;
    breadcrumb += `<a id="bcRoot">Inicio</a>`;
    if (activeFolder) {
        const parent = activeFolder.parentId ? folders.find(f => f.id === activeFolder.parentId) : null;
        if (parent) {
            breadcrumb += `<span class="sep">›</span><a data-bcfolder="${parent.id}">${esc(parent.title)}</a>`;
        }
        breadcrumb += `<span class="sep">›</span><span>${esc(activeFolder.title)}</span>`;
    }
    breadcrumb += `</span>`;

    // Title
    const title = activeFolder ? activeFolder.title : 'Todos los recursos';
    const emoji = activeFolder ? (FOLDER_EMOJI_MAP[activeFolder.color] || '📁') : '🗂️';

    // Gather subfolders to show (children of active, or root folders)
    const subfolders = activeFolderId
        ? folders.filter(f => f.parentId === activeFolderId)
        : folders.filter(f => !f.parentId);

    // Gather packs
    const packs = activeFolderId
        ? getPacksForFolder(activeFolderId)
        : allPacks;

    // Build HTML
    let html = `
    <div class="manager-main-header">
        <span style="font-size:22px;">${emoji}</span>
        <span class="manager-main-title">${esc(title)}</span>
        ${breadcrumb}
    </div>`;

    const gridClass = `resource-grid${isListView ? ' list-view' : ''}`;

    if (subfolders.length === 0 && packs.length === 0) {
        html += `<div class="manager-empty">
            <div class="manager-empty-icon">📭</div>
            <div class="manager-empty-text">Esta carpeta está vacía</div>
        </div>`;
    } else {
        // Subfolders section
        if (subfolders.length > 0) {
            html += `<div class="manager-section-label">📁 Subcarpetas</div>`;
            html += `<div class="${gridClass}" id="foldersGrid">`;
            for (const f of subfolders) {
                const count = countPacksInFolder(f.id);
                const femoji = FOLDER_EMOJI_MAP[f.color] || '📁';
                const sel = selectedIds.has('folder:' + f.id);
                html += `
                <div class="res-folder-card${sel ? ' selected' : ''}" data-fcard="${f.id}"
                     draggable="true">
                    <div class="res-card-checkbox${sel ? ' checked' : ''}" data-ckfolder="${f.id}"></div>
                    <div class="res-folder-icon">${femoji}</div>
                    <div class="res-folder-info">
                        <div class="res-folder-name">${esc(f.title)}</div>
                        <div class="res-folder-count">${count} recurso${count !== 1 ? 's' : ''}</div>
                    </div>
                    <div style="display:flex;gap:4px;flex-direction:column;">
                        <button class="res-act-btn" data-edit-folder="${f.id}" title="Editar">✏️</button>
                        <button class="res-act-btn danger" data-del-folder="${f.id}" title="Eliminar">🗑️</button>
                    </div>
                </div>`;
            }
            html += `</div>`;
        }

        // Packs section
        if (packs.length > 0) {
            html += `<div class="manager-section-label">📚 Recursos</div>`;
            html += `<div class="${gridClass}" id="packsGrid">`;
            for (const p of getOrderedPacks(packs, activeFolderId)) {
                html += buildPackCardHTML(p);
            }
            html += `</div>`;
        }
    }

    main.innerHTML = html;
    bindMainEvents(main);
    updateToolbar();
}

function buildPackCardHTML(pack) {
    const overrides = packOverrides[pack.id] || {};
    const title = overrides.title || pack.title || pack.id;
    const level = overrides.level || pack.level || '';
    const desc  = overrides.desc  || pack.desc  || '';
    const type  = overrides.type  || pack.type  || 'mazo';
    const typeIcon = TYPE_ICONS[type] || '🗂️';
    const sel = selectedIds.has('pack:' + pack.id);
    const isOfficial = !pack._custom;

    return `
    <div class="res-pack-card${sel ? ' selected' : ''}" data-pcard="${pack.id}" draggable="true">
        <div class="res-card-checkbox${sel ? ' checked' : ''}" data-ckpack="${pack.id}"></div>
        <div class="res-pack-card-header">
            <span class="res-pack-type-icon">${typeIcon}</span>
            ${level ? `<span class="res-pack-level-badge">${esc(level)}</span>` : ''}
        </div>
        <div class="res-pack-title">${esc(title)}</div>
        <div class="res-pack-desc">${esc(desc)}</div>
        <div class="res-pack-badges">
            <span class="badge badge-type-${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span class="badge ${isOfficial ? 'badge-origin-official' : ''}">${isOfficial ? 'Oficial' : 'Personalizado'}</span>
        </div>
        <div class="res-pack-actions">
            <button class="res-act-btn" data-edit-vocab="${pack.id}" title="Editar palabras/vocabulario" style="border-color: var(--primary); color: var(--primary);">📝 Vocabulario</button>
            <button class="res-act-btn" data-edit-pack="${pack.id}" title="Editar metadatos">✏️ Editar</button>
            <button class="res-act-btn" data-move-pack="${pack.id}" title="Mover a carpeta">📂 Mover</button>
            <button class="res-act-btn danger" data-del-pack="${pack.id}" title="Eliminar">🗑️</button>
        </div>
    </div>`;
}

function bindMainEvents(main) {
    // Breadcrumb nav
    const bcRoot = main.querySelector('#bcRoot');
    if (bcRoot) bcRoot.addEventListener('click', () => { activeFolderId = null; clearSelection(); renderTree(); renderMain(); });
    main.querySelectorAll('[data-bcfolder]').forEach(el => {
        el.addEventListener('click', () => { activeFolderId = el.dataset.bcfolder; clearSelection(); renderTree(); renderMain(); });
    });

    // Folder card click → navigate
    main.querySelectorAll('[data-fcard]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('[data-edit-folder],[data-del-folder],[data-ckfolder]')) return;
            activeFolderId = el.dataset.fcard;
            clearSelection();
            renderTree();
            renderMain();
        });

        // Folder drag-and-drop (as drag source)
        el.addEventListener('dragstart', (e) => {
            dragState = { type: 'folder', id: el.dataset.fcard };
            e.dataTransfer.effectAllowed = 'move';
        });
        el.addEventListener('dragend', () => dragState = null);

        // Folder drop target (for packs)
        el.addEventListener('dragover', e => {
            if (!dragState || dragState.type !== 'pack') return;
            e.preventDefault();
            el.classList.add('drag-over');
        });
        el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-over');
            if (dragState?.type === 'pack') {
                const targetFid = el.dataset.fcard;
                movePacksToFolder([dragState.id], targetFid);
            }
            dragState = null;
        });
    });

    // Folder checkboxes
    main.querySelectorAll('[data-ckfolder]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelect('folder:' + el.dataset.ckfolder);
        });
    });

    // Folder edit / delete buttons
    main.querySelectorAll('[data-edit-folder]').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); openFolderModal(el.dataset.editFolder); });
    });
    main.querySelectorAll('[data-del-folder]').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); deleteFolder(el.dataset.delFolder); });
    });

    // Pack card click → just select
    main.querySelectorAll('[data-pcard]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('[data-edit-pack],[data-del-pack],[data-move-pack],[data-ckpack]')) return;
            const id = 'pack:' + el.dataset.pcard;
            if (e.ctrlKey || e.metaKey) {
                toggleSelect(id);
            } else {
                clearSelection();
                toggleSelect(id);
            }
        });

        // Drag start
        el.addEventListener('dragstart', (e) => {
            dragState = { type: 'pack', id: el.dataset.pcard };
            e.dataTransfer.effectAllowed = 'move';
            el.classList.add('dragging');
        });
        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            dragState = null;
        });
    });

    // Pack checkboxes
    main.querySelectorAll('[data-ckpack]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSelect('pack:' + el.dataset.ckpack);
        });
    });

    // Pack edit
    main.querySelectorAll('[data-edit-pack]').forEach(el => {
        el.addEventListener('click', (e) => { e.stopPropagation(); openPackEditModal(el.dataset.editPack); });
    });

    // Pack vocabulary edit
    main.querySelectorAll('[data-edit-vocab]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_onEditVocab) _onEditVocab(el.dataset.editVocab);
        });
    });

    // Pack move
    main.querySelectorAll('[data-move-pack]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection();
            selectedIds.add('pack:' + el.dataset.movePack);
            openMoveModal();
        });
    });

    // Pack delete
    main.querySelectorAll('[data-del-pack]').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            clearSelection();
            selectedIds.add('pack:' + el.dataset.delPack);
            deleteSelected();
        });
    });
}

// ── Selection ─────────────────────────────────────────────────────────────────

function toggleSelect(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    updateSelectionUI();
    updateToolbar();
}

function clearSelection() {
    selectedIds.clear();
    updateSelectionUI();
    updateToolbar();
}

function selectAll() {
    const packs = activeFolderId ? getPacksForFolder(activeFolderId) : allPacks;
    const subs  = activeFolderId
        ? folders.filter(f => f.parentId === activeFolderId)
        : folders.filter(f => !f.parentId);

    packs.forEach(p => selectedIds.add('pack:' + p.id));
    subs.forEach(f => selectedIds.add('folder:' + f.id));
    updateSelectionUI();
    updateToolbar();
}

function updateSelectionUI() {
    // Update card visual states
    document.querySelectorAll('[data-pcard]').forEach(el => {
        const sel = selectedIds.has('pack:' + el.dataset.pcard);
        el.classList.toggle('selected', sel);
        const ck = el.querySelector('.res-card-checkbox');
        if (ck) ck.classList.toggle('checked', sel);
    });
    document.querySelectorAll('[data-fcard]').forEach(el => {
        const sel = selectedIds.has('folder:' + el.dataset.fcard);
        el.classList.toggle('selected', sel);
        const ck = el.querySelector('.res-card-checkbox');
        if (ck) ck.classList.toggle('checked', sel);
    });
}

function updateToolbar() {
    const count = selectedIds.size;
    const badge = document.getElementById('selectionCountBadge');
    if (badge) {
        badge.textContent = `${count} seleccionado${count !== 1 ? 's' : ''}`;
        badge.classList.toggle('visible', count > 0);
    }

    const delBtn  = document.getElementById('tbDeleteSel');
    const moveBtn = document.getElementById('tbMoveSel');
    const clrBtn  = document.getElementById('tbClearSel');
    if (delBtn)  delBtn.disabled  = count === 0;
    if (moveBtn) moveBtn.disabled = count === 0;
    if (clrBtn)  clrBtn.disabled  = count === 0;
}

// ── CRUD: Folders ─────────────────────────────────────────────────────────────

function openFolderModal(editId = null) {
    const folder = editId ? folders.find(f => f.id === editId) : null;
    const isEdit = !!folder;

    const parentOptions = folders
        .filter(f => f.id !== editId && !f.parentId)
        .map(f => `<option value="${esc(f.id)}" ${folder?.parentId === f.id ? 'selected' : ''}>${esc(f.title)}</option>`)
        .join('');

    const colorSwatches = ['blue','purple','pink','yellow','green','black','teal','red']
        .map(c => `<div class="color-swatch${folder?.color === c || (!folder && c === 'blue') ? ' active' : ''}" data-color="${c}" title="${c}"></div>`)
        .join('');

    const modal = createModal({
        title: isEdit ? '✏️ Editar Carpeta' : '📁 Nueva Carpeta',
        body: `
        <div class="form-group">
            <label>ID único (sin espacios):</label>
            <input id="mFolderId" type="text" value="${esc(folder?.id || '')}" ${isEdit ? 'disabled' : ''} placeholder="ej: mis_viajes">
        </div>
        <div class="form-group">
            <label>Título:</label>
            <input id="mFolderTitle" type="text" value="${esc(folder?.title || '')}" placeholder="ej: Mis Viajes">
        </div>
        <div class="form-group">
            <label>Descripción:</label>
            <input id="mFolderDesc" type="text" value="${esc(folder?.desc || '')}" placeholder="Descripción corta">
        </div>
        <div class="form-group">
            <label>Carpeta padre (opcional):</label>
            <select id="mFolderParent">
                <option value="">— Raíz (ninguna) —</option>
                ${parentOptions}
            </select>
        </div>
        <div class="form-group">
            <label>Color:</label>
            <div class="color-picker-row" id="mColorPicker">${colorSwatches}</div>
            <input type="hidden" id="mFolderColor" value="${folder?.color || 'blue'}">
        </div>`,
        confirmLabel: isEdit ? 'Guardar' : 'Crear',
        onConfirm: () => {
            const id    = document.getElementById('mFolderId').value.trim().replace(/\s+/g, '_');
            const title = document.getElementById('mFolderTitle').value.trim();
            const desc  = document.getElementById('mFolderDesc').value.trim();
            const parent= document.getElementById('mFolderParent').value;
            const color = document.getElementById('mFolderColor').value;

            if (!id || !title) { showToast('Completa ID y título', true); return; }

            if (isEdit) {
                const f = folders.find(x => x.id === editId);
                if (f) { f.title = title; f.desc = desc; f.parentId = parent || null; f.color = color; }
            } else {
                if (folders.find(f => f.id === id)) { showToast('Ya existe una carpeta con ese ID', true); return; }
                folders.push({ id, title, desc, parentId: parent || null, color, coverKeyword: '' });
            }
            saveState();
            renderTree();
            renderMain();
            showToast(isEdit ? 'Carpeta actualizada ✅' : 'Carpeta creada ✅');
        }
    });

    // Color swatch logic
    modal.querySelectorAll('.color-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            modal.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            document.getElementById('mFolderColor').value = sw.dataset.color;
        });
    });
}

function deleteFolder(folderId) {
    const f = folders.find(x => x.id === folderId);
    if (!f) return;
    const childCount = folders.filter(x => x.parentId === folderId).length;
    const packCount  = countPacksInFolder(folderId);
    let msg = `¿Eliminar la carpeta "${f.title}"?`;
    if (childCount > 0) msg += ` Contiene ${childCount} subcarpeta(s).`;
    if (packCount  > 0) msg += ` Los ${packCount} recursos quedarán sin asignar.`;
    if (!confirm(msg)) return;

    folders = folders.filter(x => x.id !== folderId && x.parentId !== folderId);
    // Remove pack mappings pointing to this folder
    for (const pid of Object.keys(folderMappings)) {
        folderMappings[pid] = (folderMappings[pid] || []).filter(fid => fid !== folderId);
    }
    delete resourceOrder[folderId];
    saveState();
    if (activeFolderId === folderId) activeFolderId = null;
    renderTree();
    renderMain();
    showToast('Carpeta eliminada 🗑️');
}

// ── CRUD: Pack Metadata ───────────────────────────────────────────────────────

function openPackEditModal(packId) {
    const pack = allPacks.find(p => p.id === packId);
    if (!pack) return;
    const ov = packOverrides[packId] || {};

    const modal = createModal({
        title: '✏️ Editar Recurso',
        body: `
        <div class="form-group">
            <label>Título:</label>
            <input id="mPackTitle" type="text" value="${esc(ov.title || pack.title || '')}">
        </div>
        <div class="form-group">
            <label>Descripción:</label>
            <input id="mPackDesc" type="text" value="${esc(ov.desc || pack.desc || '')}">
        </div>
        <div class="form-group">
            <label>Nivel:</label>
            <select id="mPackLevel">
                ${['A1','A2','B1','B2'].map(l => `<option value="${l}" ${(ov.level||pack.level) === l ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Tipo:</label>
            <select id="mPackType">
                ${['mazo','tabla','carta'].map(t => `<option value="${t}" ${(ov.type||pack.type||'mazo') === t ? 'selected' : ''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
            </select>
        </div>
        <div class="form-group">
            <label>Categoría:</label>
            <input id="mPackCat" type="text" value="${esc(ov.category || pack.category || '')}">
        </div>`,
        confirmLabel: 'Guardar',
        onConfirm: () => {
            packOverrides[packId] = {
                title:    document.getElementById('mPackTitle').value.trim(),
                desc:     document.getElementById('mPackDesc').value.trim(),
                level:    document.getElementById('mPackLevel').value,
                type:     document.getElementById('mPackType').value,
                category: document.getElementById('mPackCat').value.trim(),
            };
            saveState();
            renderMain();
            showToast('Recurso actualizado ✅');
        }
    });
}

function deleteSelected() {
    const packIds   = [...selectedIds].filter(id => id.startsWith('pack:')).map(id => id.slice(5));
    const folderIds = [...selectedIds].filter(id => id.startsWith('folder:')).map(id => id.slice(7));

    if (packIds.length === 0 && folderIds.length === 0) return;

    const totalItems = packIds.length + folderIds.length;
    if (!confirm(`¿Eliminar ${totalItems} elemento(s) seleccionado(s)?`)) return;

    // Remove folders
    for (const fid of folderIds) deleteFolder(fid);

    // Remove packs from all folders (removes mappings)
    for (const pid of packIds) {
        delete folderMappings[pid];
        // Remove from order arrays
        for (const fid of Object.keys(resourceOrder)) {
            resourceOrder[fid] = (resourceOrder[fid] || []).filter(id => id !== pid);
        }
        // Note: we don't remove from packs.json here (official packs stay in catalog)
        // Custom packs should also be removed from Storage
        allPacks = allPacks.filter(p => {
            if (p.id !== pid) return true;
            if (p._custom) {
                const decks = Storage.getCustomDecks();
                Storage.saveCustomDecks(decks.filter(d => d.id !== pid));
            }
            return false;
        });
    }

    saveState();
    clearSelection();
    renderTree();
    renderMain();
    showToast(`${totalItems} elemento(s) eliminado(s) 🗑️`);
}

// ── Move ──────────────────────────────────────────────────────────────────────

function openMoveModal() {
    if (selectedIds.size === 0) return;
    const packIds = [...selectedIds].filter(id => id.startsWith('pack:')).map(id => id.slice(5));
    if (packIds.length === 0) { showToast('Selecciona al menos un recurso para mover'); return; }

    let selectedDest = activeFolderId || '';

    const treeItems = [
        { id: '__root', title: 'Sin carpeta (raíz)', indent: 0 },
        ...folders.filter(f => !f.parentId).flatMap(f => [
            { id: f.id, title: f.title, color: f.color, indent: 0 },
            ...folders.filter(c => c.parentId === f.id).map(c => ({ id: c.id, title: c.title, color: c.color, indent: 1 }))
        ])
    ];

    const listHTML = treeItems.map(item => {
        const emoji = item.id === '__root' ? '🗂️' : (FOLDER_EMOJI_MAP[item.color] || '📁');
        return `<div class="move-tree-item${selectedDest === item.id ? ' selected-dest' : ''}"
            data-dest="${item.id}" style="padding-left:${10 + item.indent * 20}px;">
            ${emoji} ${esc(item.title)}
        </div>`;
    }).join('');

    const modal = createModal({
        title: `📂 Mover ${packIds.length} recurso(s) a…`,
        body: `<div class="move-tree-list" id="moveTreeList">${listHTML}</div>`,
        confirmLabel: 'Mover aquí',
        onConfirm: () => {
            const dest = selectedDest === '__root' ? null : selectedDest;
            movePacksToFolder(packIds, dest);
            clearSelection();
            showToast('Recursos movidos ✅');
        }
    });

    modal.querySelector('#moveTreeList')?.addEventListener('click', (e) => {
        const item = e.target.closest('[data-dest]');
        if (!item) return;
        selectedDest = item.dataset.dest;
        modal.querySelectorAll('.move-tree-item').forEach(el => el.classList.remove('selected-dest'));
        item.classList.add('selected-dest');
    });
}

function movePacksToFolder(packIds, targetFolderId) {
    for (const pid of packIds) {
        if (!folderMappings[pid]) folderMappings[pid] = [];

        if (targetFolderId === null) {
            // Move to root: remove all folder assignments
            folderMappings[pid] = [];
        } else {
            // Add to target folder if not already there
            if (!folderMappings[pid].includes(targetFolderId)) {
                // Remove from current activeFolderId (single-move context)
                if (activeFolderId) {
                    folderMappings[pid] = folderMappings[pid].filter(fid => fid !== activeFolderId);
                }
                folderMappings[pid].push(targetFolderId);
            }
        }
    }
    saveState();
    renderTree();
    renderMain();
}

// ── Order ─────────────────────────────────────────────────────────────────────

function getOrderedPacks(packs, folderId) {
    const order = folderId ? (resourceOrder[folderId] || []) : [];
    if (order.length === 0) return packs;

    const ordered = order.map(id => packs.find(p => p.id === id)).filter(Boolean);
    const rest    = packs.filter(p => !order.includes(p.id));
    return [...ordered, ...rest];
}

function getPacksForFolder(folderId) {
    return allPacks.filter(p => (folderMappings[p.id] || []).includes(folderId));
}

// ── Publish to GitHub ─────────────────────────────────────────────────────────

async function publishChanges() {
    const config = Storage.getGitHubConfig();
    const token = await Storage.getDecryptedToken();

    if (!config.owner || !config.repo || !token) {
        showToast('Guarda las credenciales de GitHub primero', true);
        return;
    }

    // Dynamically import github module
    const { githubGet, githubPut } = await import('./github.js');

    // Publish folders-config.js
    const foldersConfigContent = generateFoldersConfigJS();
    const encodedFC = btoa(unescape(encodeURIComponent(foldersConfigContent)));

    showToast('Publicando folders-config.js…');
    try {
        const existing = await githubGet(config.owner, config.repo, token, 'js/modules/folders-config.js');
        await githubPut(config.owner, config.repo, token, 'js/modules/folders-config.js', encodedFC,
            '📁 Update folders config via admin', existing?.sha);
        showToast('Cambios publicados en GitHub ✅');
    } catch (e) {
        showToast('Error al publicar: ' + e.message, true);
    }
}

function generateFoldersConfigJS() {
    return `// Folders Configuration for Decks Page Explorer
// Auto-generated by Admin Resource Manager
export const FOLDERS_CONFIG = ${JSON.stringify(folders, null, 4)};

export const DECK_FOLDER_MAPPINGS = ${JSON.stringify(folderMappings, null, 4)};
`;
}

// ── View Toggle ───────────────────────────────────────────────────────────────

function toggleView() {
    isListView = !isListView;
    const btn = document.getElementById('tbViewToggle');
    if (btn) btn.textContent = isListView ? '⊞' : '☰';
    renderMain();
}

// ── Modal Helper ──────────────────────────────────────────────────────────────

function createModal({ title, body, confirmLabel = 'Confirmar', onConfirm }) {
    closeAllModals();

    const overlay = document.createElement('div');
    overlay.className = 'manager-modal-overlay';
    overlay.id = 'managerModalOverlay';
    overlay.innerHTML = `
    <div class="manager-modal">
        <h3>${title}</h3>
        ${body}
        <div class="manager-modal-actions">
            <button class="tb-btn" id="mModalCancel">Cancelar</button>
            <button class="tb-btn primary" id="mModalConfirm">${confirmLabel}</button>
        </div>
    </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));

    overlay.querySelector('#mModalCancel').addEventListener('click', closeAllModals);
    overlay.querySelector('#mModalConfirm').addEventListener('click', () => {
        onConfirm();
        closeAllModals();
    });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
    });

    return overlay;
}

function closeAllModals() {
    document.querySelectorAll('.manager-modal-overlay').forEach(el => el.remove());
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function showToast(msg, isError = false) {
    let toast = document.getElementById('managerToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'managerToast';
        toast.className = 'manager-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = isError ? '#C62828' : '#323232';
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
