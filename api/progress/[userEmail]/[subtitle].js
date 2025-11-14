// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/progress/:userEmail/:subtitle - Obter progresso

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
        let subtitle = req.query.subtitle || '';
        
        // Fallback: extrair da URL se não vier em req.query
        if (!userEmail || !subtitle) {
            const urlMatch = req.url.match(/\/progress\/([^\/]+)\/([^\/]+)/);
            if (urlMatch) {
                userEmail = userEmail || urlMatch[1];
                subtitle = subtitle || urlMatch[2];
            }
        }
        
        userEmail = decodeURIComponent(userEmail);
        subtitle = decodeURIComponent(subtitle);

        if (!userEmail || !subtitle) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros userEmail e subtitle são obrigatórios'
            });
        }

        const db = await getDatabase();

        if (!db) {
            return res.status(200).json({
                success: false,
                progress: null,
                message: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.'
            });
        }

        const collection = db.collection(COLLECTION_NAME);

        console.log('Buscando progresso:', { userEmail, subtitle });

        const progress = await collection.findOne({
            userEmail,
            subtitle
        });

        console.log('Progresso encontrado:', progress ? 'Sim' : 'Não');

        if (!progress) {
            return res.status(200).json({
                success: true,
                progress: null,
                message: 'Nenhum progresso encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            progress: {
                completedVideos: progress.completedVideos || {},
                quizUnlocked: progress.quizUnlocked || false,
                completedAt: progress.completedAt
            }
        });

    } catch (error) {
        console.error('Erro ao obter progresso:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao obter progresso',
            details: error.message
        });
    }
};

