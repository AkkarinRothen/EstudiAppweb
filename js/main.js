// Main Application Logic for EstudiApp Portal - Modular Version
import * as Storage from './modules/storage.js';
import * as Srs from './modules/srs.js';
import * as Speech from './modules/speech.js';
import * as Utils from './modules/utils.js';
import * as Parser from './modules/parser.js';
import * as Library from './modules/library.js';
import * as UiModal from './modules/ui-modal.js';
import * as DecksPage from './modules/decks-page.js';
import * as SupabaseSync from './modules/supabase-sync.js';
import * as UiGamification from './modules/ui-gamification.js';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    UiModal.init(updateStatsUI);
    DecksPage.init(UiModal.openPracticeModal, deleteCustomDeck);
    setupDragAndDrop();
    setupEventListeners();
    updateStatsUI();
    initAuth();
});

// Registrar callback de sincronización al guardar datos locales
Storage.registerOnSave(() => {
    SupabaseSync.queueAutoSync();
});

function setupEventListeners() {
    // Import Actions
    const dropZone = document.getElementById('dropZone');
    const csvInput = document.getElementById('csvInput');
    if (dropZone && csvInput) {
        dropZone.addEventListener('click', () => csvInput.click());
        csvInput.addEventListener('change', (e) => handleFileSelect(e));
    }

    // Modal Controls
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => UiModal.closeModal(() => {
            DecksPage.refresh();
            updateStatsUI();
        }));
    }

    const saveLocalBtn = document.getElementById('modalBtnSaveLocal');
    if (saveLocalBtn) {
        saveLocalBtn.addEventListener('click', () => saveActiveDeckToLibrary());
    }

    const exportBtn = document.getElementById('modalBtnExport');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => Library.exportDeck(UiModal.getImportedTableData()));
    }
}

function updateStatsUI() {
    Srs.validateStreak();
    const stats = Storage.getStats();
    const srsData = Storage.getSrsData();
    
    let totalEncountered = 0;
    let totalMastered = 0;
    
    Object.keys(srsData).forEach(packId => {
        Object.keys(srsData[packId]).forEach(wordKey => {
            totalEncountered++;
            if (srsData[packId][wordKey].box === 5) {
                totalMastered++;
            }
        });
    });
    
    const masteryPercent = totalEncountered > 0 ? Math.round((totalMastered / totalEncountered) * 100) : 0;
    
    const streakEl = document.getElementById('statStreak');
    const dominioEl = document.getElementById('statDominio');
    const progressFillEl = document.getElementById('statProgressFill');
    const reviewsEl = document.getElementById('statRepasos');
    
    if (streakEl) {
        const prev = parseInt(streakEl.dataset.value || "0", 10);
        streakEl.dataset.value = stats.streak;
        Utils.animateCounter(streakEl, prev, stats.streak, 800, "🔥 ", stats.streak === 1 ? ' día' : ' días');
    }
    if (dominioEl) {
        const prev = parseInt(dominioEl.dataset.value || "0", 10);
        dominioEl.dataset.value = masteryPercent;
        Utils.animateCounter(dominioEl, prev, masteryPercent, 800, "", "%");
    }
    if (progressFillEl) {
        progressFillEl.style.width = `${masteryPercent}%`;
    }
    if (reviewsEl) {
        const prev = parseInt(reviewsEl.dataset.value || "0", 10);
        reviewsEl.dataset.value = stats.totalReviews;
        Utils.animateCounter(reviewsEl, prev, stats.totalReviews, 800, "", "");
    }

    // Renderizar Gamificación
    const gamificationContainer = document.getElementById('gamificationContainer');
    if (gamificationContainer) {
        UiGamification.renderLevelBadge(gamificationContainer);
    }
}

// Drag and Drop implementation
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    const dragOverlay = document.getElementById('dragOverlay');
    if (!dropZone) return;

    // Window-level Drag & Drop Overlay
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        if (dragOverlay) dragOverlay.classList.add('active');
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    if (dragOverlay) {
        dragOverlay.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null || e.target === dragOverlay) {
                dragOverlay.classList.remove('remove');
                dragOverlay.classList.remove('active');
            }
        });

        dragOverlay.addEventListener('drop', (e) => {
            e.preventDefault();
            dragOverlay.classList.remove('active');
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0 && (files[0].name.endsWith('.csv') || files[0].name.endsWith('.txt'))) {
                processCsvFile(files[0]);
            }
        });
    }

    // Original Drop Zone Card
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.background = 'var(--surface-variant)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.style.background = 'var(--container)';
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0 && (files[0].name.endsWith('.csv') || files[0].name.endsWith('.txt'))) {
            processCsvFile(files[0]);
        }
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processCsvFile(file);
    }
}

function processCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const parsedData = Parser.parseImportedCsv(text);
        
        if (parsedData.errors && parsedData.errors.length > 0) {
            const errorMsg = `Se encontraron algunas advertencias al importar:\n\n` + 
                             parsedData.errors.slice(0, 5).join('\n') + 
                             (parsedData.errors.length > 5 ? `\n... y otros ${parsedData.errors.length - 5} errores más.` : '');
            alert(errorMsg);
        }

        if (parsedData.entries.length > 0) {
            UiModal.openPracticeModal(parsedData);
        } else {
            alert("No se pudieron encontrar entradas válidas en el archivo CSV.");
        }
    };
    reader.readAsText(file);
}

function saveActiveDeckToLibrary() {
    const deck = UiModal.getImportedTableData();
    const msg = Library.saveActiveDeckToLibrary(deck);
    if (msg) {
        alert(msg);
        DecksPage.refresh();
    }
}

function deleteCustomDeck(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este mazo de tu biblioteca? Se perderán las estadísticas del mazo.")) return;
    Library.deleteCustomDeck(id, () => {
        DecksPage.refresh();
        updateStatsUI();
    });
}

function initAuth() {
    const btnAuthModal = document.getElementById('btnAuthModal');
    const authModal = document.getElementById('authModal');
    const btnAuthClose = document.getElementById('btnAuthClose');
    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authErrorMessage = document.getElementById('authErrorMessage');
    const btnSubmitSignUp = document.getElementById('btnSubmitSignUp');
    const authLoggedInState = document.getElementById('authLoggedInState');
    const loggedInUserEmail = document.getElementById('loggedInUserEmail');
    const btnSubmitSignOut = document.getElementById('btnSubmitSignOut');

    if (!btnAuthModal) return;

    // Open Modal
    btnAuthModal.addEventListener('click', () => {
        authModal.style.display = 'flex';
    });

    // Close Modal
    const closeModal = () => {
        authModal.style.display = 'none';
        if (authErrorMessage) {
            authErrorMessage.style.display = 'none';
            authErrorMessage.innerText = '';
        }
    };
    if (btnAuthClose) btnAuthClose.addEventListener('click', closeModal);
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) closeModal();
    });

    // Listen to Auth State Changes
    SupabaseSync.onAuthStateChange(async (event, session) => {
        if (session?.user) {
            // Logged In State UI
            btnAuthModal.innerText = `☁️ Sincronizado`;
            btnAuthModal.classList.add('logged-in');
            
            if (authForm) authForm.style.display = 'none';
            if (authLoggedInState) authLoggedInState.style.display = 'flex';
            if (loggedInUserEmail) loggedInUserEmail.innerText = session.user.email;

            // Download progress from cloud to overwrite local storage if exists
            const downloaded = await SupabaseSync.syncCloudToLocal();
            if (downloaded) {
                DecksPage.refresh();
                updateStatsUI();
            } else {
                // If first time login, push current local data to cloud
                await SupabaseSync.syncLocalToCloud();
            }
        } else {
            // Logged Out State UI
            btnAuthModal.innerText = `☁️ Conectar Nube`;
            btnAuthModal.classList.remove('logged-in');

            if (authForm) {
                authForm.style.display = 'flex';
                authForm.reset();
            }
            if (authLoggedInState) authLoggedInState.style.display = 'none';
            if (loggedInUserEmail) loggedInUserEmail.innerText = '';
        }
    });

    // Form Submissions
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (authErrorMessage) authErrorMessage.style.display = 'none';
            try {
                await SupabaseSync.signIn(authEmail.value, authPassword.value);
                closeModal();
            } catch (error) {
                if (authErrorMessage) {
                    authErrorMessage.innerText = `Error: ${error.message}`;
                    authErrorMessage.style.display = 'block';
                }
            }
        });
    }

    // Sign Up Button
    if (btnSubmitSignUp) {
        btnSubmitSignUp.addEventListener('click', async (e) => {
            e.preventDefault();
            if (authForm && !authForm.reportValidity()) return;
            if (authErrorMessage) authErrorMessage.style.display = 'none';
            try {
                await SupabaseSync.signUp(authEmail.value, authPassword.value);
                alert('¡Registro exitoso! Por favor, verifica tu correo e inicia sesión.');
            } catch (error) {
                if (authErrorMessage) {
                    authErrorMessage.innerText = `Error al registrarse: ${error.message}`;
                    authErrorMessage.style.display = 'block';
                }
            }
        });
    }

    // Sign Out
    if (btnSubmitSignOut) {
        btnSubmitSignOut.addEventListener('click', async () => {
            try {
                await SupabaseSync.signOut();
                closeModal();
                DecksPage.refresh();
                updateStatsUI();
            } catch (error) {
                alert(`Error al cerrar sesión: ${error.message}`);
            }
        });
    }
}
