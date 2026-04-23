// VERSION: v1.3.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Persistência de resultado de quiz em tema_certificados (aprovado) ou quiz_reprovas (reprovado)
// Aprovação: no máximo um documento por email + courseId (primeiro registo preservado).

const { findSectionContextByQuizId, pickTemaTrophySnapshotUrl } = require('./cursos-conteudo-lookup');
const { tryRegisterModuloAfterTemaEvent } = require('./modulo-certificados');

const COL_CERT = 'tema_certificados';
const COL_REPROV = 'quiz_reprovas';

/**
 * Índice único (melhor esforço): evita duplicados em corrida; falha silenciosa se já existirem duplicados legados.
 * @param {import('mongodb').Db} db
 */
async function ensureCertApprovalUniqueIndex(db) {
    try {
        await db.collection(COL_CERT).createIndex(
            { email: 1, courseId: 1 },
            { unique: true, name: 'tema_cert_email_courseId_unique' }
        );
    } catch (e) {
        /* índice já existe, duplicados legados ou permissão */
    }
}

/**
 * @param {import('mongodb').Db} db
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.courseId
 * @param {string} [params.courseName]
 * @param {number} params.score
 * @param {number} params.totalQuestions
 * @param {number} params.finalGrade
 * @param {boolean} params.approved
 * @param {number[]} params.wrongQuestions - índices 1-based das questões erradas
 * @returns {Promise<{ collection: string, certificateId?: string, approvalInserted?: boolean }>}
 */
async function registerQuizResult(db, params) {
    const {
        name,
        email,
        courseId,
        courseName,
        score,
        totalQuestions,
        finalGrade,
        approved,
        wrongQuestions
    } = params;

    const now = new Date();
    const wrongQuestionsStr = wrongQuestions && Array.isArray(wrongQuestions)
        ? JSON.stringify(wrongQuestions)
        : '[]';
    const wrongQuestionsDisplay = wrongQuestionsStr !== '[]' ? wrongQuestionsStr : 'Sem Erros';

    if (approved) {
        const certificadosCollection = db.collection(COL_CERT);
        await ensureCertApprovalUniqueIndex(db);

        const emailNorm = email.toLowerCase().trim();
        const courseIdStr = courseId;

        const ctx = await findSectionContextByQuizId(db, courseIdStr);
        const sc = score != null ? parseInt(score, 10) : 0;
        const tq = totalQuestions != null ? parseInt(totalQuestions, 10) : 0;
        const badgeCategoria = tq > 0 && sc === tq ? 'Prata' : 'Bronze';
        let temaTitulo = (courseName && String(courseName).trim()) || courseIdStr;
        let temaTrophyIconUrl = '';
        if (ctx) {
            temaTitulo = ctx.section.temaNome || temaTitulo;
            temaTrophyIconUrl = pickTemaTrophySnapshotUrl(
                badgeCategoria,
                ctx.section.temaTrophyIconUrlBronze,
                ctx.section.temaTrophyIconUrlPrata
            );
        }

        const existing = await certificadosCollection.findOne({
            email: emailNorm,
            courseId: courseIdStr,
            status: 'Aprovado'
        });
        if (existing) {
            if (ctx) {
                await tryRegisterModuloAfterTemaEvent(db, emailNorm, name.trim(), {
                    cursoNome: ctx.cursoNome,
                    moduleId: ctx.moduleId,
                    courseId: courseIdStr
                });
            }
            const certId = existing.certificateId || String(existing._id || '');
            console.log('Certificado já existente (sem novo insert):', {
                email: emailNorm,
                courseId: courseIdStr,
                certificateId: certId
            });
            return {
                collection: COL_CERT,
                certificateId: certId || undefined,
                approvalInserted: false
            };
        }

        const doc = {
            date: now,
            colaboradorNome: name.trim(),
            email: emailNorm,
            courseId: courseIdStr,
            courseName: temaTitulo,
            temaTitulo,
            temaTrophyIconUrl,
            temaConclusaoTipo: 'quiz',
            badgeCategoria,
            score: score != null ? parseInt(score, 10) : null,
            totalQuestions: totalQuestions != null ? parseInt(totalQuestions, 10) : null,
            finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
            wrongQuestions: wrongQuestionsDisplay,
            status: 'Aprovado'
        };

        try {
            const ins = await certificadosCollection.insertOne(doc);
            const certificateId = ins.insertedId.toString();
            console.log('Certificado registrado:', { email: doc.email, courseId: doc.courseId });
            if (ctx) {
                await tryRegisterModuloAfterTemaEvent(db, emailNorm, name.trim(), {
                    cursoNome: ctx.cursoNome,
                    moduleId: ctx.moduleId,
                    courseId: courseIdStr
                });
            }
            return { collection: COL_CERT, certificateId, approvalInserted: true };
        } catch (e) {
            if (e && e.code === 11000) {
                const fallback = await certificadosCollection.findOne({
                    email: emailNorm,
                    courseId: courseIdStr,
                    status: 'Aprovado'
                });
                if (fallback) {
                    if (ctx) {
                        await tryRegisterModuloAfterTemaEvent(db, emailNorm, name.trim(), {
                            cursoNome: ctx.cursoNome,
                            moduleId: ctx.moduleId,
                            courseId: courseIdStr
                        });
                    }
                    console.log('Certificado já existente (após 11000):', {
                        email: emailNorm,
                        courseId: courseIdStr
                    });
                    return {
                        collection: COL_CERT,
                        certificateId: fallback.certificateId || String(fallback._id || '') || undefined,
                        approvalInserted: false
                    };
                }
            }
            throw e;
        }
    }

    const reprovasCollection = db.collection(COL_REPROV);
    const doc = {
        date: now,
        colaboradorNome: name.trim(),
        email: email.toLowerCase().trim(),
        courseId: courseId,
        courseName: courseName || courseId,
        finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
        wrongQuestions: wrongQuestionsDisplay
    };
    await reprovasCollection.insertOne(doc);
    console.log('Reprovação registrada:', { email: doc.email, courseId: doc.courseId });
    return { collection: COL_REPROV };
}

module.exports = {
    registerQuizResult,
    ensureCertApprovalUniqueIndex,
    COL_CERT,
    COL_REPROV
};
