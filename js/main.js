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
import * as Fx from './modules/fx.js';
import './modules/ui-streak.js';
import * as Difficulty from './modules/difficulty-manager.js';
import { AppStore } from './modules/state.js';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    UiModal.init(); 
    DecksPage.init(UiModal.openPracticeModal, deleteCustomDeck);
    setupDragAndDrop();
    setupEventListeners();
    updateStatsUI();
    initAuth();
    initDifficultySettings();
    loadLatestUpdates();
    setupKeyboardShortcuts();
    setupViewToggles();

    // Suscribir la UI al almacén de estado reactivo
    AppStore.subscribe(() => {
        updateStatsUI();
    });

    // Registro de Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            // updateViaCache: 'none' asegura que el navegador siempre descargue el sw.js de la red, no de la caché HTTP
            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
                .then(reg => {
                    console.log('🚀 Service Worker registrado con éxito:', reg.scope);

                    // Forzar comprobación de actualización cada vez que el usuario vuelve a la pestaña
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') {
                            reg.update();
                        }
                    });

                    // Comprobar actualizaciones manualmente cada hora
                    setInterval(() => reg.update(), 1000 * 60 * 60);

                    // Detectar si hay una actualización disponible
                    reg.onupdatefound = () => {
                        const installingWorker = reg.installing;
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // Nueva versión instalada y lista para activarse
                                console.log('✨ Nueva actualización disponible. Recargando...');
                                setTimeout(() => window.location.reload(), 1000);
                            }
                        };
                    };
                })
                .catch(err => console.warn('❌ Error al registrar Service Worker:', err));
        });

        // Evento cuando el Service Worker toma el control (post-skipWaiting)
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                window.location.reload();
                refreshing = true;
            }
        });
    }

    // Lógica de Instalación PWA
    let deferredPrompt;
    const installCard = document.getElementById('pwaInstallCard');

    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevenir que Chrome 67 y anteriores muestren el prompt automáticamente
        e.preventDefault();
        // Guardar el evento para dispararlo más tarde
        deferredPrompt = e;
        // Mostrar la tarjeta de instalación
        if (installCard) installCard.style.display = 'flex';
    });

    if (installCard) {
        installCard.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            // Mostrar el prompt de instalación
            deferredPrompt.prompt();
            // Esperar a la respuesta del usuario
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`💻 Usuario eligió instalar: ${outcome}`);
            // Resetear el prompt
            deferredPrompt = null;
            // Ocultar la tarjeta
            installCard.style.display = 'none';
        });
    }
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
        closeBtn.addEventListener('click', () => UiModal.closeModal());
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
}

function initDifficultySettings() {
    const btnOpen = document.getElementById('btnDifficultyModal');
    const modal = document.getElementById('difficultyModal');
    const btnClose = document.getElementById('btnDifficultyClose');
    const btnSave = document.getElementById('btnSaveDifficulty');
    
    const modeLinear = document.getElementById('modeLinear');
    const modeProgressive = document.getElementById('modeProgressive');
    const linearLevels = document.getElementById('linearLevels');
    const progressiveInfo = document.getElementById('progressiveInfo');
    const diffChips = document.querySelectorAll('.diff-chip');

    if (!btnOpen || !modal) return;

    let currentSettings = Difficulty.getSettings();

    const updateUI = () => {
        if (currentSettings.mode === Difficulty.DIFFICULTY_MODES.LINEAR) {
            modeLinear.classList.add('srs-btn-good');
            modeLinear.classList.remove('srs-btn-again');
            modeProgressive.classList.remove('srs-btn-good');
            linearLevels.style.display = 'block';
            progressiveInfo.style.display = 'none';
        } else {
            modeProgressive.classList.add('srs-btn-good');
            modeLinear.classList.remove('srs-btn-good');
            linearLevels.style.display = 'none';
            progressiveInfo.style.display = 'block';
        }

        diffChips.forEach(chip => {
            if (chip.dataset.level === currentSettings.level) {
                chip.style.background = 'var(--primary-container)';
                chip.style.color = 'var(--on-primary-container)';
            } else {
                chip.style.background = 'transparent';
                chip.style.color = 'var(--on-surface)';
            }
        });
    };

    btnOpen.onclick = () => {
        currentSettings = Difficulty.getSettings();
        updateUI();
        modal.style.display = 'flex';
    };

    btnClose.onclick = () => modal.style.display = 'none';

    modeLinear.onclick = () => {
        currentSettings.mode = Difficulty.DIFFICULTY_MODES.LINEAR;
        updateUI();
    };

    modeProgressive.onclick = () => {
        currentSettings.mode = Difficulty.DIFFICULTY_MODES.PROGRESSIVE;
        updateUI();
    };

    diffChips.forEach(chip => {
        chip.onclick = () => {
            currentSettings.level = chip.dataset.level;
            updateUI();
        };
    });

    btnSave.onclick = () => {
        Difficulty.saveSettings(currentSettings);
        modal.style.display = 'none';
        Fx.playSound('success');
    };
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
    const btnOpenAuthFromGuest = document.getElementById('btnOpenAuthFromGuest');
    const authModal = document.getElementById('authModal');
    const btnAuthClose = document.getElementById('btnAuthClose');
    const authForm = document.getElementById('authForm');
    const authEmail = document.getElementById('authEmail');
    const authPassword = document.getElementById('authPassword');
    const authErrorMessage = document.getElementById('authErrorMessage');
    const btnSubmitSignUp = document.getElementById('btnSubmitSignUp');
    const authLoggedInState = document.getElementById('authLoggedInState');
    const btnSubmitSignOut = document.getElementById('btnSubmitSignOut');

    if (!btnAuthModal) return;

    // Open Modal
    const openAuth = () => {
        if (authModal) {
            authModal.style.display = 'flex';
            // Use a timeout to ensure display:flex is applied before the CSS transition
            setTimeout(() => authModal.classList.add('active'), 10);
            console.log('☁️ Abriendo modal de autenticación');
        } else {
            console.error('❌ No se encontró el modal authModal');
        }
    };

    btnAuthModal.addEventListener('click', openAuth);
    if (btnOpenAuthFromGuest) {
        btnOpenAuthFromGuest.addEventListener('click', openAuth);
    }

    // Close Modal
    const closeModal = () => {
        if (authModal) {
            authModal.classList.remove('active');
            // Hide display after transition
            setTimeout(() => {
                if (!authModal.classList.contains('active')) {
                    authModal.style.display = 'none';
                }
            }, 350);
        }
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
        handleAuthUpdate(session);
        if (session && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    });

    // Initial session check (forces hash parsing if present from email links)
    SupabaseSync.supabase.auth.getSession().then(({data}) => {
        if (data && data.session) {
            handleAuthUpdate(data.session);
            if (window.location.hash.includes('access_token')) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        }
    });

    async function handleAuthUpdate(session) {
        const profileCard = document.getElementById('userProfileCard');
        const guestCard = document.getElementById('guestProfileCard');
        const userAvatar = document.getElementById('userAvatar');
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmailLabel = document.getElementById('userEmailLabel');
        const btnEditProfile = document.getElementById('btnEditProfile');

        // Modal Elements
        const modalProfileAvatar = document.getElementById('modalProfileAvatar');
        const modalProfileName = document.getElementById('modalProfileName');
        const modalProfileEmail = document.getElementById('modalProfileEmail');
        const profileDefaultView = document.getElementById('profileDefaultView');
        const profileEditForm = document.getElementById('profileEditForm');
        const btnShowEditProfile = document.getElementById('btnShowEditProfile');
        const btnCancelEditProfile = document.getElementById('btnCancelEditProfile');
        const btnSaveProfile = document.getElementById('btnSaveProfile');
        const editDisplayName = document.getElementById('editDisplayName');
        const editAvatarUrl = document.getElementById('editAvatarUrl');

        if (session?.user) {
            const user = session.user;
            const metadata = user.user_metadata || {};

            // Logged In State UI (Sidebar)
            btnAuthModal.innerText = `☁️ Sincronizado`;
            btnAuthModal.classList.add('logged-in');
            
            if (authForm) authForm.style.display = 'none';
            if (authLoggedInState) authLoggedInState.style.display = 'flex';

            // Update Cards Visibility
            if (guestCard) guestCard.style.display = 'none';
            if (profileCard) profileCard.style.display = 'flex';
            
            if (userDisplayName) userDisplayName.innerText = metadata.display_name || 'Estudiante';
            if (userAvatar) userAvatar.innerText = metadata.avatar_url || '👤';
            if (userEmailLabel) userEmailLabel.innerText = user.email;

            // Update Modal Profile View
            if (modalProfileName) modalProfileName.innerText = metadata.display_name || 'Estudiante';
            if (modalProfileAvatar) modalProfileAvatar.innerText = metadata.avatar_url || '👤';
            if (modalProfileEmail) modalProfileEmail.innerText = user.email;

            // Handle Profile View Switching
            if (btnEditProfile) btnEditProfile.onclick = () => { authModal.style.display = 'flex'; setTimeout(() => authModal.classList.add('active'), 10); };
            
            if (btnShowEditProfile) {
                btnShowEditProfile.onclick = () => {
                    profileDefaultView.style.display = 'none';
                    profileEditForm.style.display = 'flex';
                    if (editDisplayName) editDisplayName.value = modalProfileName.innerText;
                    if (editAvatarUrl) editAvatarUrl.value = modalProfileAvatar.innerText;
                };
            }

            if (btnCancelEditProfile) {
                btnCancelEditProfile.onclick = () => {
                    profileDefaultView.style.display = 'flex';
                    profileEditForm.style.display = 'none';
                };
            }

            if (btnSaveProfile) {
                btnSaveProfile.onclick = async () => {
                    const newName = editDisplayName.value.trim();
                    const newAvatar = editAvatarUrl.value.trim();
                    
                    try {
                        btnSaveProfile.disabled = true;
                        btnSaveProfile.innerText = 'Guardando...';
                        await SupabaseSync.updateProfile(newName, newAvatar);
                        
                        // Local update for immediate feedback
                        if (userDisplayName) userDisplayName.innerText = newName || 'Estudiante';
                        if (userAvatar) userAvatar.innerText = newAvatar || '👤';
                        if (modalProfileName) modalProfileName.innerText = newName || 'Estudiante';
                        if (modalProfileAvatar) modalProfileAvatar.innerText = newAvatar || '👤';
                        
                        profileDefaultView.style.display = 'flex';
                        profileEditForm.style.display = 'none';
                        alert('¡Perfil actualizado con éxito!');
                    } catch (e) {
                        alert('Error al actualizar: ' + e.message);
                    } finally {
                        btnSaveProfile.disabled = false;
                        btnSaveProfile.innerText = 'Guardar Cambios';
                    }
                };
            }

            // Download progress from cloud
            const downloaded = await SupabaseSync.syncCloudToLocal();
            if (downloaded) {
                DecksPage.refresh();
                updateStatsUI();
            } else {
                await SupabaseSync.syncLocalToCloud();
            }
        } else {
            // Logged Out State UI
            btnAuthModal.innerText = `☁️ Conectar Nube`;
            btnAuthModal.classList.remove('logged-in');

            // Update Cards Visibility
            if (guestCard) guestCard.style.display = 'flex';
            if (profileCard) profileCard.style.display = 'none';

            if (authForm) {
                authForm.style.display = 'flex';
                authForm.reset();
            }
            if (authLoggedInState) authLoggedInState.style.display = 'none';
        }
    }

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

/**
 * Sets up global keyboard shortcuts for Desktop UX.
 */
function setupKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
        const modalActive = document.getElementById('practiceModal').classList.contains('active');
        
        // 1. NAVIGATION MODE (Grid Explorer)
        if (!modalActive) {
            // Quick Search Shortcut (Ctrl+K)
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
                e.preventDefault();
                const searchInput = document.getElementById('decksSearchInput') || document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                    searchInput.select();
                }
                return;
            }

            const cards = Array.from(document.querySelectorAll('.deck-card, .folder-card-wrapper'));
            if (cards.length === 0) return;

            let currentFocus = document.activeElement;
            let index = cards.indexOf(currentFocus);

            if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.code)) {
                e.preventDefault();
                if (index === -1) {
                    cards[0].focus();
                    return;
                }

                const grid = document.getElementById('explorerGrid');
                const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;

                switch (e.code) {
                    case 'ArrowRight': index = Math.min(index + 1, cards.length - 1); break;
                    case 'ArrowLeft': index = Math.max(index - 1, 0); break;
                    case 'ArrowDown': index = Math.min(index + cols, cards.length - 1); break;
                    case 'ArrowUp': index = Math.max(index - cols, 0); break;
                }
                cards[index].focus();
            }

            if (e.code === 'Enter' && index !== -1) {
                currentFocus.click();
            }
            return;
        }

        // 2. STUDY MODE (Modal Active)
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                const revealBtn = document.getElementById('modalBtnReveal');
                if (revealBtn && revealBtn.offsetParent !== null) {
                    revealBtn.click();
                } else {
                    const goodBtn = document.querySelector('.srs-btn-good');
                    if (goodBtn) goodBtn.click();
                }
                break;
            case 'Digit1':
            case 'Numpad1':
                const againBtn = document.querySelector('.srs-btn-again');
                if (againBtn) againBtn.click();
                break;
            case 'Digit2':
            case 'Numpad2':
                const okBtn = document.querySelector('.srs-btn-good');
                if (okBtn) okBtn.click();
                break;
            case 'Escape':
                UiModal.closeModal();
                break;
        }
    });
}

/**
 * Handles the Grid/List view switching.
 */
function setupViewToggles() {
    const container = document.getElementById('viewToggles');
    const grid = document.getElementById('explorerGrid');
    if (!container || !grid) return;

    container.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => {
            container.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.dataset.view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
        };
    });
}

/**
 * Loads the latest updates from data/updates.json and renders them.
 */
async function loadLatestUpdates() {
    const titleEl = document.getElementById('updateTitle');
    const listEl = document.getElementById('updateList');
    if (!listEl) return;

    try {
        const response = await fetch('data/updates.json');
        if (!response.ok) throw new Error('No se pudo cargar el archivo de novedades');
        
        const updates = await response.json();
        if (!updates || updates.length === 0) return;

        const latest = updates[0];
        if (titleEl) titleEl.innerText = `✨ Novedades ${latest.version}`;

        listEl.innerHTML = latest.items.map(item => `<li>${item}</li>`).join('');
    } catch (error) {
        console.warn('❌ Error al cargar novedades dinámicas:', error);
        // Fallback or leave skeleton
        listEl.innerHTML = '<li style="opacity:0.5;">No hay novedades recientes.</li>';
    }
}

