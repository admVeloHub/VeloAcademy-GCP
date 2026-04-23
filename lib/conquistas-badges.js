// VERSION: v2.1.0 | DATE: 2026-04-23 | Badges Conquistas: tema_certificados (opção B) e modulo_certificados
// Fallback de módulos: computa módulos completos se não houver linhas "vencidas" persistidas

const { COL_CURSOS, sectionCourseId } = require('./cursos-conteudo-lookup');
const {
    isModuleFullyComplete,
    ensureModuloCertIndex,
    maxCompletedAtForModule,
    COL_MOD,
    COL_TEMA
} = require('./modulo-certificados');

const COL_CERT = COL_TEMA;

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} userEmail
 * @returns {Promise<Array<{ quizID: string, temaNome: string, badgeIconUrl: string, badgeCategoria: string|null, temaConclusaoTipo: string, approvedAt: string|null }>>}
 */
async function fetchConquistasTemas(db, userEmail) {
    const email = normalizeEmail(userEmail);
    if (!email) return [];

    const certs = await db
        .collection(COL_CERT)
        .find({ email, status: { $in: ['Aprovado', 'Concluído'] } })
        .sort({ date: -1 })
        .toArray();

    const byCourse = new Map();
    for (const c of certs) {
        const qid = c.courseId;
        if (!qid || typeof qid !== 'string') continue;
        if (!byCourse.has(qid)) byCourse.set(qid, c);
    }

    const rows = [];
    for (const c of byCourse.values()) {
        const temaNome =
            (c.temaTitulo && String(c.temaTitulo).trim()) ||
            (c.courseName && String(c.courseName).trim()) ||
            c.courseId;
        const badgeIconUrl =
            (c.temaTrophyIconUrl && String(c.temaTrophyIconUrl).trim()) ||
            '';
        const temaConclusaoTipo =
            c.temaConclusaoTipo ||
            (c.status === 'Concluído' ? 'visualizacao' : 'quiz');
        rows.push({
            quizID: c.courseId,
            temaNome,
            badgeIconUrl,
            badgeCategoria: c.badgeCategoria != null ? c.badgeCategoria : null,
            temaConclusaoTipo,
            approvedAt: c.date ? new Date(c.date).toISOString() : null
        });
    }

    rows.sort((a, b) => {
        const ta = a.approvedAt ? Date.parse(a.approvedAt) : 0;
        const tb = b.approvedAt ? Date.parse(b.approvedAt) : 0;
        return tb - ta;
    });
    return rows;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} userEmail
 * @returns {Promise<Array<{ cursoNome: string, moduleId: string, moduleNome: string, badgeIconUrl: string, completedAt: string|null }>>}
 */
async function fetchConquistasModulos(db, userEmail) {
    const email = normalizeEmail(userEmail);
    if (!email) return [];

    await ensureModuloCertIndex(db);

    const persisted = await db
        .collection(COL_MOD)
        .find({ email })
        .sort({ completedAt: -1 })
        .toArray();

    const won = persisted.filter((r) => r.completed !== false);

    if (won.length > 0) {
        return won.map((r) => ({
            cursoNome: '',
            moduleId: typeof r.moduleId === 'string' ? r.moduleId : String(r.moduleId || ''),
            moduleNome:
                typeof r.moduleNome === 'string' && r.moduleNome.trim()
                    ? r.moduleNome.trim()
                    : String(r.moduleId || 'Módulo'),
            badgeIconUrl: (r.moduleTrophyIconUrl && String(r.moduleTrophyIconUrl).trim()) || '',
            completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null
        }));
    }

    const courses = await db
        .collection(COL_CURSOS)
        .find({ isActive: true })
        .sort({ courseOrder: 1 })
        .project({ cursoNome: 1, modules: 1 })
        .toArray();

    const out = [];
    for (const c of courses) {
        const cursoNome = typeof c.cursoNome === 'string' ? c.cursoNome : '';
        for (const mod of c.modules || []) {
            if (mod.isActive === false) continue;
            const moduleId = typeof mod.moduleId === 'string' ? mod.moduleId : String(mod.moduleId || '');
            const moduleNome =
                typeof mod.moduleNome === 'string' && mod.moduleNome.trim()
                    ? mod.moduleNome.trim()
                    : moduleId;
            const sections = mod.sections || [];
            if (!sections.length) continue;

            const complete = await isModuleFullyComplete(db, email, cursoNome, moduleId);
            if (!complete) continue;

            const moduleTrophyIconUrl =
                typeof mod.moduleTrophyIconUrl === 'string' ? mod.moduleTrophyIconUrl.trim() : '';
            const maxD = await maxCompletedAtForModule(db, email, cursoNome, moduleId, sections);
            const completedAt = maxD ? maxD.toISOString() : null;

            out.push({
                cursoNome,
                moduleId,
                moduleNome,
                badgeIconUrl: moduleTrophyIconUrl,
                completedAt
            });
        }
    }

    out.sort((a, b) => {
        const ta = a.completedAt ? Date.parse(a.completedAt) : 0;
        const tb = b.completedAt ? Date.parse(b.completedAt) : 0;
        return tb - ta;
    });
    return out;
}

/**
 * @param {import('mongodb').Db} db
 */
async function ensureCertIndex(db) {
    try {
        await db.collection(COL_CERT).createIndex({ email: 1, status: 1, courseId: 1 });
    } catch (e) {
        /* índice já existe ou permissão */
    }
}

module.exports = {
    fetchConquistasTemas,
    fetchConquistasModulos,
    ensureCertIndex,
    COL_CERT,
    COL_MOD,
    COL_CURSOS
};
