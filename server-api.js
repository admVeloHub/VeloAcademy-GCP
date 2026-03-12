// VERSION: v1.4.0 | DATE: 2026-03-12 | AUTHOR: VeloHub Development Team
// Servidor API Express para gerenciamento de progresso de cursos com MongoDB

// Carregar variáveis de ambiente do arquivo .env
require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001; // Cloud Run usa PORT do ambiente

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
        const bodyCopy = { ...req.body };
        if (bodyCopy.password) {
            bodyCopy.password = '***REDACTED***';
        }
        console.log('Body:', JSON.stringify(bodyCopy, null, 2));
    }
    next();
});

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

// POST /api/quiz/result - Registrar resultado do quiz (aprovado -> curso_certificados, reprovado -> quiz_reprovas)
app.post('/api/quiz/result', async (req, res) => {
    try {
        const { name, email, courseId, courseName, score, totalQuestions, finalGrade, approved, wrongQuestions } = req.body;

        if (!name || !email || !courseId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Campos obrigatórios: name, email, courseId' 
            });
        }

        if (!db) {
            return res.status(503).json({ 
                success: false, 
                error: 'MongoDB não disponível' 
            });
        }

        const now = new Date();
        const wrongQuestionsStr = wrongQuestions && Array.isArray(wrongQuestions) 
            ? JSON.stringify(wrongQuestions) 
            : (wrongQuestions || '[]');
        const wrongQuestionsDisplay = wrongQuestionsStr !== '[]' ? wrongQuestionsStr : 'Sem Erros';

        if (approved) {
            const certificadosCollection = db.collection('curso_certificados');
            const certificateId = uuidv4();
            const doc = {
                date: now,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                courseId: courseId,
                courseName: courseName || courseId,
                score: score != null ? parseInt(score) : null,
                totalQuestions: totalQuestions != null ? parseInt(totalQuestions) : null,
                finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
                wrongQuestions: wrongQuestionsDisplay,
                status: 'Aprovado',
                certificateUrl: '',
                certificateId: certificateId
            };
            await certificadosCollection.insertOne(doc);
            console.log('Certificado registrado:', { email: doc.email, courseId: doc.courseId });
            return res.json({ success: true, collection: 'curso_certificados', certificateId });
        } else {
            const reprovasCollection = db.collection('quiz_reprovas');
            const doc = {
                date: now,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                courseId: courseId,
                courseName: courseName || courseId,
                finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
                wrongQuestions: wrongQuestionsDisplay
            };
            await reprovasCollection.insertOne(doc);
            console.log('Reprovação registrada:', { email: doc.email, courseId: doc.courseId });
            return res.json({ success: true, collection: 'quiz_reprovas' });
        }
    } catch (error) {
        console.error('Erro ao registrar resultado do quiz:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao registrar resultado',
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

// ==================== ENDPOINTS DE AUTENTICAÇÃO ====================

// Importar módulos de autenticação
const bcrypt = require('bcrypt');

// Função auxiliar para conectar ao banco console_analises
async function getQualidadeDb() {
    if (!client) {
        await connectMongoDB();
    }
    if (client) {
        return client.db('console_analises');
    }
    return null;
}

// Função auxiliar para conectar ao banco academy_registros
async function getAcademyDb() {
    if (!db) {
        await connectMongoDB();
    }
    return db;
}

// POST /api/auth/login - Login por email/senha
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        const qualidadeDb = await getQualidadeDb();
        if (!qualidadeDb) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        const emailLower = email.toLowerCase();
        console.log('=== BUSCA USUÁRIO ===');
        console.log('Email recebido:', email);
        console.log('Email normalizado:', emailLower);
        console.log('Buscando usuário no MongoDB...');

        const funcionario = await qualidadeDb.collection('qualidade_funcionarios')
            .findOne({ userMail: emailLower });

        console.log('Usuário encontrado?', !!funcionario);
        if (funcionario) {
            console.log('Email do usuário encontrado:', funcionario.userMail);
            console.log('Nome:', funcionario.colaboradorNome);
        } else {
            console.log('Usuário não encontrado com email:', emailLower);
            // Tentar buscar todos os emails para debug
            const todosUsuarios = await qualidadeDb.collection('qualidade_funcionarios')
                .find({}, { projection: { userMail: 1, colaboradorNome: 1 } })
                .limit(5)
                .toArray();
            console.log('Primeiros 5 usuários no banco:', todosUsuarios.map(u => ({ email: u.userMail, nome: u.colaboradorNome })));
        }

        if (!funcionario) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        if (funcionario.desligado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário desligado'
            });
        }

        if (funcionario.afastado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário afastado'
            });
        }

        if (!funcionario.acessos || funcionario.acessos.Academy !== true) {
            return res.status(403).json({
                success: false,
                error: 'Acesso ao Academy não autorizado'
            });
        }

        let passwordValid = false;
        
        console.log('=== DEBUG LOGIN (server-api.js) ===');
        console.log('Email recebido:', email);
        console.log('Senha recebida:', password);
        console.log('Senha armazenada:', funcionario.password);
        console.log('Tipo da senha armazenada:', typeof funcionario.password);
        console.log('Password é null?', funcionario.password === null || funcionario.password === undefined);
        
        // Se password é null ou undefined, usar senha padrão diretamente
        if (!funcionario.password || funcionario.password === null || funcionario.password === undefined) {
            console.log('Password não definido, usando senha padrão...');
            const nomeCompleto = funcionario.colaboradorNome || '';
            const partesNome = nomeCompleto.toLowerCase().trim().split(/\s+/);
            
            console.log('Nome completo:', nomeCompleto);
            console.log('Partes do nome:', partesNome);
            console.log('CPF:', funcionario.CPF);
            
            if (partesNome.length >= 2 && funcionario.CPF) {
                const primeiroNome = partesNome[0];
                const ultimoNome = partesNome[partesNome.length - 1];
                const senhaPadrao = `${primeiroNome}.${ultimoNome}${funcionario.CPF}`;
                
                console.log('Senha padrão calculada:', senhaPadrao);
                console.log('Senha recebida:', password);
                console.log('Comparação exata:', password === senhaPadrao);
                console.log('Tamanho senha recebida:', password ? password.length : 0);
                console.log('Tamanho senha padrão:', senhaPadrao.length);
                
                passwordValid = password === senhaPadrao;
                console.log('Resultado validação senha padrão:', passwordValid);
            } else {
                console.log('Não foi possível calcular senha padrão - partesNome.length:', partesNome.length, 'CPF:', !!funcionario.CPF);
            }
        } else {
            // Verificar se a senha armazenada é um hash bcrypt (começa com $2a$, $2b$ ou $2y$)
            const isBcryptHash = typeof funcionario.password === 'string' && 
                                 (funcionario.password.startsWith('$2a$') || 
                                  funcionario.password.startsWith('$2b$') || 
                                  funcionario.password.startsWith('$2y$'));
            
            console.log('É hash bcrypt?', isBcryptHash);
            
            if (isBcryptHash) {
                // Senha está em hash bcrypt - comparar hash
                passwordValid = await bcrypt.compare(password, funcionario.password);
                console.log('Comparação bcrypt:', passwordValid);
            } else {
                // Senha está em texto plano - comparar diretamente
                passwordValid = password === funcionario.password;
                console.log('Comparação texto plano:', passwordValid);
                console.log('Senha recebida:', password);
                console.log('Senha armazenada:', funcionario.password);
            }
            
            // Se ainda não validou, tentar senha padrão como fallback
            if (!passwordValid) {
                console.log('Senha armazenada não corresponde, tentando senha padrão como fallback...');
                const nomeCompleto = funcionario.colaboradorNome || '';
                const partesNome = nomeCompleto.toLowerCase().trim().split(/\s+/);
                
                if (partesNome.length >= 2 && funcionario.CPF) {
                    const primeiroNome = partesNome[0];
                    const ultimoNome = partesNome[partesNome.length - 1];
                    const senhaPadrao = `${primeiroNome}.${ultimoNome}${funcionario.CPF}`;
                    
                    console.log('Senha padrão calculada (fallback):', senhaPadrao);
                    passwordValid = password === senhaPadrao;
                    console.log('Comparação senha padrão (fallback):', passwordValid);
                }
            }
        }
        
        console.log('Resultado final da validação:', passwordValid);
        console.log('=== FIM DEBUG ===');

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        const academyDb = await getAcademyDb();
        if (!academyDb) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        const sessionId = uuidv4();
        const now = new Date();
        
        const sessionData = {
            colaboradorNome: funcionario.colaboradorNome,
            userEmail: funcionario.userMail,
            sessionId: sessionId,
            ipAddress: req.ip || req.connection.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            isActive: true,
            loginTimestamp: now,
            logoutTimestamp: null,
            sessionDuration: null,
            createdAt: now,
            updatedAt: now
        };

        await academyDb.collection('sessions').insertOne(sessionData);

        const userData = {
            name: funcionario.colaboradorNome,
            email: funcionario.userMail,
            picture: funcionario.profile_pic || null
        };

        return res.status(200).json({
            success: true,
            user: userData,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/validate-access - Validação de acesso para Google SSO
app.post('/api/auth/validate-access', async (req, res) => {
    try {
        const { email, picture } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        const qualidadeDb = await getQualidadeDb();
        if (!qualidadeDb) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        const funcionario = await qualidadeDb.collection('qualidade_funcionarios')
            .findOne({ userMail: email.toLowerCase() });

        if (!funcionario) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        if (funcionario.desligado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário desligado'
            });
        }

        if (funcionario.afastado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário afastado'
            });
        }

        if (!funcionario.acessos || funcionario.acessos.Velohub !== true) {
            return res.status(403).json({
                success: false,
                error: 'Acesso ao VeloHub não autorizado'
            });
        }

        let profilePicUpdated = false;
        if (picture && (!funcionario.profile_pic || funcionario.profile_pic !== picture)) {
            await qualidadeDb.collection('qualidade_funcionarios').updateOne(
                { _id: funcionario._id },
                { 
                    $set: { 
                        profile_pic: picture,
                        updatedAt: new Date()
                    } 
                }
            );
            profilePicUpdated = true;
        }

        const userData = {
            name: funcionario.colaboradorNome,
            email: funcionario.userMail,
            picture: funcionario.profile_pic || picture || null
        };

        return res.status(200).json({
            success: true,
            user: userData,
            pictureUpdated: profilePicUpdated
        });

    } catch (error) {
        console.error('Erro na validação de acesso:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/session/login - Registro de login no sistema de sessões
app.post('/api/auth/session/login', async (req, res) => {
    try {
        const { colaboradorNome, userEmail, ipAddress, userAgent } = req.body;

        if (!colaboradorNome || !userEmail) {
            return res.status(400).json({
                success: false,
                error: 'colaboradorNome e userEmail são obrigatórios'
            });
        }

        const academyDb = await getAcademyDb();
        if (!academyDb) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        const sessionId = uuidv4();
        const now = new Date();

        const sessionData = {
            colaboradorNome: colaboradorNome,
            userEmail: userEmail.toLowerCase(),
            sessionId: sessionId,
            ipAddress: ipAddress || req.ip || req.connection.remoteAddress || null,
            userAgent: userAgent || req.headers['user-agent'] || null,
            isActive: true,
            loginTimestamp: now,
            logoutTimestamp: null,
            sessionDuration: null,
            createdAt: now,
            updatedAt: now
        };

        await academyDb.collection('sessions').insertOne(sessionData);

        return res.status(200).json({
            success: true,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Erro ao registrar login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
});

// POST /api/auth/session/logout - Registro de logout no sistema de sessões
app.post('/api/auth/session/logout', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId é obrigatório'
            });
        }

        const academyDb = await getAcademyDb();
        if (!academyDb) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        const session = await academyDb.collection('sessions').findOne({
            sessionId: sessionId,
            isActive: true
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Sessão não encontrada ou já encerrada'
            });
        }

        const now = new Date();
        const sessionDuration = now.getTime() - session.loginTimestamp.getTime();

        await academyDb.collection('sessions').updateOne(
            { sessionId: sessionId },
            {
                $set: {
                    isActive: false,
                    logoutTimestamp: now,
                    sessionDuration: sessionDuration,
                    updatedAt: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            sessionDuration: sessionDuration,
            message: 'Logout registrado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao registrar logout:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
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

// Servir arquivos estáticos (HTML, CSS, JS) - para deploy GCP Cloud Run
app.use(express.static(path.join(__dirname)));
// Fallback SPA: rotas não-API servem index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 API Server rodando em http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   POST /api/progress/save`);
    console.log(`   GET  /api/progress/:userEmail/:subtitle`);
    console.log(`   POST /api/progress/unlock-quiz`);
    console.log(`   POST /api/quiz/result`);
    console.log(`   GET  /api/progress/user/:userEmail`);
    console.log(`   GET  /api/courses`);
    console.log(`   GET  /api/courses/:cursoNome`);
    console.log(`   POST /api/auth/login`);
    console.log(`   POST /api/auth/validate-access`);
    console.log(`   POST /api/auth/session/login`);
    console.log(`   POST /api/auth/session/logout`);
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

