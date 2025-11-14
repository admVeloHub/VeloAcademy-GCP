// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// POST /api/progress/save - Salvar progresso de aula

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
        const { userEmail, subtitle, lessonTitle, allLessonTitles } = req.body;

        if (!userEmail || !subtitle || !lessonTitle) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: userEmail, subtitle, lessonTitle'
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

        // Buscar progresso existente
        const existingProgress = await collection.findOne({
            userEmail,
            subtitle
        });

        let completedVideos = {};
        if (existingProgress) {
            completedVideos = existingProgress.completedVideos || {};
        }

        // Marcar aula como completa
        completedVideos[lessonTitle] = true;

        // Calcular quizUnlocked: verificar se TODAS as aulas esperadas estão completas
        let quizUnlocked = false;
        if (allLessonTitles && Array.isArray(allLessonTitles) && allLessonTitles.length > 0) {
            // Verificar se todas as aulas esperadas estão completas
            const allCompleted = allLessonTitles.every(lesson => completedVideos[lesson] === true);
            quizUnlocked = allCompleted;
            
            console.log('📊 Validação de quizUnlocked:', {
                allLessonTitles,
                completedVideos,
                allCompleted,
                quizUnlocked
            });
        } else {
            // Fallback: verificar se todas as aulas salvas estão completas (comportamento antigo)
            const allLessons = Object.values(completedVideos);
            quizUnlocked = allLessons.length > 0 && allLessons.every(completed => completed === true);
            console.log('⚠️ Usando fallback para quizUnlocked (allLessonTitles não fornecido)');
        }

        console.log('💾 Salvando progresso:', { userEmail, subtitle, lessonTitle, quizUnlocked, completedVideos });

        const progressData = {
            userEmail,
            subtitle,
            completedVideos,
            quizUnlocked,
            updatedAt: new Date()
        };

        if (existingProgress) {
            // Se todas as aulas foram completadas agora, atualizar completedAt
            if (quizUnlocked && !existingProgress.completedAt) {
                progressData.completedAt = new Date();
            }

            // Atualizar documento existente
            await collection.updateOne(
                { userEmail, subtitle },
                {
                    $set: progressData,
                    $setOnInsert: { createdAt: new Date() }
                }
            );
        } else {
            // Criar novo documento
            progressData.createdAt = new Date();
            if (quizUnlocked) {
                progressData.completedAt = new Date();
            }
            await collection.insertOne(progressData);
        }

        return res.status(200).json({
            success: true,
            message: 'Progresso salvo com sucesso',
            progress: progressData
        });

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao salvar progresso',
            details: error.message
        });
    }
};

