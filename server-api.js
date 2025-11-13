// VERSION: v1.1.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// Servidor API Express para gerenciamento de progresso de cursos com MongoDB

// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // Porta diferente do servidor estático

// Middleware
app.use(cors());
app.use(express.json());

// Configuração MongoDB
// URI obtida das variáveis de ambiente (.env local ou Vercel em produção)
const MONGODB_URI = process.env.MONGODB_URI || process.env.VERCEL_MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME_ACADEMY || 'academy_registros';
const COLLECTION_NAME = 'course_progress';

let db = null;
let client = null;

// Conectar ao MongoDB
async function connectMongoDB() {
    try {
        if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017') {
            console.warn('⚠️ MONGODB_URI não configurada. Usando modo desenvolvimento sem MongoDB.');
            return;
        }
        
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('✅ Conectado ao MongoDB:', DB_NAME);
        console.log('📊 Collection:', COLLECTION_NAME);
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        // Continuar mesmo sem MongoDB para desenvolvimento
        console.warn('⚠️ Continuando sem conexão MongoDB. Endpoints retornarão erro 503.');
    }
}

// Inicializar conexão
connectMongoDB();

// ==================== ENDPOINTS ====================

// POST /api/progress/save - Salvar progresso de aula
app.post('/api/progress/save', async (req, res) => {
    try {
        const { userEmail, subtitle, lessonTitle, allLessonTitles } = req.body;

        if (!userEmail || !subtitle || !lessonTitle) {
            return res.status(400).json({ 
                success: false, 
                error: 'Campos obrigatórios: userEmail, subtitle, lessonTitle' 
            });
        }

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
            quizUnlocked = allLessonTitles.every(lesson => completedVideos[lesson] === true);
        } else {
            // Fallback: verificar se todas as aulas salvas estão completas (comportamento antigo)
            const allLessons = Object.values(completedVideos);
            quizUnlocked = allLessons.length > 0 && allLessons.every(completed => completed === true);
        }
        
        console.log('Salvando progresso:', { userEmail, subtitle, lessonTitle, quizUnlocked });

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

        res.json({ 
            success: true, 
            message: 'Progresso salvo com sucesso',
            progress: progressData
        });

    } catch (error) {
        console.error('Erro ao salvar progresso:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao salvar progresso',
            details: error.message 
        });
    }
});

// GET /api/progress/:userEmail/:subtitle - Obter progresso
app.get('/api/progress/:userEmail/:subtitle', async (req, res) => {
    try {
        // Decodificar parâmetros da URL
        const userEmail = decodeURIComponent(req.params.userEmail);
        const subtitle = decodeURIComponent(req.params.subtitle);

        if (!db) {
            return res.json({ 
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
            return res.json({ 
                success: true, 
                progress: null,
                message: 'Nenhum progresso encontrado' 
            });
        }

        res.json({ 
            success: true, 
            progress: {
                completedVideos: progress.completedVideos || {},
                quizUnlocked: progress.quizUnlocked || false,
                completedAt: progress.completedAt
            }
        });

    } catch (error) {
        console.error('Erro ao obter progresso:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao obter progresso',
            details: error.message 
        });
    }
});

// POST /api/progress/unlock-quiz - Desbloquear quiz após conclusão
app.post('/api/progress/unlock-quiz', async (req, res) => {
    try {
        const { userEmail, courseId, subtitle } = req.body;

        if (!userEmail || !courseId || !subtitle) {
            return res.status(400).json({ 
                success: false, 
                error: 'Campos obrigatórios: userEmail, courseId, subtitle' 
            });
        }

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

        res.json({ 
            success: true, 
            message: 'Quiz desbloqueado com sucesso' 
        });

    } catch (error) {
        console.error('Erro ao desbloquear quiz:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao desbloquear quiz',
            details: error.message 
        });
    }
});

// GET /api/progress/user/:userEmail - Obter todo progresso do usuário
app.get('/api/progress/user/:userEmail', async (req, res) => {
    try {
        const { userEmail } = req.params;

        if (!db) {
            return res.json({ 
                success: false, 
                progress: [],
                message: 'MongoDB não disponível' 
            });
        }

        const collection = db.collection(COLLECTION_NAME);
        
        const allProgress = await collection.find({ userEmail }).toArray();

        res.json({ 
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
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao obter progresso',
            details: error.message 
        });
    }
});

// GET /api/courses - Listar todos os cursos ativos
app.get('/api/courses', async (req, res) => {
    try {
        if (!db) {
            return res.status(503).json({ 
                success: false, 
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.' 
            });
        }

        const collection = db.collection('cursos_conteudo');
        
        // Buscar cursos ativos, ordenados por courseOrder
        const courses = await collection.find({ isActive: true })
            .sort({ courseOrder: 1 })
            .toArray();

        // Filtrar conteúdo ativo recursivamente
        const filteredCourses = courses.map(course => {
            const filteredModules = course.modules
                .filter(m => m.isActive)
                .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
                .map(module => {
                    const filteredSections = module.sections
                        .filter(s => s.isActive)
                        .map(section => {
                            const filteredLessons = section.lessons
                                .filter(l => l.isActive)
                                .sort((a, b) => (a.lessonOrdem || 0) - (b.lessonOrdem || 0));
                            
                            return {
                                ...section,
                                lessons: filteredLessons
                            };
                        })
                        .sort((a, b) => (a.temaOrder || 0) - (b.temaOrder || 0));
                    
                    return {
                        ...module,
                        sections: filteredSections
                    };
                });
            
            return {
                ...course,
                modules: filteredModules
            };
        });

        res.json({ 
            success: true, 
            courses: filteredCourses 
        });

    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao listar cursos',
            details: error.message 
        });
    }
});

// GET /api/courses/:cursoNome - Obter curso específico
app.get('/api/courses/:cursoNome', async (req, res) => {
    try {
        const cursoNome = decodeURIComponent(req.params.cursoNome);

        if (!db) {
            return res.status(503).json({ 
                success: false, 
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.' 
            });
        }

        const collection = db.collection('cursos_conteudo');
        
        const course = await collection.findOne({ 
            cursoNome: cursoNome, 
            isActive: true 
        });

        if (!course) {
            return res.status(404).json({ 
                success: false, 
                error: 'Curso não encontrado' 
            });
        }

        // Filtrar conteúdo ativo recursivamente
        const filteredModules = course.modules
            .filter(m => m.isActive)
            .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
            .map(module => {
                const filteredSections = module.sections
                    .filter(s => s.isActive)
                    .map(section => {
                        const filteredLessons = section.lessons
                            .filter(l => l.isActive)
                            .sort((a, b) => (a.lessonOrdem || 0) - (b.lessonOrdem || 0));
                        
                        return {
                            ...section,
                            lessons: filteredLessons
                        };
                    })
                    .sort((a, b) => (a.temaOrder || 0) - (b.temaOrder || 0));
                
                return {
                    ...module,
                    sections: filteredSections
                };
            });

        res.json({ 
            success: true, 
            course: {
                ...course,
                modules: filteredModules
            }
        });

    } catch (error) {
        console.error('Erro ao obter curso:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao obter curso',
            details: error.message 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        mongodb: db ? 'connected' : 'disconnected',
        mongodb_uri_configured: !!MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017',
        timestamp: new Date().toISOString()
    });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   POST /api/progress/save`);
    console.log(`   GET  /api/progress/:userEmail/:subtitle`);
    console.log(`   POST /api/progress/unlock-quiz`);
    console.log(`   GET  /api/progress/user/:userEmail`);
    console.log(`   GET  /api/courses`);
    console.log(`   GET  /api/courses/:cursoNome`);
    console.log(`   GET  /api/health`);
    console.log(`\n🔧 Configuração MongoDB:`);
    console.log(`   URI configurada: ${!!MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017' ? '✅ Sim' : '❌ Não'}`);
    console.log(`   Database: ${DB_NAME} (variável: DB_NAME_ACADEMY)`);
    console.log(`   Collection: ${COLLECTION_NAME}`);
    if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017') {
        console.log(`\n⚠️  ATENÇÃO: Configure as variáveis de ambiente no Vercel:`);
        console.log(`   - MONGODB_URI: Connection string do MongoDB`);
        console.log(`   - DB_NAME_ACADEMY: Nome do banco (padrão: academy_registros)`);
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor API...');
    if (client) {
        await client.close();
        console.log('✅ Conexão MongoDB fechada');
    }
    process.exit(0);
});

