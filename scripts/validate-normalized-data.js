// VERSION: v1.0.2 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// Script para validar integridade referencial dos dados na estrutura normalizada

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

const { MongoClient } = require('mongodb');

// Configuração MongoDB
const MONGODB_URI = (process.env.MONGO_ENV || '').trim();
const DB_NAME = process.env.DB_NAME_ACADEMY || 'academy_registros';

// Nomes das coleções
const COLLECTION_CURSOS = 'cursos';
const COLLECTION_MODULOS = 'modulos';
const COLLECTION_SECOES = 'secoes';
const COLLECTION_AULAS = 'aulas';
const OLD_COLLECTION = 'cursos_conteudo';

// Estatísticas de validação
const validationResults = {
    cursos: { total: 0, valid: 0, invalid: 0, issues: [] },
    modulos: { total: 0, valid: 0, invalid: 0, orphaned: 0, issues: [] },
    secoes: { total: 0, valid: 0, invalid: 0, orphaned: 0, issues: [] },
    aulas: { total: 0, valid: 0, invalid: 0, orphaned: 0, issues: [] },
    comparison: { oldStructure: 0, newStructure: 0, differences: [] }
};

// Função para validar cursos
async function validateCursos(db) {
    console.log('\n📊 Validando cursos...');
    const cursosCollection = db.collection(COLLECTION_CURSOS);
    const cursos = await cursosCollection.find({}).toArray();
    
    validationResults.cursos.total = cursos.length;
    
    for (const curso of cursos) {
        const issues = [];
        
        // Validar campos obrigatórios
        if (!curso.cursoNome) issues.push('cursoNome ausente');
        if (curso.isActive === undefined) issues.push('isActive ausente');
        if (curso.courseOrder === undefined) issues.push('courseOrder ausente');
        
        // Validar valores
        if (curso.cursoNome && typeof curso.cursoNome !== 'string') {
            issues.push('cursoNome deve ser string');
        }
        if (curso.isActive !== undefined && typeof curso.isActive !== 'boolean') {
            issues.push('isActive deve ser boolean');
        }
        
        if (issues.length === 0) {
            validationResults.cursos.valid++;
        } else {
            validationResults.cursos.invalid++;
            validationResults.cursos.issues.push({
                cursoId: curso._id,
                cursoNome: curso.cursoNome,
                issues: issues
            });
        }
    }
    
    console.log(`  ✅ Válidos: ${validationResults.cursos.valid}`);
    console.log(`  ❌ Inválidos: ${validationResults.cursos.invalid}`);
}

// Função para validar módulos
async function validateModulos(db) {
    console.log('\n📊 Validando módulos...');
    const modulosCollection = db.collection(COLLECTION_MODULOS);
    const cursosCollection = db.collection(COLLECTION_CURSOS);
    const modulos = await modulosCollection.find({}).toArray();
    
    validationResults.modulos.total = modulos.length;
    
    for (const modulo of modulos) {
        const issues = [];
        
        // Validar campos obrigatórios
        if (!modulo.cursoId) issues.push('cursoId ausente');
        if (!modulo.moduleId) issues.push('moduleId ausente');
        if (!modulo.moduleNome) issues.push('moduleNome ausente');
        
        // Validar referência ao curso
        if (modulo.cursoId) {
            const cursoExists = await cursosCollection.findOne({ _id: modulo.cursoId });
            if (!cursoExists) {
                issues.push(`cursoId ${modulo.cursoId} não existe (órfão)`);
                validationResults.modulos.orphaned++;
            }
        }
        
        // Validar valores
        if (modulo.moduleId && typeof modulo.moduleId !== 'string') {
            issues.push('moduleId deve ser string');
        }
        
        if (issues.length === 0) {
            validationResults.modulos.valid++;
        } else {
            validationResults.modulos.invalid++;
            validationResults.modulos.issues.push({
                moduloId: modulo._id,
                moduleId: modulo.moduleId,
                cursoId: modulo.cursoId,
                issues: issues
            });
        }
    }
    
    console.log(`  ✅ Válidos: ${validationResults.modulos.valid}`);
    console.log(`  ❌ Inválidos: ${validationResults.modulos.invalid}`);
    console.log(`  ⚠️  Órfãos: ${validationResults.modulos.orphaned}`);
}

// Função para validar seções
async function validateSecoes(db) {
    console.log('\n📊 Validando seções...');
    const secoesCollection = db.collection(COLLECTION_SECOES);
    const modulosCollection = db.collection(COLLECTION_MODULOS);
    const secoes = await secoesCollection.find({}).toArray();
    
    validationResults.secoes.total = secoes.length;
    
    for (const secao of secoes) {
        const issues = [];
        
        // Validar campos obrigatórios
        if (!secao.moduloId) issues.push('moduloId ausente');
        if (!secao.temaNome) issues.push('temaNome ausente');
        
        // Validar referência ao módulo
        if (secao.moduloId) {
            const moduloExists = await modulosCollection.findOne({ _id: secao.moduloId });
            if (!moduloExists) {
                issues.push(`moduloId ${secao.moduloId} não existe (órfão)`);
                validationResults.secoes.orphaned++;
            }
        }
        
        // Validar valores
        if (secao.hasQuiz !== undefined && typeof secao.hasQuiz !== 'boolean') {
            issues.push('hasQuiz deve ser boolean');
        }
        
        if (issues.length === 0) {
            validationResults.secoes.valid++;
        } else {
            validationResults.secoes.invalid++;
            validationResults.secoes.issues.push({
                secaoId: secao._id,
                temaNome: secao.temaNome,
                moduloId: secao.moduloId,
                issues: issues
            });
        }
    }
    
    console.log(`  ✅ Válidas: ${validationResults.secoes.valid}`);
    console.log(`  ❌ Inválidas: ${validationResults.secoes.invalid}`);
    console.log(`  ⚠️  Órfãs: ${validationResults.secoes.orphaned}`);
}

// Função para validar aulas
async function validateAulas(db) {
    console.log('\n📊 Validando aulas...');
    const aulasCollection = db.collection(COLLECTION_AULAS);
    const secoesCollection = db.collection(COLLECTION_SECOES);
    const aulas = await aulasCollection.find({}).toArray();
    
    validationResults.aulas.total = aulas.length;
    
    for (const aula of aulas) {
        const issues = [];
        
        // Validar campos obrigatórios
        if (!aula.secaoId) issues.push('secaoId ausente');
        if (!aula.lessonId) issues.push('lessonId ausente');
        if (!aula.lessonTipo) issues.push('lessonTipo ausente');
        if (!aula.lessonTitulo) issues.push('lessonTitulo ausente');
        
        // Validar referência à seção
        if (aula.secaoId) {
            const secaoExists = await secoesCollection.findOne({ _id: aula.secaoId });
            if (!secaoExists) {
                issues.push(`secaoId ${aula.secaoId} não existe (órfão)`);
                validationResults.aulas.orphaned++;
            }
        }
        
        // Validar lessonContent
        if (!aula.lessonContent || !Array.isArray(aula.lessonContent)) {
            issues.push('lessonContent deve ser array');
        } else if (aula.lessonContent.length === 0) {
            issues.push('lessonContent vazio');
        }
        
        // Validar valores
        const validTypes = ['video', 'pdf', 'audio', 'slide', 'document'];
        if (aula.lessonTipo && !validTypes.includes(aula.lessonTipo)) {
            issues.push(`lessonTipo inválido: ${aula.lessonTipo}`);
        }
        
        if (issues.length === 0) {
            validationResults.aulas.valid++;
        } else {
            validationResults.aulas.invalid++;
            validationResults.aulas.issues.push({
                aulaId: aula._id,
                lessonId: aula.lessonId,
                secaoId: aula.secaoId,
                issues: issues
            });
        }
    }
    
    console.log(`  ✅ Válidas: ${validationResults.aulas.valid}`);
    console.log(`  ❌ Inválidas: ${validationResults.aulas.invalid}`);
    console.log(`  ⚠️  Órfãs: ${validationResults.aulas.orphaned}`);
}

// Função para comparar estruturas antiga e nova
async function compareStructures(db) {
    console.log('\n📊 Comparando estruturas antiga e nova...');
    
    const oldCollection = db.collection(OLD_COLLECTION);
    const cursosCollection = db.collection(COLLECTION_CURSOS);
    
    // Contar cursos na estrutura antiga
    const oldCourses = await oldCollection.find({ isActive: true }).toArray();
    validationResults.comparison.oldStructure = oldCourses.length;
    
    // Contar cursos na estrutura nova
    const newCourses = await cursosCollection.find({ isActive: true }).toArray();
    validationResults.comparison.newStructure = newCourses.length;
    
    // Comparar contagens de módulos, seções e aulas
    for (const oldCourse of oldCourses) {
        const newCourse = await cursosCollection.findOne({ cursoNome: oldCourse.cursoNome });
        
        if (!newCourse) {
            validationResults.comparison.differences.push({
                type: 'curso_faltando',
                cursoNome: oldCourse.cursoNome,
                message: `Curso existe na estrutura antiga mas não na nova`
            });
            continue;
        }
        
        // Contar módulos
        const oldModulesCount = (oldCourse.modules || []).filter(m => m.isActive).length;
        const modulosCollection = db.collection(COLLECTION_MODULOS);
        const newModulesCount = await modulosCollection.countDocuments({
            cursoId: newCourse._id,
            isActive: true
        });
        
        if (oldModulesCount !== newModulesCount) {
            validationResults.comparison.differences.push({
                type: 'modulos_count',
                cursoNome: oldCourse.cursoNome,
                oldCount: oldModulesCount,
                newCount: newModulesCount
            });
        }
        
        // Contar seções e aulas (simplificado)
        let oldSectionsCount = 0;
        let oldLessonsCount = 0;
        
        for (const module of (oldCourse.modules || [])) {
            if (module.isActive) {
                for (const section of (module.sections || [])) {
                    if (section.isActive) {
                        oldSectionsCount++;
                        oldLessonsCount += (section.lessons || []).filter(l => l.isActive).length;
                    }
                }
            }
        }
        
        const secoesCollection = db.collection(COLLECTION_SECOES);
        const aulasCollection = db.collection(COLLECTION_AULAS);
        
        const modulosIds = await modulosCollection.find({ cursoId: newCourse._id, isActive: true })
            .map(m => m._id).toArray();
        
        const newSectionsCount = await secoesCollection.countDocuments({
            moduloId: { $in: modulosIds },
            isActive: true
        });
        
        const secoesIds = await secoesCollection.find({ moduloId: { $in: modulosIds }, isActive: true })
            .map(s => s._id).toArray();
        
        const newLessonsCount = await aulasCollection.countDocuments({
            secaoId: { $in: secoesIds },
            isActive: true
        });
        
        if (oldSectionsCount !== newSectionsCount) {
            validationResults.comparison.differences.push({
                type: 'secoes_count',
                cursoNome: oldCourse.cursoNome,
                oldCount: oldSectionsCount,
                newCount: newSectionsCount
            });
        }
        
        if (oldLessonsCount !== newLessonsCount) {
            validationResults.comparison.differences.push({
                type: 'aulas_count',
                cursoNome: oldCourse.cursoNome,
                oldCount: oldLessonsCount,
                newCount: newLessonsCount
            });
        }
    }
    
    console.log(`  📚 Estrutura antiga: ${validationResults.comparison.oldStructure} cursos`);
    console.log(`  📚 Estrutura nova: ${validationResults.comparison.newStructure} cursos`);
    console.log(`  ⚠️  Diferenças encontradas: ${validationResults.comparison.differences.length}`);
}

// Função principal
async function validateNormalizedData() {
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
        console.log('✅ Conectado ao MongoDB\n');
        
        const db = client.db(DB_NAME);
        
        // Executar validações
        await validateCursos(db);
        await validateModulos(db);
        await validateSecoes(db);
        await validateAulas(db);
        await compareStructures(db);
        
        // Relatório final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RELATÓRIO DE VALIDAÇÃO');
        console.log('='.repeat(60));
        
        console.log(`\n✅ Cursos: ${validationResults.cursos.valid}/${validationResults.cursos.total} válidos`);
        if (validationResults.cursos.invalid > 0) {
            console.log(`❌ Cursos com problemas: ${validationResults.cursos.invalid}`);
            validationResults.cursos.issues.slice(0, 5).forEach(issue => {
                console.log(`   - ${issue.cursoNome}: ${issue.issues.join(', ')}`);
            });
        }
        
        console.log(`\n✅ Módulos: ${validationResults.modulos.valid}/${validationResults.modulos.total} válidos`);
        if (validationResults.modulos.invalid > 0 || validationResults.modulos.orphaned > 0) {
            console.log(`❌ Módulos com problemas: ${validationResults.modulos.invalid}`);
            console.log(`⚠️  Módulos órfãos: ${validationResults.modulos.orphaned}`);
        }
        
        console.log(`\n✅ Seções: ${validationResults.secoes.valid}/${validationResults.secoes.total} válidas`);
        if (validationResults.secoes.invalid > 0 || validationResults.secoes.orphaned > 0) {
            console.log(`❌ Seções com problemas: ${validationResults.secoes.invalid}`);
            console.log(`⚠️  Seções órfãs: ${validationResults.secoes.orphaned}`);
        }
        
        console.log(`\n✅ Aulas: ${validationResults.aulas.valid}/${validationResults.aulas.total} válidas`);
        if (validationResults.aulas.invalid > 0 || validationResults.aulas.orphaned > 0) {
            console.log(`❌ Aulas com problemas: ${validationResults.aulas.invalid}`);
            console.log(`⚠️  Aulas órfãs: ${validationResults.aulas.orphaned}`);
        }
        
        if (validationResults.comparison.differences.length > 0) {
            console.log(`\n⚠️  Diferenças entre estruturas: ${validationResults.comparison.differences.length}`);
            validationResults.comparison.differences.slice(0, 10).forEach(diff => {
                console.log(`   - ${diff.type} em ${diff.cursoNome}: antiga=${diff.oldCount}, nova=${diff.newCount}`);
            });
        }
        
        const totalIssues = 
            validationResults.cursos.invalid +
            validationResults.modulos.invalid +
            validationResults.secoes.invalid +
            validationResults.aulas.invalid +
            validationResults.modulos.orphaned +
            validationResults.secoes.orphaned +
            validationResults.aulas.orphaned +
            validationResults.comparison.differences.length;
        
        if (totalIssues === 0) {
            console.log('\n✨ Validação concluída: Todos os dados estão válidos!');
        } else {
            console.log(`\n⚠️  Validação concluída: ${totalIssues} problemas encontrados`);
        }
        
    } catch (error) {
        console.error('❌ Erro durante validação:', error);
        throw error;
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Conexão MongoDB fechada');
        }
    }
}

// Executar validação
if (require.main === module) {
    validateNormalizedData()
        .then(() => {
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Erro ao executar script:', error);
            process.exit(1);
        });
}

module.exports = { validateNormalizedData };

