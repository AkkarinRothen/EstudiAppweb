// Gestión de credenciales
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

function loadAuth() {
    document.getElementById('ghOwner').value = localStorage.getItem('gh_owner') || '';
    document.getElementById('ghRepo').value = localStorage.getItem('gh_repo') || '';
    document.getElementById('ghToken').value = localStorage.getItem('gh_token') || '';
}

// UI Status
function showStatus(msg, type) {
    const box = document.getElementById('statusBox');
    box.style.display = 'block';
    box.className = type;
    box.innerText = msg;
}

// Lógica Principal de Publicación
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
    const entriesText = document.getElementById('packEntries').value.trim();

    if (!id || !title || !desc || !entriesText) {
        showStatus('Faltan campos por rellenar en el pack.', 'error');
        return;
    }

    const btn = document.getElementById('btnPublish');
    btn.disabled = true;
    btn.innerText = "Procesando...";

    try {
        // 1. Parsear Entradas
        const lines = entriesText.split('\n').filter(l => l.trim() !== '');
        let entriesJsonArray = [];
        let i = 1;
        for (const line of lines) {
            entriesJsonArray.push(`{min:${i}, max:${i}, text:"${line.replace(/"/g, '\\"')}"}`);
            i++;
        }
        const entriesString = entriesJsonArray.join(',');

        // 2. Generar HTML
        const htmlContent = generateHtml(title, desc, formula, entriesString);
        const encodedHtml = btoa(unescape(encodeURIComponent(htmlContent))); // Base64 safe

        // 3. Subir archivo HTML a GitHub
        showStatus('Subiendo HTML a GitHub...', 'warning');
        const htmlPath = `presets/${id}.html`;
        await githubPut(owner, repo, token, htmlPath, encodedHtml, `✨ Add new pack: ${id}`);

        // 4. Actualizar packs.json
        showStatus('Actualizando catálogo packs.json...', 'warning');
        const jsonPath = `data/packs.json`;
        const currentJsonObj = await githubGet(owner, repo, token, jsonPath);
        
        let packs = [];
        let jsonSha = null;

        if (currentJsonObj) {
            packs = JSON.parse(decodeURIComponent(escape(atob(currentJsonObj.content))));
            jsonSha = currentJsonObj.sha;
        }

        // Añadir el nuevo
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

        await githubPut(owner, repo, token, jsonPath, encodedJson, `📦 Update catalog with ${id}`, jsonSha);

        showStatus(`¡Éxito! El pack "${title}" se ha publicado correctamente.`, 'success');
        
        // Limpiar formulario
        document.getElementById('packId').value = '';
        document.getElementById('packTitle').value = '';
        document.getElementById('packDesc').value = '';
        document.getElementById('packEntries').value = '';

    } catch (e) {
        console.error(e);
        showStatus(`Error: ${e.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = "Generar y Publicar en GitHub";
    }
}

// Interacciones con GitHub API
async function githubGet(owner, repo, token, path) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const res = await fetch(url, {
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    if (res.status === 404) return null; // File doesn't exist
    if (!res.ok) throw new Error(`HTTP ${res.status} al obtener ${path}`);
    return await res.json();
}

async function githubPut(owner, repo, token, path, contentBase64, message, sha = null) {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const body = {
        message: message,
        content: contentBase64
    };
    if (sha) body.sha = sha;

    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error HTTP ${res.status}`);
    }
}

// Motor de Plantilla HTML (Idéntico a la App Android)
function generateHtml(title, desc, formula, entriesArrayString) {
    return `<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>${title} - EstudiApp Interactive</title>
    <style>
        :root { --primary: #6750A4; --on-primary: #FFFFFF; --surface: #FEF7FF; --outline: #79747E; --surface-variant: #E7E0EC; --tertiary: #7D5260; --container: #FFFFFF; }
        @media (prefers-color-scheme: dark) { :root { --primary: #D0BCFF; --on-primary: #381E72; --surface: #1C1B1F; --outline: #938F99; --surface-variant: #49454F; --container: #25232A; } }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: var(--surface); color: var(--outline); display: flex; flex-direction: column; align-items: center; padding: 20px; margin: 0; transition: all 0.3s; }
        .card { background: var(--container); border-radius: 28px; padding: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-width: 500px; width: 100%; text-align: center; border: 1px solid var(--surface-variant); }
        h1 { font-size: 24px; margin-bottom: 8px; color: var(--primary); }
        p.desc { color: var(--outline); font-size: 14px; margin-bottom: 24px; }
        .mode-toggle { display: flex; justify-content: center; gap: 8px; margin-bottom: 20px; }
        .chip { padding: 8px 16px; border-radius: 12px; font-size: 12px; font-weight: bold; cursor: pointer; background: var(--surface-variant); border: 1px solid var(--outline); transition: 0.2s; }
        .chip.active { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
        .result-area { min-height: 160px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: var(--surface-variant); border-radius: 20px; margin-bottom: 24px; padding: 20px; transition: all 0.3s ease; position: relative; }
        .roll-val { font-size: 12px; opacity: 0.8; font-weight: bold; margin-bottom: 10px; }
        .entry-text { font-size: 24px; font-weight: 600; color: var(--primary); }
        .translation { margin-top: 15px; padding-top: 15px; border-top: 1px dashed var(--outline); width: 100%; font-size: 18px; font-style: italic; color: var(--tertiary); transition: opacity 0.2s; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .translation.hidden { opacity: 0; }
        .btn-reveal { background: var(--primary); color: var(--on-primary); padding: 4px 12px; border-radius: 100px; font-size: 11px; cursor: pointer; margin-top: 10px; }
        .speaker-btn { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .speaker-btn:hover { background: rgba(0,0,0,0.1); }
        .speaker-btn svg { fill: var(--tertiary); width: 20px; height: 20px; }
        .actions { display: flex; flex-direction: column; gap: 12px; }
        button.main-btn { background: var(--primary); color: var(--on-primary); border: none; padding: 16px 32px; border-radius: 100px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: transform 0.1s; }
        button.main-btn:active { transform: scale(0.95); }
        .history { margin-top: 32px; width: 100%; max-width: 500px; text-align: left; }
        .history h2 { font-size: 18px; margin-bottom: 12px; color: var(--primary); }
        .history-list { max-height: 250px; overflow-y: auto; }
        .history-item { font-size: 14px; padding: 12px; border-bottom: 1px solid var(--surface-variant); display: flex; justify-content: space-between; align-items: center; }
        .back-link { margin-top: 30px; color: var(--primary); text-decoration: none; font-size: 14px; font-weight: bold; }
    </style>
</head>
<body>
    <div class='card'>
        <h1>${title}</h1>
        <p class='desc'>${desc}</p>
        <div class='mode-toggle'>
            <div id='modeDirect' class='chip active' onclick='setMode("direct")'>Modo Directo</div>
            <div id='modeFlashcard' class='chip' onclick='setMode("flashcard")'>Modo Flashcard</div>
        </div>
        <div class='result-area' id='resultArea'>
            <div class='roll-val' id='rollVal'>Tira el dado para empezar</div>
            <div id='mainText' class='entry-text'>---</div>
            <div id='subContainer' class='translation'>
                <span id='subText'></span>
                <button id='speaker' class='speaker-btn' onclick='speak()' title='Escuchar pronunciación'>
                    <svg viewBox='0 0 24 24'><path d='M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z'/></svg>
                </button>
            </div>
            <div id='btnReveal' class='btn-reveal' onclick='reveal()' style='display:none'>MOSTRAR TRADUCCIÓN</div>
        </div>
        <button class='main-btn' onclick='roll()'>Tirar ${formula}</button>
    </div>
    <div class='history'><h2>Historial</h2><div id='historyList' class='history-list'></div></div>
    <a href='../index.html' class='back-link'>← Volver al Portal</a>
    <script>
        const entries = [${entriesArrayString}];
        let currentMode = 'direct'; let isRevealed = true; let lastEng = '';
        function setMode(m) { currentMode = m; document.getElementById('modeDirect').classList.toggle('active', m === 'direct'); document.getElementById('modeFlashcard').classList.toggle('active', m === 'flashcard'); updateVis(); }
        function roll() {
            const val = Math.floor(Math.random() * entries.length) + 1;
            const entry = entries.find(e => val >= e.min && val <= e.max);
            const raw = entry ? entry.text : '--- -> ---';
            const pts = raw.split('->'); const m = pts[0].trim(); const s = pts.length > 1 ? pts[1].trim() : '';
            lastEng = s; document.getElementById('rollVal').innerText = 'Tirada: ' + val;
            document.getElementById('mainText').innerText = m; document.getElementById('subText').innerText = s;
            isRevealed = (currentMode === 'direct' || s === ''); updateVis();
            const item = document.createElement('div'); item.className = 'history-item';
            item.innerHTML = '<span><b>[' + val + ']</b> ' + m + '</span><span style="color:var(--tertiary)">' + s + '</span>';
            document.getElementById('historyList').prepend(item);
        }
        function updateVis() {
            const sub = document.getElementById('subContainer'); const btn = document.getElementById('btnReveal');
            if (isRevealed) { sub.classList.remove('hidden'); btn.style.display = 'none'; }
            else { sub.classList.add('hidden'); btn.style.display = 'block'; }
        }
        function reveal() { isRevealed = true; updateVis(); }
        function speak() { if (!lastEng) return; const u = new SpeechSynthesisUtterance(lastEng); u.lang = 'en-US'; window.speechSynthesis.speak(u); }
    </script>
</body>
</html>`;
}

// Inicialización
window.onload = loadAuth;
