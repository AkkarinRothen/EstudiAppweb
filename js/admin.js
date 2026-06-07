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
document.addEventListener('DOMContentLoaded', () => {
    loadAuth();
    setupEventListeners();
});

function setupEventListeners() {
    // ... existing listeners ...
    const selectAllRows = document.getElementById('selectAllRows');
    if (selectAllRows) {
        selectAllRows.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.row-selector');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        });
    }

    const aiTranslateBtn = document.getElementById('aiTranslateBtn');
    if (aiTranslateBtn) {
        aiTranslateBtn.addEventListener('click', () => translateWithAI());
    }

    // Login
    const loginBtn = document.querySelector('#loginOverlay button');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => checkLogin());
    }

    const loginPass = document.getElementById('loginPass');
    if (loginPass) {
        loginPass.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkLogin();
        });
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

    const aiGenerateExamplesBtn = document.getElementById('aiGenerateExamplesBtn');
    if (aiGenerateExamplesBtn) {
        aiGenerateExamplesBtn.addEventListener('click', () => generateExamplesWithAI());
    }

    // Image Search Popover Actions
    const btnNext = document.getElementById('btnImageSearchNext');
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            activeLockId = Math.floor(Math.random() * 10000) + 1;
            updatePopoverImage();
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

    // Publish
    const publishBtn = document.getElementById('btnPublish');
    if (publishBtn) {
        publishBtn.addEventListener('click', () => publishPack());
    }

    // Task Validator
    const verifyBtn = document.getElementById('btnVerifyCode');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', () => verifyStudentCode());
    }
}

async function checkLogin() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const errDiv = document.getElementById('loginError');

    if (!user || !pass) {
        errDiv.style.display = 'block';
        return;
    }

    const userHash = await Utils.sha256(user);
    const passHash = await Utils.sha256(pass);

    if (userHash === expectedUserHash && passHash === expectedPassHash) {
        Storage.setSessionPassword(user + ":" + pass);
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainAdminContent').style.display = 'flex';
        
        // Mostrar indicador de Admin
        showStatus(`👋 ¡Bienvenido, ${user}! Has iniciado sesión como Administrador.`, 'success');
        
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.innerHTML += ' <span style="font-size:12px; background:rgba(255,255,255,0.2); padding:4px 8px; border-radius:12px; vertical-align:middle; margin-left:10px;">🛡️ Modo Editor</span>';
        }

        await loadAuth();
    } else {
        errDiv.style.display = 'block';
        document.getElementById('loginPass').value = '';
    }
}

async function saveAuth() {
    const owner = document.getElementById('ghOwner').value;
    const repo = document.getElementById('ghRepo').value;
    const token = document.getElementById('ghToken').value;
    const geminiKey = document.getElementById('geminiApiKey').value;

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
        // Clean up any old plaintext token if present
        localStorage.removeItem('gh_token');
        
        // Save gemini key if present
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
    // If it doesn't contain tabs or newlines, perform standard paste
    if (!pasteData.includes('\t') && !pasteData.includes('\n') && !pasteData.includes('\r')) {
        return;
    }
    
    e.preventDefault();
    
    // Split into rows, ignore empty rows at the end
    const rawRows = pasteData.split(/\r?\n/);
    const rows = rawRows.filter((r, idx) => r.trim() !== '' || idx < rawRows.length - 1);
    if (rows.length === 0) return;
    
    const tr = inputEl.closest('tr');
    if (!tr) return;
    
    const tbody = document.getElementById('vocabTableBody');
    const allTrs = Array.from(tbody.querySelectorAll('tr'));
    
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
            // No tab, paste all in the active column
            if (isEs) {
                esVal = rowText;
            } else {
                enVal = rowText;
            }
        }
        
        if (idx === 0) {
            // Write into the active row's inputs
            if (esVal || !rowText.includes('\t')) {
                tr.querySelector('.vocab-es').value = esVal;
            }
            if (enVal || !rowText.includes('\t')) {
                tr.querySelector('.vocab-en').value = enVal;
            }
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
            // For subsequent rows, add a new row
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
    
    img.onload = () => {
        spinner.style.display = 'none';
        img.style.display = 'block';
    };
    img.onerror = () => {
        spinner.innerText = "Error al cargar la imagen.";
    };
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
    const wordsToTranslate = targets
        .map((row, idx) => ({ index: idx, es: row.querySelector('.vocab-es').value.trim() }))
        .filter(w => w.es !== "");

    if (wordsToTranslate.length === 0) {
        showStatus('No hay palabras en español para traducir.', 'error');
        return;
    }

    const btn = document.getElementById('aiTranslateBtn');
    btn.disabled = true;
    btn.innerText = "🤖 Traduciendo...";
    showStatus(`Traduciendo ${wordsToTranslate.length} términos con Gemini...`, 'warning');

    try {
        const prompt = `Traduce las siguientes palabras del español al inglés. Devuelve STRICTAMENTE un array JSON:
[{"index": número, "en": "traducción"}]
No incluyas nada más.

Palabras:
${JSON.stringify(wordsToTranslate)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
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
        btn.disabled = false;
        btn.innerText = "🤖 Traducir (Gemini IA)";
    }
}

async function generateExamplesWithAI() {
    const geminiKey = document.getElementById('geminiApiKey').value.trim();
    if (!geminiKey) {
        showStatus('Por favor introduce tu Clave API de Gemini en la sección "Conexión con GitHub" y haz clic en "Guardar Credenciales" para poder usar esta funcionalidad.', 'error');
        return;
    }
    
    const tbody = document.getElementById('vocabTableBody');
    const rows = tbody.querySelectorAll('tr');
    
    let words = [];
    rows.forEach((row, idx) => {
        const esVal = row.querySelector('.vocab-es').value.trim();
        const enVal = row.querySelector('.vocab-en').value.split('||')[0].trim();
        if (esVal && enVal) {
            words.push({ index: idx, es: esVal, en: enVal });
        }
    });
    
    if (words.length === 0) {
        showStatus('La tabla de vocabulario no tiene entradas válidas (Español e Inglés/Traducción obligatorios).', 'error');
        return;
    }
    
    const aiBtn = document.getElementById('aiGenerateExamplesBtn');
    aiBtn.disabled = true;
    aiBtn.innerText = "🤖 Generando...";
    showStatus('Conectando con Gemini API para generar frases de ejemplo...', 'warning');
    
    try {
        const prompt = `Genera una frase de ejemplo en inglés para cada una de las siguientes palabras. La frase debe ser corta, natural y mostrar claramente el significado de la palabra en su contexto en inglés.
Devuelve STRICTAMENTE un array de objetos JSON en el siguiente formato:
[
  {
    "index": número,
    "example": "La frase de ejemplo en inglés"
  }
]
No incluyas explicaciones ni bloques de código markdown, solo el JSON puro.

Palabras:
${JSON.stringify(words.map(w => ({ index: w.index, es: w.es, en: w.en })))}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error?.message || `HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
            throw new Error("Respuesta vacía de la API de Gemini.");
        }
        
        const results = JSON.parse(textResponse.trim());
        if (!Array.isArray(results)) {
            throw new Error("El formato de respuesta de la IA no es un array válido.");
        }
        
        let count = 0;
        results.forEach(res => {
            const row = rows[res.index];
            if (row && res.example) {
                const enInput = row.querySelector('.vocab-en');
                const baseTranslation = enInput.value.split('||')[0].trim();
                enInput.value = `${baseTranslation} || ${res.example.trim()}`;
                count++;
            }
        });
        
        showStatus(`¡Éxito! Se generaron y agregaron ${count} ejemplos contextuales con IA.`, 'success');
    } catch (err) {
        console.error(err);
        showStatus(`Error al generar ejemplos con IA: ${err.message}`, 'error');
    } finally {
        aiBtn.disabled = false;
        aiBtn.innerText = "🤖 Generar Ejemplos (Gemini IA)";
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

    if (!owner || !repo || !token) {
        showStatus('Debes guardar las credenciales de GitHub primero.', 'error');
        return;
    }

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
        if (esVal && enVal) {
            validEntries.push({
                es: esVal,
                en: enVal,
                imageWebpBase64: row._imageWebpBase64 || null,
                existingImgUrl: row._existingImgUrl || null,
                index: index + 1
            });
        }
    });

    if (!id || !title || !desc || validEntries.length === 0) {
        showStatus('Faltan campos por rellenar en el pack o la tabla de vocabulario está vacía.', 'error');
        return;
    }

    const btn = document.getElementById('btnPublish');
    btn.disabled = true;
    btn.innerText = "Procesando...";

    try {
        let entriesJsonArray = [];
        let entriesForDatabaseFile = []; // For data/vocab/[packId].json
        
        let i = 1;
        for (const entry of validEntries) {
            let parts = entry.en.split('||');
            let translation = parts[0].trim().replace(/"/g, '\\"');
            let exampleText = parts.length > 1 ? parts[1].trim().replace(/"/g, '\\"') : '';
            
            // Resolve image path
            let imagePath = "";
            if (entry.imageWebpBase64) {
                showStatus(`Subiendo imagen para "${entry.es}" a GitHub...`, 'warning');
                const imageFilename = `assets/images/packs/${id}/${entry.index}.webp`;
                const base64Data = entry.imageWebpBase64.split(',')[1];
                
                await GitHub.githubPut(
                    owner,
                    repo,
                    token,
                    imageFilename,
                    base64Data,
                    `✨ Add custom image for: ${entry.es}`
                );
                
                imagePath = imageFilename;
            } else if (entry.existingImgUrl) {
                imagePath = entry.existingImgUrl;
            }
            
            let mainText = `${entry.es.replace(/"/g, '\\"')} -> ${translation}`;
            if (imagePath) {
                mainText += ` -> ${imagePath}`;
            }

            entriesJsonArray.push(`{min:${i}, max:${i}, text:"${mainText}", example:"${exampleText}"}`);
            
            entriesForDatabaseFile.push({
                min: i,
                max: i,
                text: mainText.replace(/\\"/g, '"'),
                example: exampleText.replace(/\\"/g, '"')
            });
            
            i++;
        }
        const entriesString = entriesJsonArray.join(',');

        // 1. Upload presets/[id].html
        const htmlContent = Template.generateHtml(title, desc, formula, entriesString);
        const encodedHtml = btoa(unescape(encodeURIComponent(htmlContent)));

        showStatus('Subiendo HTML a GitHub...', 'warning');
        const htmlPath = `presets/${id}.html`;
        await GitHub.githubPut(owner, repo, token, htmlPath, encodedHtml, `✨ Add new pack: ${id}`);

        // 2. Upload data/vocab/[id].json
        showStatus('Subiendo datos de vocabulario a GitHub...', 'warning');
        const databasePath = `data/vocab/${id}.json`;
        const databaseContent = JSON.stringify(entriesForDatabaseFile, null, 4);
        const encodedDatabase = btoa(unescape(encodeURIComponent(databaseContent)));
        
        const existingDatabase = await GitHub.githubGet(owner, repo, token, databasePath);
        await GitHub.githubPut(owner, repo, token, databasePath, encodedDatabase, `📦 Create vocab database: ${id}`, existingDatabase?.sha);

        // 3. Update data/packs.json catalog
        showStatus('Actualizando catálogo packs.json...', 'warning');
        const jsonPath = `data/packs.json`;
        const currentJsonObj = await GitHub.githubGet(owner, repo, token, jsonPath);
        
        let packs = [];
        let jsonSha = null;

        if (currentJsonObj) {
            packs = JSON.parse(decodeURIComponent(escape(atob(currentJsonObj.content))));
            jsonSha = currentJsonObj.sha;
        }

        const existingPackIndex = packs.findIndex(p => p.id === id);
        const packInfo = {
            id: id,
            title: title,
            level: level,
            desc: desc,
            category: category,
            file: htmlPath,
            coverKeyword: Utils.extractImageKeyword(validEntries[0].en.split('||')[0].trim()),
            type: "tabla"
        };
        
        if (existingPackIndex !== -1) {
            packs[existingPackIndex] = packInfo;
        } else {
            packs.push(packInfo);
        }

        const newJsonContent = JSON.stringify(packs, null, 4);
        const encodedJson = btoa(unescape(encodeURIComponent(newJsonContent)));

        await GitHub.githubPut(owner, repo, token, jsonPath, encodedJson, `📦 Update catalog with ${id}`, jsonSha);

        showStatus(`¡Éxito! El pack "${title}" se ha publicado correctamente.`, 'success');
        
        document.getElementById('packId').value = '';
        document.getElementById('packTitle').value = '';
        document.getElementById('packDesc').value = '';
        tbody.innerHTML = '';
        addTableRow('', '');
        updateDiceFormula();

    } catch (e) {
        console.error(e);
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = "Generar y Publicar en GitHub";
    }
}

let ocrImage = null;
let isDrawing = false;
let startX = 0, startY = 0;
let cropX = 0, cropY = 0, cropW = 0, cropH = 0;

function loadOcrImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        ocrImage = new Image();
        ocrImage.onload = function() {
            const canvas = document.getElementById('ocrCanvas');
            const wrapper = document.getElementById('cropperWrapper');
            if (!canvas || !wrapper) return;
            
            const maxDisplayWidth = 600;
            let displayWidth = ocrImage.width;
            let displayHeight = ocrImage.height;
            if (displayWidth > maxDisplayWidth) {
                displayHeight = (maxDisplayWidth / displayWidth) * displayHeight;
                displayWidth = maxDisplayWidth;
            }
            
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(ocrImage, 0, 0, displayWidth, displayHeight);
            wrapper.style.display = 'flex';
            
            cropX = 0; cropY = 0;
            cropW = displayWidth; cropH = displayHeight;
            
            setupCanvasEvents();
        };
        ocrImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function setupCanvasEvents() {
    const canvas = document.getElementById('ocrCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        startX = (e.clientX - rect.left) * scaleX;
        startY = (e.clientY - rect.top) * scaleY;
        isDrawing = true;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;
        
        cropX = Math.min(startX, currentX);
        cropY = Math.min(startY, currentY);
        cropW = Math.max(5, Math.abs(startX - currentX));
        cropH = Math.max(5, Math.abs(startY - currentY));
        
        drawCanvasOverlay();
    });
    
    canvas.addEventListener('mouseup', () => {
        isDrawing = false;
    });
}

function drawCanvasOverlay() {
    const canvas = document.getElementById('ocrCanvas');
    if (!ocrImage || !canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(ocrImage, 0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.clearRect(cropX, cropY, cropW, cropH);
    ctx.drawImage(ocrImage, 
        (cropX / canvas.width) * ocrImage.width, 
        (cropY / canvas.height) * ocrImage.height, 
        (cropW / canvas.width) * ocrImage.width, 
        (cropH / canvas.height) * ocrImage.height, 
        cropX, cropY, cropW, cropH
    );
    
    ctx.strokeStyle = '#6750A4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    ctx.setLineDash([]);
}

async function runOcr() {
    const canvas = document.getElementById('ocrCanvas');
    if (!ocrImage || !canvas || cropW <= 10 || cropH <= 10) {
        alert("Por favor, selecciona una zona válida arrastrando el ratón sobre la imagen.");
        return;
    }
    
    const progressDiv = document.getElementById('ocrProgress');
    const btn = document.getElementById('btnRunOcr');
    if (progressDiv) {
        progressDiv.style.display = 'block';
        progressDiv.innerText = 'Cargando motor OCR Tesseract...';
    }
    btn.disabled = true;
    
    try {
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        const origX = (cropX / canvas.width) * ocrImage.width;
        const origY = (cropY / canvas.height) * ocrImage.height;
        const origW = (cropW / canvas.width) * ocrImage.width;
        const origH = (cropH / canvas.height) * ocrImage.height;
        
        cropCanvas.width = origW;
        cropCanvas.height = origH;
        
        cropCtx.drawImage(ocrImage, origX, origY, origW, origH, 0, 0, origW, origH);
        
        const worker = await Tesseract.createWorker({
            logger: m => {
                if (m.status === 'recognizing') {
                    progressDiv.innerText = `Reconociendo texto: ${Math.round(m.progress * 100)}%`;
                }
            }
        });
        
        const { data: { text } } = await worker.recognize(cropCanvas);
        await worker.terminate();
        
        if (progressDiv) progressDiv.innerText = '¡OCR Completado!';
        
        const parsedText = parseOcrResults(text);
        if (parsedText.trim() === "") {
            alert("No se pudo extraer texto legible. Intenta seleccionar otra área o mejorar la calidad de la imagen.");
        } else {
            const lines = parsedText.split('\n');
            let overwrite = true;
            const tbody = document.getElementById('vocabTableBody');
            
            const rows = tbody.querySelectorAll('tr');
            let hasContent = false;
            if (rows.length > 1) {
                hasContent = true;
            } else if (rows.length === 1) {
                const es = rows[0].querySelector('.vocab-es').value.trim();
                const en = rows[0].querySelector('.vocab-en').value.trim();
                if (es || en) hasContent = true;
            }

            if (hasContent) {
                overwrite = confirm("¿Deseas sobrescribir el vocabulario actual? Si cancelas, se añadirá al final.");
            }
            if (overwrite) {
                tbody.innerHTML = '';
            }
            for (const line of lines) {
                const parts = line.split("->");
                if (parts.length >= 2) {
                    addTableRow(parts[0].trim(), parts[1].trim(), parts.length > 2 ? parts[2].trim() : '');
                }
            }
        }
        
    } catch (e) {
        console.error(e);
        alert(`Error al procesar OCR: ${e.message}`);
    } finally {
        btn.disabled = false;
        setTimeout(() => {
            if (progressDiv) progressDiv.style.display = 'none';
        }, 3000);
    }
}

function parseOcrResults(text) {
    const lines = text.split('\n');
    let outputLines = [];
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.length < 3) continue;
        
        const cleanLine = line.replace(/\s*(?:[-—–→>:=|\t]|-\>)\s*/, " -> ");
        
        if (cleanLine.includes("->")) {
            outputLines.push(cleanLine);
        } else {
            const parts = cleanLine.split(/\s{2,}/);
            if (parts.length >= 2) {
                outputLines.push(`${parts[0].trim()} -> ${parts[1].trim()}`);
            }
        }
    }
    return outputLines.join('\n');
}

function switchTab(tab) {
    document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });

    const tabCreate = document.getElementById('tabCreate');
    if (tabCreate) {
        if (tab === 'create') {
            tabCreate.classList.add('visible');
        } else {
            tabCreate.classList.remove('visible');
        }
    }

    const tabValidator = document.getElementById('tabValidator');
    if (tabValidator) {
        if (tab === 'validator') {
            tabValidator.classList.add('visible');
        } else {
            tabValidator.classList.remove('visible');
        }
    }

    const mp = document.getElementById('adminManagerPanel');
    if (mp) {
        if (tab === 'manager') {
            mp.classList.add('visible');
            initManager();
        } else {
            mp.classList.remove('visible');
        }
    }
}

let managerInitialized = false;
async function initManager() {
    if (managerInitialized) {
        try {
            const allPacks = await loadAllPacksForManager();
            AdminManager.setPacks(allPacks);
        } catch (e) {
            console.error('Error refreshing packs in manager:', e);
        }
        return;
    }
    managerInitialized = true;
    try {
        const allPacks = await loadAllPacksForManager();
        AdminManager.init(allPacks, () => switchTab('create'));
    } catch (e) {
        console.error('Error initializing resource manager:', e);
        managerInitialized = false;
    }
}

async function loadAllPacksForManager() {
    try {
        const res = await fetch('data/packs.json');
        const officialPacks = await res.json();
        const customDecks = JSON.parse(localStorage.getItem('estudiapp_custom_decks') || '[]')
            .map(d => ({ ...d, _custom: true }));
        return [...officialPacks, ...customDecks];
    } catch (e) {
        console.error('Error loading packs for manager:', e);
        return [];
    }
}

async function verifyStudentCode() {
    const input = document.getElementById('verificationCodeInput').value.trim();
    const resultBox = document.getElementById('validationResult');
    if (!resultBox) return;

    if (!input) {
        alert("Por favor introduce un código de verificación.");
        return;
    }

    // Code format: Name-Game-Pack-Score-Hash
    const parts = input.split('-');
    if (parts.length !== 5) {
        showValidationResult("Código inválido", "El formato del código no es correcto. Asegúrate de copiarlo completo.", "error");
        return;
    }

    const [name, game, pack, score, clientHash] = parts;

    // Reconstruct raw data string and recompute SHA-256 hash using the same salt
    const rawData = `${name}|${game}|${pack}|${score}`;
    const salt = "estudiapp_secret_salt_2026";
    
    try {
        const computedHash = await Utils.sha256(rawData + "|" + salt);
        const expectedHashPart = computedHash.substring(0, 16);

        if (clientHash === expectedHashPart) {
            // Clean presentation: format student name (replace underscore with space)
            const formattedName = name.replace('_', ' ');
            showValidationResult(
                "✅ Código Legítimo (Verificado)",
                `<p><strong>Estudiante:</strong> ${formattedName}</p>
                 <p><strong>Juego:</strong> ${game.toUpperCase()}</p>
                 <p><strong>Vocabulario (Pack):</strong> ${pack}</p>
                 <p><strong>Puntuación Alcanzada:</strong> ${score} aciertos</p>`,
                "success"
            );
        } else {
            showValidationResult(
                "❌ Código Falsificado / Inválido",
                "La firma digital no coincide. La puntuación o el nombre han sido alterados o el código es erróneo.",
                "error"
            );
        }
    } catch (e) {
        console.error(e);
        showValidationResult("Error", "Ocurrió un error al procesar el código: " + e.message, "error");
    }
}

function showValidationResult(title, htmlContent, type) {
    const resultBox = document.getElementById('validationResult');
    if (!resultBox) return;

    resultBox.style.display = 'block';
    resultBox.className = type; // success or error background
    resultBox.innerHTML = `
        <h3>${title}</h3>
        <div>${htmlContent}</div>
    `;
}
