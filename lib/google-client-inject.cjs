// VERSION: v1.0.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Gera o corpo de /api/config/google-client.js a partir de process.env.GOOGLE_CLIENT_ID (Cloud Run / FONTE DA VERDADE).

/**
 * @returns {string} JavaScript que define window.GOOGLE_CLIENT_ID (string) ou null.
 */
function getGoogleClientIdInjectScript() {
    const id = (process.env.GOOGLE_CLIENT_ID || '').trim();
    return `window.GOOGLE_CLIENT_ID=${id ? JSON.stringify(id) : 'null'};`;
}

module.exports = { getGoogleClientIdInjectScript };
