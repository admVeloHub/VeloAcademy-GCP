// VERSION: v1.0.0 | DATE: 2026-04-14 | GET /api/youtube/tutorias — dicas rápidas (playlist YouTube)
const { fetchTutoriasPlaylistVideos } = require('../../lib/youtube-tutorias-playlist');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 15);
        const { videos } = await fetchTutoriasPlaylistVideos({ maxResults: limit });
        return res.status(200).json({
            success: true,
            videos
        });
    } catch (error) {
        if (error.code === 'YOUTUBE_ENV_MISSING') {
            return res.status(503).json({
                success: false,
                error: 'Integração YouTube não configurada no ambiente.',
                videos: []
            });
        }
        console.error('Erro em /api/youtube/tutorias:', error.message);
        return res.status(502).json({
            success: false,
            error: 'Não foi possível carregar os vídeos da playlist.',
            details: error.message,
            videos: []
        });
    }
};
