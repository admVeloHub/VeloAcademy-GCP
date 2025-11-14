// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// POST /api/progress/unlock-quiz - Desbloquear quiz após conclusão

const { getDatabase } = require('../../lib/mongodb');

const COLLECTION_NAME = 'course_progress';

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        const { userEmail, courseId, subtitle } = req.body;

        if (!userEmail || !courseId || !subtitle) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: userEmail, courseId, subtitle'
            });
        }

        const db = await getDatabase();

        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.'
            });
        }

        const collection = db.collection(COLLECTION_NAME);

        await collection.updateOne(
            { userEmail, courseId, subtitle },
            {
                $set: {
                    quizUnlocked: true,
                    allVideosCompleted: true,
                    completedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Quiz desbloqueado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao desbloquear quiz:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao desbloquear quiz',
            details: error.message
        });
    }
};

