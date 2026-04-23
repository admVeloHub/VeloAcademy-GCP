// VERSION: v1.1.0 | DATE: 2026-04-23 | GET /api/conquistas/modulos/:userEmail

const { getDatabase } = require('../../../lib/mongodb');
const { fetchConquistasModulos, ensureCertIndex } = require('../../../lib/conquistas-badges');
const { ensureModuloCertIndex } = require('../../../lib/modulo-certificados');

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
            const urlMatch = req.url.match(/\/conquistas\/modulos\/([^/?]+)/);
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
                modulos: []
            });
        }

        await ensureCertIndex(db);
        await ensureModuloCertIndex(db);
        const modulos = await fetchConquistasModulos(db, userEmail);

        return res.status(200).json({
            success: true,
            modulos
        });
    } catch (error) {
        console.error('Erro em GET /api/conquistas/modulos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar módulos concluídos',
            details: error.message
        });
    }
};
