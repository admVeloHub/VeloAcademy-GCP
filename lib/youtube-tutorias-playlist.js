// VERSION: v1.0.0 | DATE: 2026-04-14 | AUTHOR: VeloHub Development Team
// Lista itens da playlist de tutoriais (YouTube Data API v3) — chave só no servidor.

const https = require('https');

function getYoutubeCredentials() {
    const apiKey = (
        process.env.YOUTUBE_DATA_API_KEY ||
        process.env.YOUTUBE_API_KEY ||
        ''
    ).trim();
    const playlistId = (
        process.env.YOUTUBE_TUTORIAS_PLAYLIST_ID ||
        process.env.YOUTUBE_PLAYLIST_TUTORIAL ||
        ''
    ).trim();
    return { apiKey, playlistId };
}

/**
 * GET playlistItems — devolve vídeos públicos da playlist configurada no .env (FONTE DA VERDADE).
 * @param {object} opts
 * @param {number} [opts.maxResults=8]
 * @returns {Promise<{ videos: Array<{ videoId: string, title: string, thumbnailUrl: string, publishedAt: string|null }> }>}
 */
async function fetchTutoriasPlaylistVideos(opts = {}) {
    const maxResults = Math.min(Math.max(parseInt(opts.maxResults, 10) || 8, 1), 15);
    const { apiKey, playlistId } = getYoutubeCredentials();

    if (!apiKey || !playlistId) {
        const err = new Error('YouTube não configurado: defina YOUTUBE_DATA_API_KEY e YOUTUBE_TUTORIAS_PLAYLIST_ID.');
        err.code = 'YOUTUBE_ENV_MISSING';
        throw err;
    }

    const q = new URLSearchParams({
        part: 'snippet,contentDetails',
        playlistId,
        maxResults: String(maxResults),
        key: apiKey
    });

    const path = `/youtube/v3/playlistItems?${q.toString()}`;

    const json = await new Promise((resolve, reject) => {
        const req = https.get(
            {
                hostname: 'www.googleapis.com',
                path,
                method: 'GET',
                headers: { Accept: 'application/json' }
            },
            (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (res.statusCode !== 200) {
                            const msg =
                                (parsed.error && parsed.error.message) ||
                                `YouTube API HTTP ${res.statusCode}`;
                            reject(new Error(msg));
                            return;
                        }
                        resolve(parsed);
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        );
        req.on('error', reject);
        req.end();
    });

    const items = Array.isArray(json.items) ? json.items : [];
    const videos = items
        .map((it) => {
            const videoId = it.contentDetails && it.contentDetails.videoId;
            if (!videoId) return null;
            const sn = it.snippet || {};
            const thumbs = sn.thumbnails || {};
            const thumbnailUrl =
                (thumbs.medium && thumbs.medium.url) ||
                (thumbs.standard && thumbs.standard.url) ||
                (thumbs.high && thumbs.high.url) ||
                (thumbs.default && thumbs.default.url) ||
                '';
            return {
                videoId,
                title: typeof sn.title === 'string' ? sn.title : '',
                thumbnailUrl,
                publishedAt: sn.publishedAt || null
            };
        })
        .filter(Boolean);

    return { videos };
}

module.exports = {
    getYoutubeCredentials,
    fetchTutoriasPlaylistVideos
};
