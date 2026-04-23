// VERSION: v1.0.0 | DATE: 2026-04-23 | GET /api/conquistas/excelencia/:userEmail

const { getDatabase } = require('../../../lib/mongodb');
const { fetchConquistasExcelencia, ensureExcelenciaIndex } = require('../../../lib/conquistas-excelencia');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        let userEmail = req.query.userEmail || '';
        if (!userEmail) {
            const urlMatch = req.url.match(/\/conquistas\/excelencia\/([^/?]+)/);
            if (urlMatch) {
                userEmail = urlMatch[1];
            }
        }
        userEmail = decodeURIComponent(String(userEmail).trim());

        if (!userEmail) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro userEmail é obrigatório'
            });
        }

        const db = await getDatabase();
        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível. Verifique a variável MONGO_ENV no arquivo .env (FONTE DA VERDADE).',
                trophies: []
            });
        }

        await ensureExcelenciaIndex(db);
        const trophies = await fetchConquistasExcelencia(db, userEmail);

        return res.status(200).json({
            success: true,
            trophies
        });
    } catch (error) {
        console.error('Erro em GET /api/conquistas/excelencia:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar conquistas de excelência',
            details: error.message
        });
    }
};
