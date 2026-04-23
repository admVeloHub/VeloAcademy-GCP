// VERSION: v1.0.5 | DATE: 2026-04-23 | Fallback Storage SDK quando GCS público devolve 403 (bucket/objeto privado; ADC / SA Cloud Run)

const https = require('https');
const { URL } = require('url');

const ALLOWED_HOST = 'storage.googleapis.com';
/** Prefixos de pathname no host público storage.googleapis.com/<bucket>/... */
const PATH_PREFIXES = ['/mediabank_academy/', '/mediabank_velohub/'];

/** Buckets permitidos (primeiro segmento do path) — alinhado a PATH_PREFIXES */
const ALLOWED_BUCKETS = new Set(['mediabank_academy', 'mediabank_velohub']);

function pathnameAllowed(pathname) {
    const p = String(pathname || '');
    return PATH_PREFIXES.some((pref) => p === pref.slice(0, -1) || p.startsWith(pref));
}

/** @type {import('@google-cloud/storage').Storage | null} */
let _gcsStorage = null;

function getGcsStorage() {
    if (!_gcsStorage) {
        const { Storage } = require('@google-cloud/storage');
        _gcsStorage = new Storage();
    }
    return _gcsStorage;
}

/**
 * @param {string} objectName
 * @returns {string}
 */
function guessMimeFromObjectName(objectName) {
    const lower = String(objectName || '').toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'application/octet-stream';
}

/**
 * URL já validada (https + host + path allowlist).
 * @param {string} validUrlString
 * @returns {{ bucket: string, objectName: string } | null}
 */
function parseAllowlistedGcsObject(validUrlString) {
    const u = new URL(validUrlString);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    const bucket = parts[0];
    if (!ALLOWED_BUCKETS.has(bucket)) return null;
    const objectName = parts.slice(1).join('/');
    if (!objectName) return null;
    return { bucket, objectName };
}

/**
 * @param {string} bucket
 * @param {string} objectName
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
function sendViaStorageSdk(bucket, objectName, res) {
    return new Promise((resolve) => {
        let storage;
        try {
            storage = getGcsStorage();
        } catch (e) {
            console.error('badge-image: Storage SDK indisponível', e && e.message);
            if (!res.headersSent) res.status(503).end();
            resolve();
            return;
        }
        const file = storage.bucket(bucket).file(objectName);
        file.getMetadata((err, metadata) => {
            if (err) {
                console.error('badge-image SDK metadata:', err.message);
                const code = err.code === 403 ? 403 : 502;
                if (!res.headersSent) res.status(code).end();
                resolve();
                return;
            }
            const ct = (metadata && metadata.contentType) || guessMimeFromObjectName(objectName);
            res.setHeader('Content-Type', ct);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            const stream = file.createReadStream();
            stream.on('error', (e2) => {
                console.error('badge-image SDK stream:', e2 && e2.message);
                if (!res.headersSent) res.status(502).end();
                resolve();
            });
            stream.pipe(res);
            stream.on('end', resolve);
        });
    });
}

/**
 * @param {string} urlString
 * @returns {string|null} URL normalizada ou null
 */
function validateBadgeImageSourceUrl(urlString) {
    let u;
    try {
        u = new URL(String(urlString || '').trim());
    } catch {
        return null;
    }
    if (u.protocol !== 'https:') return null;
    if (u.hostname !== ALLOWED_HOST) return null;
    if (!pathnameAllowed(u.pathname)) return null;
    if (u.username || u.password) return null;
    return u.toString();
}

function pickQueryValue(v) {
    if (v == null || v === '') return '';
    const x = Array.isArray(v) ? v[0] : v;
    return String(x).trim();
}

/**
 * Express já decodifica req.query; não voltar a decodeURIComponent (quebra com % no path e devolve '').
 * Fallback: originalUrl / req.url com URLSearchParams.
 * @param {import('express').Request} req
 * @returns {string}
 */
function readUrlQuery(req) {
    let s = pickQueryValue(req.query && req.query.u);
    if (!s) s = pickQueryValue(req.query && req.query.url);
    if (s) return s;

    const full = String((req.originalUrl != null ? req.originalUrl : req.url) || '');
    const qm = full.indexOf('?');
    if (qm === -1) return '';
    const qs = full.slice(qm + 1);
    try {
        const sp = new URLSearchParams(qs);
        s = pickQueryValue(sp.get('u'));
        if (!s) s = pickQueryValue(sp.get('url'));
    } catch {
        return '';
    }
    return s || '';
}

/**
 * @param {string} urlString
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
function sendProxiedBadgeImage(urlString, res) {
    const valid = validateBadgeImageSourceUrl(urlString);
    if (!valid) {
        if (!res.headersSent) res.status(400).send('URL inválida');
        return Promise.resolve();
    }

    const target = new URL(valid);
    const parsed = parseAllowlistedGcsObject(valid);

    return new Promise((resolve, reject) => {
        const reqHttps = https.request(
            {
                hostname: target.hostname,
                path: target.pathname + target.search,
                method: 'GET',
                headers: { 'User-Agent': 'VeloAcademy/1.0 (badge-image)' }
            },
            (up) => {
                if (up.statusCode === 200) {
                    const ct = up.headers['content-type'] || 'image/png';
                    res.setHeader('Content-Type', ct);
                    res.setHeader('Cache-Control', 'public, max-age=86400');
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    up.pipe(res);
                    up.on('end', resolve);
                    return;
                }
                up.resume();
                const trySdk = parsed && (up.statusCode === 403 || up.statusCode === 401);
                if (trySdk) {
                    console.warn(
                        'badge-image: GET público GCS',
                        up.statusCode,
                        '— tentando leitura autenticada (ADC / conta do serviço)'
                    );
                    sendViaStorageSdk(parsed.bucket, parsed.objectName, res).then(resolve).catch(reject);
                    return;
                }
                if (!res.headersSent) res.status(up.statusCode || 502).end();
                resolve();
            }
        );
        reqHttps.on('error', (e) => {
            console.error('conquistas badge-image https:', e && e.message);
            if (parsed) {
                sendViaStorageSdk(parsed.bucket, parsed.objectName, res).then(resolve).catch(reject);
                return;
            }
            if (!res.headersSent) res.status(502).send('Erro ao obter imagem');
            reject(e);
        });
        reqHttps.end();
    });
}

/**
 * Base64url (UTF-8) → string. Usado em GET /api/conquistas/badge-image/b64/:data
 * @param {string} param
 * @returns {string}
 */
function decodeBadgeUrlFromB64Param(param) {
    if (!param || typeof param !== 'string') return '';
    try {
        let b64 = param.trim().replace(/-/g, '+').replace(/_/g, '/');
        const m = b64.length % 4;
        if (m) b64 += '='.repeat(4 - m);
        return Buffer.from(b64, 'base64').toString('utf8').trim();
    } catch {
        return '';
    }
}

module.exports = {
    ALLOWED_HOST,
    PATH_PREFIXES,
    pathnameAllowed,
    validateBadgeImageSourceUrl,
    readUrlQuery,
    decodeBadgeUrlFromB64Param,
    sendProxiedBadgeImage
};
