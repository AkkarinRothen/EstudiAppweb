// Admin Panel Logic for EstudiApp
import * as Utils from './modules/utils.js';
import * as GitHub from './modules/github.js';
import * as Template from './modules/template.js';

// Seguridad / Login (Client-Side Hashing)
// Hashes para Usuario: AkkarinRothen | Pass: Mily2505
const expectedUserHash = "a27b081436cabe3e7a2774b46e663a373d8fd769446d981c525155745879e557";
const expectedPassHash = "b8fbc28f6a067474710ea06018665c0615999fa201bd2adc6236ee1db76e92f2";

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAuth();
    setupEventListeners();
});

function setupEventListeners() {
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

    const ghSaveBtn = document.querySelector('#ghCollapsibleContent button');
    if (ghSaveBtn) {
        ghSaveBtn.addEventListener('click', () => saveAuth());
    }

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

    // Publish
    const publishBtn = document.getElementById('btnPublish');
    if (publishBtn) {
        publishBtn.addEventListener('click', () => publishPack());
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
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainAdminContent').style.display = 'flex';
        loadAuth();
    } else {
        errDiv.style.display = 'block';
        document.getElementById('loginPass').value = '';
    }
}

function saveAuth() {
    const owner = document.getElementById('ghOwner').value;
    const repo = document.getElementById('ghRepo').value;
    const token = document.getElementById('ghToken').value;

    if (!owner || !repo || !token) {
        showStatus('Por favor completa todos los campos de GitHub.', 'error');
        return;
    }

    localStorage.setItem('gh_owner', owner);
    localStorage.setItem('gh_repo', repo);
    localStorage.setItem('gh_token', token);
    
    showStatus('Credenciales guardadas en tu navegador.', 'success');
}

function toggleGithubCollapse() {
    const content = document.getElementById('ghCollapsibleContent');
    const chevron = document.getElementById('ghChevron');
    content.classList.toggle('expanded');
    chevron.classList.toggle('rotated');
}

function addTableRow(es = '', en = '') {
    const tbody = document.getElementById('vocabTableBody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" class="vocab-es" value="${es.replace(/"/g, '&quot;')}" placeholder="ej: El perro"></td>
        <td><input type="text" class="vocab-en" value="${en.replace(/"/g, '&quot;')}" placeholder="ej: The dog"></td>
        <td style="text-align: center;"><button type="button" class="btn-row-delete">×</button></td>
    `;
    
    tr.querySelector('.btn-row-delete').addEventListener('click', () => {
        tr.remove();
        updateDiceFormula();
    });

    tr.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', updateDiceFormula);
    });
    tbody.appendChild(tr);
    updateDiceFormula();
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

function loadAuth() {
    const owner = localStorage.getItem('gh_owner') || '';
    const repo = localStorage.getItem('gh_repo') || '';
    const token = localStorage.getItem('gh_token') || '';
    
    document.getElementById('ghOwner').value = owner;
    document.getElementById('ghRepo').value = repo;
    document.getElementById('ghToken').value = token;
    
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
    const token = localStorage.getItem('gh_token');

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
    rows.forEach(row => {
        const esVal = row.querySelector('.vocab-es').value.trim();
        const enVal = row.querySelector('.vocab-en').value.trim();
        if (esVal && enVal) {
            validEntries.push({ es: esVal, en: enVal });
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
        let i = 1;
        for (const entry of validEntries) {
            let parts = entry.en.split('||');
            let translation = parts[0].trim().replace(/"/g, '\\"');
            let exampleText = parts.length > 1 ? parts[1].trim().replace(/"/g, '\\"') : '';
            let mainText = `${entry.es.replace(/"/g, '\\"')} -> ${translation}`;
            entriesJsonArray.push(`{min:${i}, max:${i}, text:"${mainText}", example:"${exampleText}"}`);
            i++;
        }
        const entriesString = entriesJsonArray.join(',');

        const htmlContent = Template.generateHtml(title, desc, formula, entriesString);
        const encodedHtml = btoa(unescape(encodeURIComponent(htmlContent)));

        showStatus('Subiendo HTML a GitHub...', 'warning');
        const htmlPath = `presets/${id}.html`;
        await GitHub.githubPut(owner, repo, token, htmlPath, encodedHtml, `✨ Add new pack: ${id}`);

        showStatus('Actualizando catálogo packs.json...', 'warning');
        const jsonPath = `data/packs.json`;
        const currentJsonObj = await GitHub.githubGet(owner, repo, token, jsonPath);
        
        let packs = [];
        let jsonSha = null;

        if (currentJsonObj) {
            packs = JSON.parse(decodeURIComponent(escape(atob(currentJsonObj.content))));
            jsonSha = currentJsonObj.sha;
        }

        packs.push({
            id: id,
            title: title,
            level: level,
            desc: desc,
            category: category,
            file: htmlPath
        });

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
                    addTableRow(parts[0].trim(), parts[1].trim());
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
