// GitHub API Wrapper Module

/**
 * Gets the content of a file from GitHub
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} token 
 * @param {string} path 
 * @returns {Promise<Object|null>}
 */
export async function githubGet(owner, repo, token, path) {
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

/**
 * Uploads or updates a file on GitHub
 * @param {string} owner 
 * @param {string} repo 
 * @param {string} token 
 * @param {string} path 
 * @param {string} contentBase64 
 * @param {string} message 
 * @param {string} sha Optional SHA if updating
 */
export async function githubPut(owner, repo, token, path, contentBase64, message, sha = null) {
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
