// VERSION: v1.2.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// course_progress: trilha do tema + quizUnlocked. Sem quiz → ao concluir todas as aulas (1 ou N), tema_certificados.
// Lista esperada de aulas: prioridade cursos_conteudo (paridade front); fallback body.allLessonTitles; último recurso completedVideos.

const { getDatabase } = require('../../lib/mongodb');
const { registerTemaVisualizacaoIfNeeded } = require('../../lib/tema-visual-certificado');
const { findExpectedLessonTitlesBySubtitle } = require('../../lib/cursos-conteudo-lookup');

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
        const { userEmail, subtitle, lessonTitle, allLessonTitles, colaboradorNome } = req.body;

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
                error: 'MongoDB não disponível. Verifique a variável MONGO_ENV no arquivo .env (FONTE DA VERDADE).'
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

        let expectedTitles = await findExpectedLessonTitlesBySubtitle(db, subtitle);
        let trilhaFonte = 'cursos_conteudo';
        if (!expectedTitles || expectedTitles.length === 0) {
            trilhaFonte = 'fallback';
            if (allLessonTitles && Array.isArray(allLessonTitles) && allLessonTitles.length > 0) {
                expectedTitles = allLessonTitles.map((t) => String(t).trim()).filter(Boolean);
                trilhaFonte = 'body';
            }
        }

        let quizUnlocked = false;
        if (expectedTitles && expectedTitles.length > 0) {
            quizUnlocked = expectedTitles.every((lesson) => completedVideos[lesson] === true);
            console.log('📊 quizUnlocked (trilha esperada):', {
                subtitle,
                expectedTitles,
                completedVideos,
                quizUnlocked,
                trilhaFonte
            });
        } else {
            const allLessons = Object.values(completedVideos);
            quizUnlocked = allLessons.length > 0 && allLessons.every((completed) => completed === true);
            console.log('⚠️ quizUnlocked fallback (sem trilha em cursos_conteudo nem allLessonTitles)');
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

        if (db && quizUnlocked) {
            try {
                await registerTemaVisualizacaoIfNeeded(db, {
                    userEmail,
                    colaboradorNome: colaboradorNome || '',
                    subtitle,
                    quizUnlocked: true
                });
            } catch (certErr) {
                console.error('Registro tema visualização (conquistas):', certErr && certErr.message);
            }
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

