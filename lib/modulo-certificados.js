// VERSION: v2.0.0 | DATE: 2026-04-23 | modulo_certificados: progresso por tema (temasConcluidos) + completed

const { findModuleContext, sectionCourseId, normalizeSection } = require('./cursos-conteudo-lookup');

const COL_MOD = 'modulo_certificados';
const COL_TEMA = 'tema_certificados';

/** Chave Mongo: ids de tema (courseId) concluídos no módulo */
const FIELD_TEMAS_CONCLUIDOS = 'temasConcluídos';

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} email
 * @param {string} cursoNome
 * @param {string} moduleId
 */
async function isModuleFullyComplete(db, email, cursoNome, moduleId) {
    const emailNorm = normalizeEmail(email);
    const mod = await findModuleContext(db, cursoNome, moduleId);
    if (!mod) return false;

    const col = db.collection(COL_TEMA);
    for (const raw of mod.sections) {
        if (raw.isActive === false) continue;
        const sec = normalizeSection(raw);
        const cid = sectionCourseId(raw);
        if (sec.hasQuiz) {
            const ok = await col.findOne({
                email: emailNorm,
                courseId: cid,
                status: 'Aprovado'
            });
            if (!ok) return false;
        } else {
            const ok = await col.findOne({
                email: emailNorm,
                courseId: cid,
                status: 'Concluído'
            });
            if (!ok) return false;
        }
    }
    return true;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} emailNorm
 * @param {string} cursoNome
 * @param {string} moduleId
 * @param {object[]} rawSections
 */
async function maxCompletedAtForModule(db, emailNorm, _cursoNome, _moduleId, rawSections) {
    const col = db.collection(COL_TEMA);
    let maxMs = 0;
    for (const raw of rawSections) {
        if (raw.isActive === false) continue;
        const sec = normalizeSection(raw);
        const cid = sectionCourseId(raw);
        const st = sec.hasQuiz ? 'Aprovado' : 'Concluído';
        const doc = await col.findOne(
            { email: emailNorm, courseId: cid, status: st },
            { projection: { date: 1 } }
        );
        if (doc && doc.date) {
            const t = new Date(doc.date).getTime();
            if (!Number.isNaN(t) && t > maxMs) maxMs = t;
        }
    }
    return maxMs ? new Date(maxMs) : null;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} email
 * @param {string} colaboradorNome
 * @param {{ cursoNome: string, moduleId: string, courseId: string }} hint courseId = tema concluído (quiz ou visual)
 */
async function tryRegisterModuloAfterTemaEvent(db, email, colaboradorNome, hint) {
    if (!hint || !hint.cursoNome || !hint.moduleId || !hint.courseId) return;

    const emailNorm = normalizeEmail(email);
    const courseIdStr = String(hint.courseId).trim();
    if (!emailNorm || !courseIdStr) return;

    const modCtx = await findModuleContext(db, hint.cursoNome, hint.moduleId);
    if (!modCtx) return;

    const now = new Date();
    const coll = db.collection(COL_MOD);

    await coll.updateOne(
        { email: emailNorm, moduleId: modCtx.moduleId },
        {
            $setOnInsert: {
                email: emailNorm,
                moduleId: modCtx.moduleId,
                createdAt: now,
                completed: false,
                [FIELD_TEMAS_CONCLUIDOS]: []
            },
            $set: {
                colaboradorNome: String(colaboradorNome || '').trim(),
                moduleNome: modCtx.moduleNome,
                moduleTrophyIconUrl: modCtx.moduleTrophyIconUrl || '',
                updatedAt: now
            },
            $addToSet: { [FIELD_TEMAS_CONCLUIDOS]: courseIdStr }
        },
        { upsert: true }
    );

    const complete = await isModuleFullyComplete(db, email, hint.cursoNome, hint.moduleId);
    if (!complete) return;

    const maxDate =
        (await maxCompletedAtForModule(
            db,
            emailNorm,
            hint.cursoNome,
            hint.moduleId,
            modCtx.sections
        )) || now;

    await coll.updateOne(
        { email: emailNorm, moduleId: modCtx.moduleId },
        {
            $set: {
                completed: true,
                completedAt: maxDate,
                updatedAt: now
            }
        }
    );
}

async function ensureModuloCertIndex(db) {
    try {
        await db.collection(COL_MOD).createIndex(
            { email: 1, moduleId: 1 },
            { unique: true, name: 'modcert_email_module_unique' }
        );
    } catch (e) {
        /* já existe ou duplicados legados */
    }
}

module.exports = {
    COL_MOD,
    COL_TEMA,
    FIELD_TEMAS_CONCLUIDOS,
    tryRegisterModuloAfterTemaEvent,
    isModuleFullyComplete,
    ensureModuloCertIndex,
    maxCompletedAtForModule
};
