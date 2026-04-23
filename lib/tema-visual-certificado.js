// VERSION: v1.1.0 | DATE: 2026-04-23 | tema_certificados para conclusão só visual (sem quiz)

const {
    findSectionContextBySubtitle,
    pickTemaTrophySnapshotUrl
} = require('./cursos-conteudo-lookup');
const { tryRegisterModuloAfterTemaEvent, COL_TEMA } = require('./modulo-certificados');

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

/**
 * @param {import('mongodb').Db} db
 * @param {{ userEmail: string, colaboradorNome?: string, subtitle: string, quizUnlocked: boolean }} params
 * @returns {Promise<{ inserted: boolean, certificateId?: string }>}
 */
async function registerTemaVisualizacaoIfNeeded(db, params) {
    const { userEmail, colaboradorNome, subtitle, quizUnlocked } = params;
    const emailNorm = normalizeEmail(userEmail);
    if (!emailNorm || !quizUnlocked) return { inserted: false };

    const ctx = await findSectionContextBySubtitle(db, subtitle);
    if (!ctx || ctx.section.hasQuiz) return { inserted: false };

    const courseId = ctx.courseId;
    const col = db.collection(COL_TEMA);

    const existing = await col.findOne({
        email: emailNorm,
        courseId,
        status: { $in: ['Aprovado', 'Concluído'] }
    });
    if (existing) {
        await tryRegisterModuloAfterTemaEvent(
            db,
            emailNorm,
            colaboradorNome || existing.colaboradorNome || existing.name || '',
            {
                cursoNome: ctx.cursoNome,
                moduleId: ctx.moduleId,
                courseId
            }
        );
        return {
            inserted: false,
            certificateId: existing.certificateId || String(existing._id || '')
        };
    }

    const now = new Date();
    const temaTitulo = ctx.section.temaNome || subtitle;
    const temaTrophyIconUrl = pickTemaTrophySnapshotUrl(
        'Bronze',
        ctx.section.temaTrophyIconUrlBronze,
        ctx.section.temaTrophyIconUrlPrata
    );

    const doc = {
        date: now,
        colaboradorNome: String(colaboradorNome || '').trim() || '—',
        email: emailNorm,
        courseId,
        courseName: temaTitulo,
        temaTitulo,
        temaTrophyIconUrl,
        temaConclusaoTipo: 'visualizacao',
        badgeCategoria: null,
        score: null,
        totalQuestions: null,
        finalGrade: null,
        wrongQuestions: 'Sem Erros',
        status: 'Concluído'
    };

    try {
        const ins = await col.insertOne(doc);
        const certificateId = ins.insertedId.toString();
        await tryRegisterModuloAfterTemaEvent(db, emailNorm, doc.colaboradorNome, {
            cursoNome: ctx.cursoNome,
            moduleId: ctx.moduleId,
            courseId
        });
        return { inserted: true, certificateId };
    } catch (e) {
        if (e && e.code === 11000) {
            await tryRegisterModuloAfterTemaEvent(db, emailNorm, colaboradorNome || '', {
                cursoNome: ctx.cursoNome,
                moduleId: ctx.moduleId,
                courseId
            });
            return { inserted: false };
        }
        throw e;
    }
}

module.exports = {
    registerTemaVisualizacaoIfNeeded
};
