// VERSION: v2.2.4 | DATE: 2026-04-23 | trophyUrlFromCertDoc: chaves legadas snake_case / trophy_url (só leitura).
// Opcional: cursos_conteudo só para URL de troféu quando tema_certificados.temaTrophyIconUrl vem vazio (catálogo, não progresso).

const { findSectionContextByQuizId, pickTemaTrophySnapshotUrl } = require('./cursos-conteudo-lookup');
const { ensureModuloCertIndex, COL_MOD, COL_TEMA } = require('./modulo-certificados');

const COL_CERT = COL_TEMA;

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

function trophyUrlFromCertDoc(c) {
    if (!c || typeof c !== 'object') return '';
    const candidates = [
        c.temaTrophyIconUrl,
        c.trophyIconUrl,
        c.trophy_url,
        c.tema_trophy_icon_url,
        c.certificateUrl
    ];
    for (const v of candidates) {
        if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
}

function certDateMs(c) {
    if (!c || !c.date) return -Infinity;
    const t = new Date(c.date).getTime();
    return Number.isNaN(t) ? -Infinity : t;
}

/**
 * Vários docs por email+courseId (pré-índice único): ficar com o mais recente; se empate, preferir um com URL de troféu.
 * @param {object[]} docs
 */
function pickBestCertForCourse(docs) {
    if (!docs || docs.length === 0) return null;
    if (docs.length === 1) return docs[0];
    return docs.reduce((best, cur) => {
        const tb = certDateMs(best);
        const tc = certDateMs(cur);
        if (tc !== tb) return tc > tb ? cur : best;
        const ub = trophyUrlFromCertDoc(best);
        const uc = trophyUrlFromCertDoc(cur);
        if (!ub && uc) return cur;
        if (ub && !uc) return best;
        return best;
    });
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

    const groups = new Map();
    for (const c of certs) {
        const qid = c.courseId != null && c.courseId !== '' ? String(c.courseId).trim() : '';
        if (!qid) continue;
        if (!groups.has(qid)) groups.set(qid, []);
        groups.get(qid).push(c);
    }

    const byCourse = new Map();
    for (const [qid, arr] of groups) {
        const chosen = pickBestCertForCourse(arr);
        if (chosen) byCourse.set(qid, chosen);
    }

    const rows = [];
    for (const c of byCourse.values()) {
        const quizID =
            c.courseId != null && c.courseId !== '' ? String(c.courseId).trim() : '';
        const temaNome =
            (c.temaTitulo && String(c.temaTitulo).trim()) ||
            (c.courseName && String(c.courseName).trim()) ||
            quizID;
        const badgeIconUrl = trophyUrlFromCertDoc(c) || '';
        const temaConclusaoTipo =
            c.temaConclusaoTipo ||
            (c.status === 'Concluído' ? 'visualizacao' : 'quiz');
        rows.push({
            quizID,
            temaNome,
            badgeIconUrl,
            temaTrophyIconUrl: badgeIconUrl,
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

    for (const row of rows) {
        if ((row.badgeIconUrl || '').trim()) continue;
        const ctx = await findSectionContextByQuizId(db, String(row.quizID || '').trim());
        if (!ctx || !ctx.section) continue;
        const sec = ctx.section;
        const tier =
            row.badgeCategoria === 'Prata'
                ? 'Prata'
                : row.badgeCategoria === 'Bronze'
                  ? 'Bronze'
                  : 'Bronze';
        const url = pickTemaTrophySnapshotUrl(tier, sec.temaTrophyIconUrlBronze, sec.temaTrophyIconUrlPrata);
        if (url) {
            row.badgeIconUrl = url;
            row.temaTrophyIconUrl = url;
        }
    }

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
        .find({ email, completed: true })
        .sort({ completedAt: -1 })
        .toArray();

    return persisted.map((r) => ({
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
    COL_MOD
};
