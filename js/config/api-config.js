// VERSION: v1.1.2 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// URL base da API — deve coincidir com o host da máquina em dev (LAN, localhost, porta 3001).

/**
 * Hostname é rede local ou loopback (dev).
 */
function isLocalOrPrivateHost(hostname) {
    if (!hostname) return false;
    const h = String(hostname).toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '[::1]') return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
    return false;
}

/**
 * Obtém a URL base da API (sempre com /api no fim, sem barra dupla).
 */
function getApiBaseUrl() {
    if (typeof window === 'undefined') {
        return '/api';
    }

    const { protocol, hostname, port } = window.location;

    // Produção: mesmo domínio (ex.: GCP Cloud Run com reverse proxy)
    if (!isLocalOrPrivateHost(hostname)) {
        return '/api';
    }

    // Dev: API servida pelo server-api.js na mesma origem (porta 3001)
    if (port === '3001') {
        return '/api';
    }

    // Dev: front noutra porta (ex.: 3000) ou IP da rede — API fica em :3001 neste host
    return `${protocol}//${hostname}:3001/api`;
}

if (typeof window !== 'undefined') {
    window.getApiBaseUrl = getApiBaseUrl;
    window.API_BASE_URL = getApiBaseUrl();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getApiBaseUrl };
}
