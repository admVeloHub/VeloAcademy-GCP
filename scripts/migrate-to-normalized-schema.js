// VERSION: v1.0.2 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// Script para migrar dados da estrutura antiga (cursos_conteudo) para estrutura normalizada
// Migra de: academy_registros.cursos_conteudo (estrutura aninhada)
// Para: academy_registros.cursos, academy_registros.modulos, academy_registros.secoes, academy_registros.aulas

(function loadVelohubFonteEnv(here) {
  const path = require('path');
  const fs = require('fs');
  let d = here;
  for (let i = 0; i < 14; i++) {
    const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
    if (fs.existsSync(loader)) {
      require(loader).loadFrom(here);
      return;
    }
    const parent = path.dirname(d);
    if (parent === d) break;
    d = parent;
  }
})(__dirname);

const { MongoClient, ObjectId } = require('mongodb');

// Configuração MongoDB
const MONGODB_URI = (process.env.MONGO_ENV || '').trim();
const DB_NAME = process.env.DB_NAME_ACADEMY || 'academy_registros';

// Nomes das coleções
const OLD_COLLECTION = 'cursos_conteudo';
const COLLECTION_CURSOS = 'cursos';
const COLLECTION_MODULOS = 'modulos';
const COLLECTION_SECOES = 'secoes';
const COLLECTION_AULAS = 'aulas';

// Estatísticas da migração
const stats = {
    cursos: { created: 0, skipped: 0, errors: 0 },
    modulos: { created: 0, skipped: 0, errors: 0 },
    secoes: { created: 0, skipped: 0, errors: 0 },
    aulas: { created: 0, skipped: 0, errors: 0 },
    errors: []
};

// Função para log de erros
function logError(type, message, data = null) {
    stats.errors.push({ type, message, data, timestamp: new Date() });
    console.error(`❌ [${type}] ${message}`, data || '');
}

// Função para criar curso na estrutura normalizada
async function createCurso(db, cursoData) {
    try {
        const cursosCollection = db.collection(COLLECTION_CURSOS);
        
        // Verificar se curso já existe
        const existing = await cursosCollection.findOne({ cursoNome: cursoData.cursoNome });
        
        if (existing) {
            console.log(`  ⚠️  Curso já existe: ${cursoData.cursoNome} (ID: ${existing._id})`);
            stats.cursos.skipped++;
            return existing._id;
        }
        
        // Criar documento do curso
        const cursoDoc = {
            cursoClasse: cursoData.cursoClasse || 'Opcional',
            cursoNome: cursoData.cursoNome,
            cursoDescription: cursoData.cursoDescription || '',
            courseOrder: cursoData.courseOrder || 999,
            isActive: cursoData.isActive !== false,
            createdAt: cursoData.createdAt || new Date(),
            updatedAt: new Date(),
            createdBy: cursoData.createdBy || 'migration-script@velotax.com.br',
            version: cursoData.version || 1
        };
        
        const result = await cursosCollection.insertOne(cursoDoc);
        console.log(`  ✅ Curso criado: ${cursoData.cursoNome} (ID: ${result.insertedId})`);
        stats.cursos.created++;
        
        return result.insertedId;
    } catch (error) {
        logError('CURSO', `Erro ao criar curso ${cursoData.cursoNome}`, error.message);
        stats.cursos.errors++;
        throw error;
    }
}

// Função para criar módulo na estrutura normalizada
async function createModulo(db, moduloData, cursoId) {
    try {
        const modulosCollection = db.collection(COLLECTION_MODULOS);
        
        // Verificar se módulo já existe (cursoId + moduleId)
        const existing = await modulosCollection.findOne({
            cursoId: cursoId,
            moduleId: moduloData.moduleId
        });
        
        if (existing) {
            console.log(`    ⚠️  Módulo já existe: ${moduloData.moduleId} (ID: ${existing._id})`);
            stats.modulos.skipped++;
            return existing._id;
        }
        
        // Criar documento do módulo
        const moduloDoc = {
            cursoId: cursoId,
            moduleId: moduloData.moduleId,
            moduleNome: moduloData.moduleNome,
            moduleOrder: moduloData.moduleOrder || 999,
            isActive: moduloData.isActive !== false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await modulosCollection.insertOne(moduloDoc);
        console.log(`    ✅ Módulo criado: ${moduloData.moduleNome} (ID: ${result.insertedId})`);
        stats.modulos.created++;
        
        return result.insertedId;
    } catch (error) {
        logError('MODULO', `Erro ao criar módulo ${moduloData.moduleId}`, error.message);
        stats.modulos.errors++;
        throw error;
    }
}

// Função para criar seção na estrutura normalizada
async function createSecao(db, secaoData, moduloId) {
    try {
        const secoesCollection = db.collection(COLLECTION_SECOES);
        
        // Verificar se seção já existe (moduloId + temaNome)
        const existing = await secoesCollection.findOne({
            moduloId: moduloId,
            temaNome: secaoData.temaNome
        });
        
        if (existing) {
            console.log(`      ⚠️  Seção já existe: ${secaoData.temaNome} (ID: ${existing._id})`);
            stats.secoes.skipped++;
            return existing._id;
        }
        
        // Criar documento da seção
        const secaoDoc = {
            moduloId: moduloId,
            temaNome: secaoData.temaNome,
            temaOrder: secaoData.temaOrder || 999,
            isActive: secaoData.isActive !== false,
            hasQuiz: secaoData.hasQuiz || false,
            quizId: secaoData.quizId || null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await secoesCollection.insertOne(secaoDoc);
        console.log(`      ✅ Seção criada: ${secaoData.temaNome} (ID: ${result.insertedId})`);
        stats.secoes.created++;
        
        return result.insertedId;
    } catch (error) {
        logError('SECAO', `Erro ao criar seção ${secaoData.temaNome}`, error.message);
        stats.secoes.errors++;
        throw error;
    }
}

// Função para criar aula na estrutura normalizada
async function createAula(db, aulaData, secaoId) {
    try {
        const aulasCollection = db.collection(COLLECTION_AULAS);
        
        // Verificar se aula já existe (secaoId + lessonId)
        const existing = await aulasCollection.findOne({
            secaoId: secaoId,
            lessonId: aulaData.lessonId
        });
        
        if (existing) {
            console.log(`        ⚠️  Aula já existe: ${aulaData.lessonId} (ID: ${existing._id})`);
            stats.aulas.skipped++;
            return existing._id;
        }
        
        // Criar documento da aula
        const aulaDoc = {
            secaoId: secaoId,
            lessonId: aulaData.lessonId,
            lessonTipo: aulaData.lessonTipo,
            lessonTitulo: aulaData.lessonTitulo,
            lessonOrdem: aulaData.lessonOrdem || 999,
            isActive: aulaData.isActive !== false,
            lessonContent: aulaData.lessonContent || [],
            driveId: aulaData.driveId || null,
            youtubeId: aulaData.youtubeId || null,
            duration: aulaData.duration || '',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await aulasCollection.insertOne(aulaDoc);
        console.log(`        ✅ Aula criada: ${aulaData.lessonTitulo} (ID: ${result.insertedId})`);
        stats.aulas.created++;
        
        return result.insertedId;
    } catch (error) {
        logError('AULA', `Erro ao criar aula ${aulaData.lessonId}`, error.message);
        stats.aulas.errors++;
        throw error;
    }
}

// Função principal de migração
async function migrateToNormalizedSchema() {
    if (!MONGODB_URI) {
        console.error('❌ MONGO_ENV não configurada!');
        console.error('Configure MONGO_ENV na FONTE DA VERDADE (.env).');
        process.exit(1);
    }
    
    let client;
    try {
        // Conectar ao MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db(DB_NAME);
        
        // Verificar se collection antiga existe
        const collections = await db.listCollections().toArray();
        const oldCollectionExists = collections.some(c => c.name === OLD_COLLECTION);
        
        if (!oldCollectionExists) {
            console.error(`❌ Collection ${OLD_COLLECTION} não encontrada!`);
            console.error('Nada para migrar.');
            process.exit(1);
        }
        
        const oldCollection = db.collection(OLD_COLLECTION);
        
        // Buscar todos os cursos da estrutura antiga
        const cursosAntigos = await oldCollection.find({}).toArray();
        console.log(`\n📖 Encontrados ${cursosAntigos.length} cursos na estrutura antiga\n`);
        
        if (cursosAntigos.length === 0) {
            console.log('⚠️  Nenhum curso encontrado para migrar.');
            process.exit(0);
        }
        
        // Criar índices nas novas coleções
        console.log('📊 Criando índices nas novas coleções...');
        
        const cursosCollection = db.collection(COLLECTION_CURSOS);
        await cursosCollection.createIndex({ cursoNome: 1 }, { unique: true });
        await cursosCollection.createIndex({ isActive: 1, courseOrder: 1 });
        console.log('  ✅ Índices criados em cursos');
        
        const modulosCollection = db.collection(COLLECTION_MODULOS);
        await modulosCollection.createIndex({ cursoId: 1 });
        await modulosCollection.createIndex({ cursoId: 1, isActive: 1, moduleOrder: 1 });
        console.log('  ✅ Índices criados em modulos');
        
        const secoesCollection = db.collection(COLLECTION_SECOES);
        await secoesCollection.createIndex({ moduloId: 1 });
        await secoesCollection.createIndex({ moduloId: 1, isActive: 1, temaOrder: 1 });
        console.log('  ✅ Índices criados em secoes');
        
        const aulasCollection = db.collection(COLLECTION_AULAS);
        await aulasCollection.createIndex({ secaoId: 1 });
        await aulasCollection.createIndex({ secaoId: 1, isActive: 1, lessonOrdem: 1 });
        console.log('  ✅ Índices criados em aulas\n');
        
        // Migrar cada curso
        for (const cursoAntigo of cursosAntigos) {
            console.log(`\n📝 Migrando curso: ${cursoAntigo.cursoNome}`);
            
            try {
                // 1. Criar curso
                const cursoId = await createCurso(db, cursoAntigo);
                
                // 2. Migrar módulos
                if (cursoAntigo.modules && Array.isArray(cursoAntigo.modules)) {
                    for (const modulo of cursoAntigo.modules) {
                        if (!modulo.isActive) {
                            console.log(`    ⏭️  Módulo inativo ignorado: ${modulo.moduleNome}`);
                            continue;
                        }
                        
                        const moduloId = await createModulo(db, modulo, cursoId);
                        
                        // 3. Migrar seções
                        if (modulo.sections && Array.isArray(modulo.sections)) {
                            for (const secao of modulo.sections) {
                                if (!secao.isActive) {
                                    console.log(`      ⏭️  Seção inativa ignorada: ${secao.temaNome}`);
                                    continue;
                                }
                                
                                const secaoId = await createSecao(db, secao, moduloId);
                                
                                // 4. Migrar aulas
                                if (secao.lessons && Array.isArray(secao.lessons)) {
                                    for (const aula of secao.lessons) {
                                        if (!aula.isActive) {
                                            console.log(`        ⏭️  Aula inativa ignorada: ${aula.lessonTitulo}`);
                                            continue;
                                        }
                                        
                                        await createAula(db, aula, secaoId);
                                    }
                                }
                            }
                        }
                    }
                }
                
                console.log(`✅ Curso migrado com sucesso: ${cursoAntigo.cursoNome}`);
                
            } catch (error) {
                logError('CURSO_COMPLETO', `Erro ao migrar curso ${cursoAntigo.cursoNome}`, error.message);
                console.error(`❌ Erro ao migrar curso ${cursoAntigo.cursoNome}:`, error.message);
                // Continuar com próximo curso
            }
        }
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE MIGRAÇÃO');
        console.log('='.repeat(60));
        console.log(`\n✅ Cursos: ${stats.cursos.created} criados, ${stats.cursos.skipped} já existiam, ${stats.cursos.errors} erros`);
        console.log(`✅ Módulos: ${stats.modulos.created} criados, ${stats.modulos.skipped} já existiam, ${stats.modulos.errors} erros`);
        console.log(`✅ Seções: ${stats.secoes.created} criadas, ${stats.secoes.skipped} já existiam, ${stats.secoes.errors} erros`);
        console.log(`✅ Aulas: ${stats.aulas.created} criadas, ${stats.aulas.skipped} já existiam, ${stats.aulas.errors} erros`);
        
        if (stats.errors.length > 0) {
            console.log(`\n⚠️  Total de erros: ${stats.errors.length}`);
            console.log('\nPrimeiros 10 erros:');
            stats.errors.slice(0, 10).forEach((err, idx) => {
                console.log(`  ${idx + 1}. [${err.type}] ${err.message}`);
            });
        }
        
        console.log('\n✨ Migração concluída!');
        
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
    migrateToNormalizedSchema()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { migrateToNormalizedSchema };

