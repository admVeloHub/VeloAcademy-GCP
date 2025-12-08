// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/progress/user/:userEmail - Obter todo progresso do usuário

const { getDatabase } = require('../../../lib/mongodb');

const COLLECTION_NAME = 'course_progress';

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        // Vercel passa parâmetros dinâmicos via req.query
        // Tentar pegar de req.query primeiro, depois da URL como fallback
        let userEmail = req.query.userEmail || '';
        
        // Fallback: extrair da URL se não vier em req.query
        if (!userEmail) {
            const urlMatch = req.url.match(/\/progress\/user\/([^\/]+)/);
            if (urlMatch) {
                userEmail = urlMatch[1];
            }
        }
        
        userEmail = decodeURIComponent(userEmail);

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
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.',
                progress: []
            });
        }

        const collection = db.collection(COLLECTION_NAME);

        const allProgress = await collection.find({ userEmail }).toArray();

        return res.status(200).json({
            success: true,
            progress: allProgress.map(p => ({
                subtitle: p.subtitle,
                completedVideos: p.completedVideos || {},
                quizUnlocked: p.quizUnlocked || false,
                completedAt: p.completedAt
            }))
        });

    } catch (error) {
        console.error('Erro ao obter progresso do usuário:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao obter progresso',
            details: error.message
        });
    }
};

