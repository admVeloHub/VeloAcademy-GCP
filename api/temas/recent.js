// VERSION: v1.0.0 | DATE: 2026-04-14 | GET /api/temas/recent — home “Novo pra você”
const { getDatabase } = require('../../lib/mongodb');
const { fetchRecentTemas } = require('../../lib/recent-temas');

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
        const db = await getDatabase();
        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível. Verifique MONGO_ENV.'
            });
        }

        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);
        const temas = await fetchRecentTemas(db, limit);

        return res.status(200).json({
            success: true,
            temas
        });
    } catch (error) {
        console.error('Erro em /api/temas/recent:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar temas recentes',
            details: error.message
        });
    }
};
