// VERSION: v1.1.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// Script para migrar dados de cursos.json para MongoDB collection cursos_conteudo

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuração MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.VERCEL_MONGODB_URI;
const DB_NAME = process.env.DB_NAME_ACADEMY || 'academy_registros';
const COLLECTION_NAME = 'cursos_conteudo';

// Mapeamento de cursoNome para cursoClasse
const cursoClasseMap = {
    'onboarding': 'Essencial',
    'produtos': 'Essencial',
    'novidades-modificacoes': 'Atualização',
    'cs004': 'Reciclagem',
    'cs003': 'Opcional',
    'operacoes': 'Atualização',
    'youtube-curso': 'Opcional'
};

// Função para extrair YouTube ID de URL
function extractYouTubeId(url) {
    if (!url || url === '#') return null;
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/.*[?&]v=([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

// Função para extrair Google Drive ID de URL
function extractDriveId(url) {
    if (!url || url === '#') return null;
    
    const patterns = [
        /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
        /drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
}

// Função para determinar se tem quiz baseado no subtitle
function hasQuiz(subtitle) {
    const quizSubtitles = [
        'Crédito do Trabalhador',
        'Chaves PIX',
        'Crédito Pessoal',
        'CRM e Tabulação de Chamados',
        'Seguro Prestamista',
        'Comunicação que Conecta',
        'Seguro Celular'
    ];
    return quizSubtitles.includes(subtitle);
}

// Função para gerar quizId baseado no subtitle
function generateQuizId(subtitle) {
    const quizIdMap = {
        'Crédito do Trabalhador': 'credito',
        'Chaves PIX': 'pix',
        'Crédito Pessoal': 'creditoPessoal',
        'CRM e Tabulação de Chamados': 'tabulacao',
        'Seguro Prestamista': 'seguroPrestaCt',
        'Comunicação que Conecta': 'Exc Atendimento',
        'Seguro Celular': 'seguro_celular'
    };
    return quizIdMap[subtitle] || null;
}

// Função para transformar dados de cursos.json para formato MongoDB
function transformCourseToMongoDB(cursoNome, courseData, courseOrder) {
    const modules = courseData.modules.map((module, moduleIndex) => {
        const moduleId = `modulo-${moduleIndex + 1}`;
        const moduleOrder = moduleIndex + 1;
        
        // Verificar se tem sections ou lessons diretas
        let sections = [];
        
        if (module.sections && module.sections.length > 0) {
            // Nova estrutura com sections
            sections = module.sections.map((section, sectionIndex) => {
                const temaOrder = sectionIndex + 1;
                const subtitle = section.subtitle;
                
                const lessons = section.lessons.map((lesson, lessonIndex) => {
                    const lessonOrder = lessonIndex + 1;
                    const filePath = lesson.filePath || '#';
                    const youtubeId = extractYouTubeId(filePath);
                    const driveId = lesson.driveId || extractDriveId(filePath);
                    
                    // Transformar filePath para lessonContent array
                    const lessonContent = filePath !== '#' ? [{ url: filePath }] : [];
                    
                    return {
                        lessonId: lesson.id,
                        lessonTipo: lesson.type,
                        lessonTitulo: lesson.title,
                        lessonOrdem: lessonOrder,
                        isActive: filePath !== '#', // Desativar se filePath for '#'
                        lessonContent: lessonContent,
                        driveId: driveId,
                        youtubeId: youtubeId,
                        duration: lesson.duration || "",
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };
                });
                
                return {
                    temaNome: subtitle,
                    temaOrder: temaOrder,
                    isActive: true,
                    hasQuiz: hasQuiz(subtitle),
                    quizId: generateQuizId(subtitle),
                    lessons: lessons
                };
            });
        } else if (module.lessons && module.lessons.length > 0) {
            // Estrutura antiga com lessons diretas - criar uma section única
            const lessons = module.lessons.map((lesson, lessonIndex) => {
                const lessonOrder = lessonIndex + 1;
                const filePath = lesson.filePath || '#';
                const youtubeId = extractYouTubeId(filePath);
                const driveId = lesson.driveId || extractDriveId(filePath);
                
                const lessonContent = filePath !== '#' ? [{ url: filePath }] : [];
                
                return {
                    lessonId: lesson.id,
                    lessonTipo: lesson.type,
                    lessonTitulo: lesson.title,
                    lessonOrdem: lessonOrder,
                    isActive: filePath !== '#',
                    lessonContent: lessonContent,
                    driveId: driveId,
                    youtubeId: youtubeId,
                    duration: lesson.duration || "",
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            });
            
            // Criar section única com título do módulo
            sections = [{
                temaNome: module.title || 'Conteúdo',
                temaOrder: 1,
                isActive: true,
                hasQuiz: false,
                quizId: null,
                lessons: lessons
            }];
        }
        
        return {
            moduleId: moduleId,
            moduleNome: module.title,
            moduleOrder: moduleOrder,
            isActive: true,
            sections: sections
        };
    });
    
    return {
        cursoClasse: cursoClasseMap[cursoNome] || 'Opcional',
        cursoNome: cursoNome, // cursoNome é usado diretamente como título exibido
        cursoDescription: courseData.description || '',
        courseOrder: courseOrder,
        isActive: true,
        modules: modules,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'migration-script@velotax.com.br',
        version: 1
    };
}

// Função principal
async function migrateCourses() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI não configurada!');
        console.error('Configure a variável de ambiente MONGODB_URI ou VERCEL_MONGODB_URI');
        process.exit(1);
    }
    
    // Ler arquivo cursos.json
    const cursosJsonPath = path.join(__dirname, '..', 'cursos.json');
    if (!fs.existsSync(cursosJsonPath)) {
        console.error(`❌ Arquivo não encontrado: ${cursosJsonPath}`);
        process.exit(1);
    }
    
    const cursosData = JSON.parse(fs.readFileSync(cursosJsonPath, 'utf8'));
    console.log(`📖 Lidos ${Object.keys(cursosData).length} cursos de cursos.json`);
    
    // Conectar ao MongoDB
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        // Transformar e inserir cada curso
        const cursosArray = Object.entries(cursosData);
        let courseOrder = 1;
        
        for (const [cursoNome, courseData] of cursosArray) {
            console.log(`\n📝 Processando curso: ${cursoNome}`);
            
            const mongoCourse = transformCourseToMongoDB(cursoNome, courseData, courseOrder);
            
            // Verificar se curso já existe
            const existing = await collection.findOne({ cursoNome: cursoNome });
            
            if (existing) {
                // Atualizar curso existente
                await collection.updateOne(
                    { cursoNome: cursoNome },
                    { 
                        $set: {
                            ...mongoCourse,
                            updatedAt: new Date()
                        }
                    }
                );
                console.log(`  ✅ Curso atualizado: ${cursoNome}`);
            } else {
                // Inserir novo curso
                await collection.insertOne(mongoCourse);
                console.log(`  ✅ Curso inserido: ${cursoNome}`);
            }
            
            courseOrder++;
        }
        
        console.log(`\n✅ Migração concluída! ${cursosArray.length} cursos processados.`);
        
        // Listar cursos inseridos
        const totalCourses = await collection.countDocuments({});
        console.log(`\n📊 Total de cursos na collection: ${totalCourses}`);
        
    } catch (error) {
        console.error('❌ Erro durante migração:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Conexão MongoDB fechada');
        }
    }
}

// Executar migração
if (require.main === module) {
    migrateCourses()
        .then(() => {
            console.log('\n✨ Script executado com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { migrateCourses, transformCourseToMongoDB };

