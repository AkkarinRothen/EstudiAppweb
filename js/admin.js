// Admin Panel Logic for EstudiApp
import * as Utils from './modules/utils.js';
import * as GitHub from './modules/github.js';
import * as Template from './modules/template.js';
import * as AdminManager from './modules/admin-manager.js';
import * as Storage from './modules/storage.js';

// Seguridad / Login (Client-Side Hashing)
// Hashes para Usuario: AkkarinRothen | Pass: Mily2505
const expectedUserHash = "a27b081436cabe3e7a2774b46e663a373d8fd769446d981c525155745879e557";
const expectedPassHash = "b8fbc28f6a067474710ea06018665c0615999fa201bd2adc6236ee1db76e92f2";

// Image Search State
let activeSearchRow = null;
let activeLockId = 0;
let activeSearchTerm = "";

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏁 Admin Initializing...');
    
    // Intentar auto-login si ya hay sesión
    const sessionPass = Storage.getSessionPassword();
    if (sessionPass && sessionPass.includes(":")) {
        console.log('🔄 Detectada sesión previa. Intentando auto-login...');
        const [user, pass] = sessionPass.split(":");
        await performLogin(user, pass);
    }

    setupEventListeners();
});

async function checkLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    console.log('🛡️ Validando credenciales para:', user);
    await performLogin(user, pass);
}

async function performLogin(user, pass) {
    const errDiv = document.getElementById('loginError');
    if (!user || !pass) {
        if (errDiv) errDiv.style.display = 'block';
        return;
    }

    const userHash = await Utils.sha256(user);
    const passHash = await Utils.sha256(pass);

    if (userHash === expectedUserHash && passHash === expectedPassHash) {
        Storage.setSessionPassword(user + ":" + pass);
        
        const overlay = document.getElementById('loginOverlay');
        if (overlay) overlay.style.display = 'none';
        
        const mainContent = document.getElementById('mainAdminContent');
        if (mainContent) mainContent.style.display = 'flex';
        
        showStatus(`👋 ¡Bienvenido, ${user}! Sesión activa.`, 'success');
        
        const headerTitle = document.querySelector('header h1');
        if (headerTitle && !headerTitle.innerHTML.includes('🛡️')) {
            headerTitle.innerHTML += ' <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:12px; vertical-align:middle; margin-left:10px;">🛡️ Modo Editor</span>';
        }

        await loadAuth();
    } else {
        console.warn('❌ Credenciales inválidas');
        if (errDiv) errDiv.style.display = 'block';
        const passInput = document.getElementById('loginPass');
        if (passInput) passInput.value = '';
        Storage.setSessionPassword("");
    }
}

function setupEventListeners() {
    const loginBtn = document.getElementById('btnLoginAcceder');
    if (loginBtn) {
        loginBtn.addEventListener('click', checkLogin);
    }

    const loginPass = document.getElementById('loginPass');
    if (loginPass) {
        loginPass.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkLogin();
        });
    }

    // Bulk selection
    const selectAllRows = document.getElementById('selectAllRows');
    if (selectAllRows) {
        selectAllRows.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.row-selector');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    // AI Actions
    const aiTranslateBtn = document.getElementById('aiTranslateBtn');
    if (aiTranslateBtn) {
        aiTranslateBtn.addEventListener('click', () => translateWithAI());
    }

    const aiGenerateExamplesBtn = document.getElementById('aiGenerateExamplesBtn');
    if (aiGenerateExamplesBtn) {
        aiGenerateExamplesBtn.addEventListener('click', () => generateExamplesWithAI());
    }

    // GitHub Config
    const ghHeader = document.querySelector('.collapsible-header');
    if (ghHeader) {
        ghHeader.addEventListener('click', () => toggleGithubCollapse());
    }

    const ghSaveBtn = document.getElementById('ghSaveBtn');
    if (ghSaveBtn) {
        ghSaveBtn.addEventListener('click', () => saveAuth());
    }

    // Tabs switching
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // OCR
    const ocrInput = document.getElementById('ocrImageInput');
    if (ocrInput) {
        ocrInput.addEventListener('change', (e) => loadOcrImage(e));
    }

    const runOcrBtn = document.getElementById('btnRunOcr');
    if (runOcrBtn) {
        runOcrBtn.addEventListener('click', () => runOcr());
    }

    // Table Actions
    const addRowBtn = document.getElementById('addTableRowBtn');
    if (addRowBtn) {
        addRowBtn.addEventListener('click', () => addTableRow());
    }

    const clearTableBtn = document.getElementById('clearTableBtn');
    if (clearTableBtn) {
        clearTableBtn.addEventListener('click', () => clearTable());
    }

    const deleteSelectedRowsBtn = document.getElementById('deleteSelectedRowsBtn');
    if (deleteSelectedRowsBtn) {
        deleteSelectedRowsBtn.addEventListener('click', () => {
            const tbody = document.getElementById('vocabTableBody');
            const checkboxes = Array.from(tbody.querySelectorAll('.row-selector:checked'));
            if (checkboxes.length === 0) {
                alert('Por favor selecciona al menos una fila para eliminar.');
                return;
            }
            if (confirm(`¿Estás seguro de que quieres eliminar las ${checkboxes.length} filas seleccionadas?`)) {
                checkboxes.forEach(cb => {
                    const tr = cb.closest('tr');
                    if (tr) tr.remove();
                });
                updateDiceFormula();
                document.getElementById('selectAllRows').checked = false;
            }
        });
    }

    // Image Search Popover Actions
    const btnNext = document.getElementById('btnImageSearchNext');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            activeLockId = Math.floor(Math.random() * 10000) + 1;
            updatePopoverImage();
        });
    }

    const btnImageSearchQuerySubmit = document.getElementById('btnImageSearchQuerySubmit');
    const imageSearchInput = document.getElementById('imageSearchInput');
    if (btnImageSearchQuerySubmit && imageSearchInput) {
        btnImageSearchQuerySubmit.addEventListener('click', () => {
            const val = imageSearchInput.value.trim();
            if (val) {
                activeSearchTerm = val;
                activeLockId = Math.floor(Math.random() * 10000) + 1;
                updatePopoverImage();
            }
        });
        imageSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btnImageSearchQuerySubmit.click();
            }
        });
    }

    const btnConfirm = document.getElementById('btnImageSearchConfirm');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            if (activeSearchRow) {
                const keyword = Utils.extractImageKeyword(activeSearchTerm);
                const finalUrl = `https://loremflickr.com/320/240/${encodeURIComponent(keyword)}?lock=${activeLockId}`;
                
                activeSearchRow._existingImgUrl = finalUrl;
                delete activeSearchRow._imageWebpBase64;
                
                const thumbImg = activeSearchRow.querySelector('.vocab-img-thumb');
                const placeholder = activeSearchRow.querySelector('.vocab-img-placeholder');
                const removeBtn = activeSearchRow.querySelector('.btn-img-remove');
                
                thumbImg.src = finalUrl;
                thumbImg.style.display = 'block';
                placeholder.style.display = 'none';
                placeholder.innerText = "📷";
                removeBtn.style.display = 'inline-block';
            }
            closeImageSearchPopover();
        });
    }

    const btnCancel = document.getElementById('btnImageSearchCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            closeImageSearchPopover();
        });
    }

    const publishBtn = document.getElementById('btnPublish');
    if (publishBtn) {
        publishBtn.addEventListener('click', () => publishPack());
    }

    const btnAdminLogout = document.getElementById('btnAdminLogout');
    if (btnAdminLogout) {
        btnAdminLogout.addEventListener('click', () => {
            if (confirm('¿Cerrar sesión del panel de administración?')) {
                Storage.setSessionPassword("");
                window.location.reload();
            }
        });
    }

    // Task Validator
    const verifyBtn = document.getElementById('btnVerifyCode');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => verifyStudentCode());
    }
}

async function saveAuth() {
    const owner = document.getElementById('ghOwner').value.trim();
    const repo = document.getElementById('ghRepo').value.trim();
    const token = document.getElementById('ghToken').value.trim();
    const geminiKey = document.getElementById('geminiApiKey').value.trim();

    if (!owner || !repo || !token) {
        showStatus('Por favor completa todos los campos de GitHub.', 'error');
        return;
    }

    localStorage.setItem('gh_owner', owner);
    localStorage.setItem('gh_repo', repo);

    const sessionPass = Storage.getSessionPassword();
    const encryptedToken = await Storage.encryptText(token, sessionPass);
    if (encryptedToken) {
        localStorage.setItem('gh_token_encrypted', encryptedToken);
        localStorage.removeItem('gh_token');
        
        if (geminiKey) {
            const encryptedGemini = await Storage.encryptText(geminiKey, sessionPass);
            if (encryptedGemini) {
                localStorage.setItem('gemini_api_key_encrypted', encryptedGemini);
            }
        } else {
            localStorage.removeItem('gemini_api_key_encrypted');
        }
        
        showStatus('Credenciales guardadas y cifradas en tu navegador.', 'success');
    } else {
        showStatus('Error al cifrar el token.', 'error');
    }
}

function toggleGithubCollapse() {
    const content = document.getElementById('ghCollapsibleContent');
    const chevron = document.getElementById('ghChevron');
    content.classList.toggle('expanded');
    chevron.classList.toggle('rotated');
}

function processImageToWebp(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const maxDim = 480;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = (maxDim / w) * h;
                        w = maxDim;
                    } else {
                        w = (maxDim / h) * w;
                        h = maxDim;
                    }
                }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error("WebP compression failed"));
                    }
                }, 'image/webp', 0.8);
            };
            img.onerror = () => reject(new Error("Failed to load image resource"));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

function addTableRow(es = '', en = '', imgUrl = '') {
    const tbody = document.getElementById('vocabTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="text-align: center;"><input type="checkbox" class="row-selector"></td>
        <td><input type="text" class="vocab-es" value="${es.replace(/"/g, '&quot;')}" placeholder="ej: El perro"></td>
        <td><input type="text" class="vocab-en" value="${en.replace(/"/g, '&quot;')}" placeholder="ej: The dog"></td>
        <td>
            <div class="vocab-img-wrapper">
                <div class="vocab-img-preview" title="Haga clic para subir una imagen">
                    <span class="vocab-img-placeholder">📷</span>
                    <img class="vocab-img-thumb" style="display: none;" />
                </div>
                <button type="button" class="btn-img-search" title="Buscar imagen en internet">🔍</button>
                <button type="button" class="btn-img-remove" style="display: none;" title="Eliminar imagen">✕</button>
                <input type="file" class="vocab-img-input" accept="image/*" style="display:none">
            </div>
        </td>
        <td style="text-align: center;"><button type="button" class="btn-row-delete">×</button></td>
    `;
    
    tr.querySelector('.btn-row-delete').addEventListener('click', () => {
        tr.remove();
        updateDiceFormula();
    });

    tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateDiceFormula);
    });

    const esInput = tr.querySelector('.vocab-es');
    const enInput = tr.querySelector('.vocab-en');
    esInput.addEventListener('paste', (e) => handleTablePaste(e, esInput, true));
    enInput.addEventListener('paste', (e) => handleTablePaste(e, enInput, false));

    const imgPreview = tr.querySelector('.vocab-img-preview');
    const imgInput = tr.querySelector('.vocab-img-input');
    const thumbImg = tr.querySelector('.vocab-img-thumb');
    const placeholder = tr.querySelector('.vocab-img-placeholder');
    const removeBtn = tr.querySelector('.btn-img-remove');
    const searchBtn = tr.querySelector('.btn-img-search');

    imgPreview.addEventListener('click', () => {
        imgInput.click();
    });

    // Drag and Drop Support for Images
    imgPreview.addEventListener('dragover', (e) => {
        e.preventDefault();
        imgPreview.classList.add('drag-over');
    });
    imgPreview.addEventListener('dragleave', () => imgPreview.classList.remove('drag-over'));
    imgPreview.addEventListener('drop', async (e) => {
        e.preventDefault();
        imgPreview.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file, tr);
        }
    });

    searchBtn.addEventListener('click', () => {
        openImageSearchPopover(tr);
    });

    imgInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        handleImageUpload(file, tr);
    });

    removeBtn.addEventListener('click', () => {
        delete tr._imageWebpBase64;
        delete tr._existingImgUrl;
        imgInput.value = "";
        thumbImg.removeAttribute('src');
        thumbImg.style.display = 'none';
        placeholder.style.display = 'block';
        removeBtn.style.display = 'none';
    });

    if (imgUrl) {
        tr._existingImgUrl = imgUrl;
        thumbImg.src = imgUrl;
        thumbImg.style.display = 'block';
        placeholder.style.display = 'none';
        removeBtn.style.display = 'inline-block';
    }

    tbody.appendChild(tr);
    updateDiceFormula();
}

async function handleImageUpload(file, tr) {
    const thumbImg = tr.querySelector('.vocab-img-thumb');
    const placeholder = tr.querySelector('.vocab-img-placeholder');
    const removeBtn = tr.querySelector('.btn-img-remove');

    try {
        placeholder.innerText = "⏳";
        const webpBlob = await processImageToWebp(file);
        const base64Reader = new FileReader();
        base64Reader.onloadend = () => {
            const base64data = base64Reader.result;
            tr._imageWebpBase64 = base64data;
            delete tr._existingImgUrl;
            thumbImg.src = base64data;
            thumbImg.style.display = 'block';
            placeholder.style.display = 'none';
            placeholder.innerText = "📷";
            removeBtn.style.display = 'inline-block';
        };
        base64Reader.readAsDataURL(webpBlob);
    } catch (err) {
        console.error(err);
        alert("Error al procesar la imagen: " + err.message);
        placeholder.innerText = "📷";
    }
}

function clearTable() {
    if (confirm('¿Estás seguro de que quieres limpiar toda la tabla?')) {
        document.getElementById('vocabTableBody').innerHTML = '';
        updateDiceFormula();
    }
}

function updateDiceFormula() {
    const tbody = document.getElementById('vocabTableBody');
    const rowCount = tbody.querySelectorAll('tr').length;
    const formulaInput = document.getElementById('packFormula');
    if (formulaInput) {
        formulaInput.value = `1d${rowCount > 0 ? rowCount : 6}`;
    }
}

async function loadAuth() {
    const owner = localStorage.getItem('gh_owner') || '';
    const repo = localStorage.getItem('gh_repo') || '';
    const token = await Storage.getDecryptedToken() || '';
    
    // Decrypt Gemini Key
    let geminiKey = '';
    const encryptedGemini = localStorage.getItem('gemini_api_key_encrypted');
    const sessionPass = Storage.getSessionPassword();
    if (encryptedGemini && sessionPass) {
        geminiKey = await Storage.decryptText(encryptedGemini, sessionPass) || '';
    }
    
    document.getElementById('ghOwner').value = owner;
    document.getElementById('ghRepo').value = repo;
    document.getElementById('ghToken').value = token;
    document.getElementById('geminiApiKey').value = geminiKey;
    
    const content = document.getElementById('ghCollapsibleContent');
    const chevron = document.getElementById('ghChevron');
    if (owner && repo && token) {
        content.classList.remove('expanded');
        chevron.classList.add('rotated');
    } else {
        content.classList.add('expanded');
        chevron.classList.remove('rotated');
    }
    
    const tbody = document.getElementById('vocabTableBody');
    if (tbody && tbody.querySelectorAll('tr').length === 0) {
        addTableRow('', '');
    }
}

function handleTablePaste(e, inputEl, isEs) {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData.includes('\t') && !pasteData.includes('\n') && !pasteData.includes('\r')) {
        return;
    }
    
    e.preventDefault();
    const rawRows = pasteData.split(/\r?\n/);
    const rows = rawRows.filter((r, idx) => r.trim() !== '' || idx < rawRows.length - 1);
    if (rows.length === 0) return;
    
    const tr = inputEl.closest('tr');
    if (!tr) return;
    
    rows.forEach((rowText, idx) => {
        let esVal = '';
        let enVal = '';
        let imgVal = '';
        
        if (rowText.includes('\t')) {
            const cols = rowText.split('\t');
            esVal = cols[0] || '';
            enVal = cols[1] || '';
            imgVal = cols[2] || '';
        } else {
            if (isEs) esVal = rowText; else enVal = rowText;
        }
        
        if (idx === 0) {
            if (esVal || !rowText.includes('\t')) tr.querySelector('.vocab-es').value = esVal;
            if (enVal || !rowText.includes('\t')) tr.querySelector('.vocab-en').value = enVal;
            if (imgVal) {
                tr._existingImgUrl = imgVal;
                delete tr._imageWebpBase64;
                const thumbImg = tr.querySelector('.vocab-img-thumb');
                const placeholder = tr.querySelector('.vocab-img-placeholder');
                const removeBtn = tr.querySelector('.btn-img-remove');
                thumbImg.src = imgVal;
                thumbImg.style.display = 'block';
                placeholder.style.display = 'none';
                placeholder.innerText = "📷";
                removeBtn.style.display = 'inline-block';
            }
        } else {
            addTableRow(esVal, enVal, imgVal);
        }
    });
    updateDiceFormula();
}

function openImageSearchPopover(tr) {
    const englishVal = tr.querySelector('.vocab-en').value.split('||')[0].trim();
    if (!englishVal) {
        alert("Por favor introduce un término en inglés antes de buscar una imagen.");
        return;
    }
    activeSearchRow = tr;
    activeSearchTerm = englishVal;
    activeLockId = Math.floor(Math.random() * 10000) + 1;
    document.getElementById('imageSearchQueryText').innerText = `Buscando imágenes para: "${englishVal}"`;
    const searchInput = document.getElementById('imageSearchInput');
    if (searchInput) searchInput.value = englishVal;
    document.getElementById('imageSearchPopover').style.display = 'flex';
    updatePopoverImage();
}

function updatePopoverImage() {
    const spinner = document.getElementById('imageSearchSpinner');
    const img = document.getElementById('imageSearchPreviewImg');
    spinner.style.display = 'block';
    img.style.display = 'none';
    const keyword = Utils.extractImageKeyword(activeSearchTerm);
    const imgUrl = `https://loremflickr.com/320/240/${encodeURIComponent(keyword)}?lock=${activeLockId}`;
    img.onload = () => { spinner.style.display = 'none'; img.style.display = 'block'; };
    img.onerror = () => { spinner.innerText = "Error al cargar la imagen."; };
    img.src = imgUrl;
}

function closeImageSearchPopover() {
    document.getElementById('imageSearchPopover').style.display = 'none';
    document.getElementById('imageSearchPreviewImg').src = "";
    activeSearchRow = null;
}

async function translateWithAI() {
    const geminiKey = document.getElementById('geminiApiKey').value.trim();
    if (!geminiKey) {
        showStatus('Por favor introduce tu Clave API de Gemini para usar esta función.', 'error');
        return;
    }
    const tbody = document.getElementById('vocabTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const selectedRows = rows.filter(row => row.querySelector('.row-selector')?.checked);
    const targets = selectedRows.length > 0 ? selectedRows : rows;
    const wordsToTranslate = targets.map((row, idx) => ({ index: idx, es: row.querySelector('.vocab-es').value.trim() })).filter(w => w.es !== "");
    if (wordsToTranslate.length === 0) {
        showStatus('No hay palabras en español para traducir.', 'error');
        return;
    }
    const btn = document.getElementById('aiTranslateBtn');
    btn.disabled = true; btn.innerText = "🤖 Traduciendo...";
    showStatus(`Traduciendo ${wordsToTranslate.length} términos con Gemini...`, 'warning');
    try {
        const prompt = `Traduce las siguientes palabras del español al inglés. Devuelve STRICTAMENTE un array JSON: [{"index": número, "en": "traducción"}] No incluyas nada más. Palabras: ${JSON.stringify(wordsToTranslate)}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });
        if (!response.ok) throw new Error('Error en la API de Gemini');
        const data = await response.json();
        const results = JSON.parse(data.candidates[0].content.parts[0].text.trim());
        results.forEach(res => {
            const row = targets[res.index];
            if (row) {
                const enInput = row.querySelector('.vocab-en');
                const currentVal = enInput.value.split('||');
                const example = currentVal.length > 1 ? ` || ${currentVal[1].trim()}` : '';
                enInput.value = res.en + example;
            }
        });
        showStatus(`¡Éxito! Se tradujeron ${results.length} términos.`, 'success');
    } catch (e) {
        console.error(e);
        showStatus('Error al traducir: ' + e.message, 'error');
    } finally {
        btn.disabled = false; btn.innerText = "🤖 Traducir (Gemini IA)";
    }
}

async function generateExamplesWithAI() {
    const geminiKey = document.getElementById('geminiApiKey').value.trim();
    if (!geminiKey) { showStatus('Por favor introduce tu Clave API de Gemini.', 'error'); return; }
    const tbody = document.getElementById('vocabTableBody');
    const rows = tbody.querySelectorAll('tr');
    let words = [];
    rows.forEach((row, idx) => {
        const esVal = row.querySelector('.vocab-es').value.trim();
        const enVal = row.querySelector('.vocab-en').value.split('||')[0].trim();
        if (esVal && enVal) words.push({ index: idx, es: esVal, en: enVal });
    });
    if (words.length === 0) { showStatus('Tabla vacía o incompleta.', 'error'); return; }
    const aiBtn = document.getElementById('aiGenerateExamplesBtn');
    aiBtn.disabled = true; aiBtn.innerText = "🤖 Generando...";
    try {
        const prompt = `Genera una frase de ejemplo en inglés corta y natural para cada palabra. Devuelve STRICTAMENTE un array JSON: [{"index": número, "example": "frase"}]. Palabras: ${JSON.stringify(words)}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
        });
        if (!response.ok) throw new Error('Error API Gemini');
        const data = await response.json();
        const results = JSON.parse(data.candidates[0].content.parts[0].text.trim());
        results.forEach(res => {
            const row = rows[res.index];
            if (row) {
                const enInput = row.querySelector('.vocab-en');
                const baseTranslation = enInput.value.split('||')[0].trim();
                enInput.value = `${baseTranslation} || ${res.example.trim()}`;
            }
        });
        showStatus(`¡Éxito! Ejemplos generados.`, 'success');
    } catch (err) { console.error(err); showStatus(`Error IA: ${err.message}`, 'error'); } finally {
        aiBtn.disabled = false; aiBtn.innerText = "🤖 Frases Ej. (Gemini IA)";
    }
}

function showStatus(msg, type) {
    const box = document.getElementById('statusBox');
    if (!box) return;
    box.style.display = 'block';
    box.className = type;
    box.innerText = msg;
}

async function publishPack() {
    const owner = localStorage.getItem('gh_owner');
    const repo = localStorage.getItem('gh_repo');
    const token = await Storage.getDecryptedToken();
    if (!owner || !repo || !token) { showStatus('Faltan credenciales GitHub.', 'error'); return; }

    const id = document.getElementById('packId').value.trim();
    const title = document.getElementById('packTitle').value.trim();
    const level = document.getElementById('packLevel').value;
    const category = document.getElementById('packCategory').value.trim();
    const desc = document.getElementById('packDesc').value.trim();
    const formula = document.getElementById('packFormula').value.trim();

    const tbody = document.getElementById('vocabTableBody');
    const rows = tbody.querySelectorAll('tr');
    let validEntries = [];
    rows.forEach((row, index) => {
        const esVal = row.querySelector('.vocab-es').value.trim();
        const enVal = row.querySelector('.vocab-en').value.trim();
        if (esVal && enVal) validEntries.push({ es: esVal, en: enVal, imageWebpBase64: row._imageWebpBase64 || null, existingImgUrl: row._existingImgUrl || null, index: index + 1 });
    });

    if (!id || !title || !desc || validEntries.length === 0) { showStatus('Faltan datos obligatorios.', 'error'); return; }
    const btn = document.getElementById('btnPublish');
    btn.disabled = true; btn.innerText = "Procesando...";

    try {
        let entriesJsonArray = [];
        let entriesForDatabaseFile = [];
        let i = 1;
        for (const entry of validEntries) {
            let parts = entry.en.split('||');
            let translation = parts[0].trim().replace(/"/g, '\\"');
            let exampleText = parts.length > 1 ? parts[1].trim().replace(/"/g, '\\"') : '';
            let imagePath = "";
            if (entry.imageWebpBase64) {
                const imageFilename = `assets/images/packs/${id}/${entry.index}.webp`;
                const base64Data = entry.imageWebpBase64.split(',')[1];
                await GitHub.githubPut(owner, repo, token, imageFilename, base64Data, `✨ custom image: ${entry.es}`);
                imagePath = imageFilename;
            } else if (entry.existingImgUrl) imagePath = entry.existingImgUrl;
            
            let mainText = `${entry.es.replace(/"/g, '\\"')} -> ${translation}`;
            if (imagePath) mainText += ` -> ${imagePath}`;
            entriesJsonArray.push(`{min:${i}, max:${i}, text:"${mainText}", example:"${exampleText}"}`);
            entriesForDatabaseFile.push({ min: i, max: i, text: mainText.replace(/\\"/g, '"'), example: exampleText.replace(/\\"/g, '"') });
            i++;
        }
        const entriesString = entriesJsonArray.join(',');
        const htmlContent = Template.generateHtml(title, desc, formula, entriesString);
        const encodedHtml = btoa(unescape(encodeURIComponent(htmlContent)));
        await GitHub.githubPut(owner, repo, token, `presets/${id}.html`, encodedHtml, `✨ pack: ${id}`);
        const databaseContent = JSON.stringify(entriesForDatabaseFile, null, 4);
        const encodedDatabase = btoa(unescape(encodeURIComponent(databaseContent)));
        const existingDatabase = await GitHub.githubGet(owner, repo, token, `data/vocab/${id}.json`);
        await GitHub.githubPut(owner, repo, token, `data/vocab/${id}.json`, encodedDatabase, `📦 vocab: ${id}`, existingDatabase?.sha);

        const currentJsonObj = await GitHub.githubGet(owner, repo, token, `data/packs.json`);
        let packs = currentJsonObj ? JSON.parse(decodeURIComponent(escape(atob(currentJsonObj.content)))) : [];
        const existingPackIndex = packs.findIndex(p => p.id === id);
        const packInfo = { id, title, level, desc, category, file: `presets/${id}.html`, coverKeyword: Utils.extractImageKeyword(validEntries[0].en.split('||')[0].trim()), type: "tabla" };
        if (existingPackIndex !== -1) packs[existingPackIndex] = packInfo; else packs.push(packInfo);
        const newJsonContent = JSON.stringify(packs, null, 4);
        const encodedJson = btoa(unescape(encodeURIComponent(newJsonContent)));
        await GitHub.githubPut(owner, repo, token, `data/packs.json`, encodedJson, `📦 catalog with ${id}`, currentJsonObj?.sha);

        showStatus(`¡Éxito! El pack "${title}" se ha publicado correctamente.`, 'success');
        tbody.innerHTML = ''; addTableRow('', ''); updateDiceFormula();
    } catch (e) { console.error(e); showStatus(`Error: ${e.message}`, 'error'); } finally { btn.disabled = false; btn.innerText = "Generar y Publicar en GitHub"; }
}

// OCR and other functions simplified for clarity... (re-using the logic from the messy file but cleaner)
let ocrImage = null; let isDrawing = false; let startX = 0, startY = 0; let cropX = 0, cropY = 0, cropW = 0, cropH = 0;
function loadOcrImage(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        ocrImage = new Image();
        ocrImage.onload = () => {
            const canvas = document.getElementById('ocrCanvas');
            const wrapper = document.getElementById('cropperWrapper');
            const maxW = 600; let dW = ocrImage.width, dH = ocrImage.height;
            if (dW > maxW) { dH = (maxW / dW) * dH; dW = maxW; }
            canvas.width = dW; canvas.height = dH;
            const ctx = canvas.getContext('2d'); ctx.drawImage(ocrImage, 0, 0, dW, dH);
            wrapper.style.display = 'flex'; cropX = 0; cropY = 0; cropW = dW; cropH = dH;
            setupCanvasEvents();
        };
        ocrImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupCanvasEvents() {
    const canvas = document.getElementById('ocrCanvas');
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        startX = (e.clientX - rect.left) * (canvas.width / rect.width);
        startY = (e.clientY - rect.top) * (canvas.height / rect.height);
        isDrawing = true;
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const curX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const curY = (e.clientY - rect.top) * (canvas.height / rect.height);
        cropX = Math.min(startX, curX); cropY = Math.min(startY, curY);
        cropW = Math.max(5, Math.abs(startX - curX)); cropH = Math.max(5, Math.abs(startY - curY));
        drawCanvasOverlay();
    });
    canvas.addEventListener('mouseup', () => isDrawing = false);
}

function drawCanvasOverlay() {
    const canvas = document.getElementById('ocrCanvas'); const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.drawImage(ocrImage, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(cropX, cropY, cropW, cropH);
    ctx.drawImage(ocrImage, (cropX/canvas.width)*ocrImage.width, (cropY/canvas.height)*ocrImage.height, (cropW/canvas.width)*ocrImage.width, (cropH/canvas.height)*ocrImage.height, cropX, cropY, cropW, cropH);
    ctx.strokeStyle = '#6750A4'; ctx.lineWidth = 2; ctx.strokeRect(cropX, cropY, cropW, cropH);
}

async function runOcr() {
    const btn = document.getElementById('btnRunOcr'); const progressDiv = document.getElementById('ocrProgress');
    if (progressDiv) { progressDiv.style.display = 'block'; progressDiv.innerText = 'Iniciando OCR...'; }
    btn.disabled = true;
    try {
        const cropCanvas = document.createElement('canvas'); const cropCtx = cropCanvas.getContext('2d');
        const oX = (cropX / ocrCanvas.width) * ocrImage.width; const oY = (cropY / ocrCanvas.height) * ocrImage.height;
        const oW = (cropW / ocrCanvas.width) * ocrImage.width; const oH = (cropH / ocrCanvas.height) * ocrImage.height;
        cropCanvas.width = oW; cropCanvas.height = oH; cropCtx.drawImage(ocrImage, oX, oY, oW, oH, 0, 0, oW, oH);
        const worker = await Tesseract.createWorker();
        const { data: { text } } = await worker.recognize(cropCanvas); await worker.terminate();
        const lines = parseOcrResults(text).split('\n');
        const tbody = document.getElementById('vocabTableBody');
        if (confirm("¿Sobrescribir tabla actual?")) tbody.innerHTML = '';
        lines.forEach(line => {
            const p = line.split("->"); if (p.length >= 2) addTableRow(p[0].trim(), p[1].trim());
        });
    } catch (e) { alert("Error OCR: " + e.message); } finally { btn.disabled = false; }
}

function parseOcrResults(text) {
    return text.split('\n').filter(l => l.trim().length > 3).map(l => l.replace(/\s*(?:[-—–→>:=|\t]|-\>)\s*/, " -> ")).join('\n');
}

function switchTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('tabCreate').style.display = (tab === 'create' ? 'block' : 'none');
    document.getElementById('tabValidator').style.display = (tab === 'validator' ? 'block' : 'none');
    const mp = document.getElementById('adminManagerPanel');
    if (mp) { mp.style.display = (tab === 'manager' ? 'flex' : 'none'); if (tab === 'manager') initManager(); }
}

let managerInitialized = false;
async function initManager() {
    if (managerInitialized) { const all = await loadAllPacksForManager(); AdminManager.setPacks(all); return; }
    managerInitialized = true;
    const all = await loadAllPacksForManager();
    AdminManager.init(all, () => switchTab('create'), (pid) => loadPackInEditor(pid));
}

async function loadAllPacksForManager() {
    const res = await fetch('data/packs.json'); const off = await res.json();
    const cus = JSON.parse(localStorage.getItem('estudiapp_custom_decks') || '[]').map(d => ({ ...d, _custom: true }));
    return [...off, ...cus];
}

async function verifyStudentCode() {
    const input = document.getElementById('verificationCodeInput').value.trim();
    if (!input) return;
    const parts = input.split('-'); if (parts.length !== 5) { showValidationResult("Inválido", "Formato incorrecto", "error"); return; }
    const [name, game, pack, score, clientHash] = parts;
    const computedHash = await Utils.sha256(`${name}|${game}|${pack}|${score}|estudiapp_secret_salt_2026`);
    if (clientHash === computedHash.substring(0, 16)) {
        showValidationResult("✅ Verificado", `<p>Estudiante: ${name.replace('_',' ')}</p><p>Puntos: ${score}</p>`, "success");
    } else showValidationResult("❌ Falsificado", "La firma no coincide", "error");
}

function showValidationResult(title, html, type) {
    const r = document.getElementById('validationResult'); r.style.display = 'block'; r.className = type;
    r.innerHTML = `<h3>${title}</h3><div>${html}</div>`;
}

async function loadPackInEditor(packId) {
    const all = await loadAllPacksForManager(); const pack = all.find(p => p.id === packId);
    if (!pack) return;
    let entries = [];
    if (pack._custom) entries = (Storage.getCustomDecks().find(d => d.id === packId))?.entries || [];
    else { const res = await fetch(`data/vocab/${packId}.json`); entries = await res.json(); }
    document.getElementById('packId').value = pack.id;
    document.getElementById('packTitle').value = pack.title || '';
    document.getElementById('packLevel').value = pack.level || 'A1';
    document.getElementById('packCategory').value = pack.category || '';
    document.getElementById('packDesc').value = pack.desc || '';
    const tbody = document.getElementById('vocabTableBody'); tbody.innerHTML = '';
    entries.forEach(e => {
        const p = (e.text || '').split('->');
        addTableRow(p[0]?.trim(), (p[1]?.trim() + (e.example ? ` || ${e.example}` : '')), p[2]?.trim());
    });
    switchTab('create');
}
