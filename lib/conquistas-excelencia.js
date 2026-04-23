// VERSION: v1.0.1 | DATE: 2026-04-23 | Quadro Excelência: leitura só atendimento_trophies — NUNCA course_progress.

const COL_ATEND = 'atendimento_trophies';

function normalizeEmail(email) {
    return String(email || '').toLowerCase().trim();
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} userEmail
 * @returns {Promise<Array<{ id: string, conquista_titulo: string, trophy_url: string, xpClass: number|null, createdAt: string|null }>>}
 */
async function fetchConquistasExcelencia(db, userEmail) {
    const email = normalizeEmail(userEmail);
    if (!email) return [];

    const docs = await db
        .collection(COL_ATEND)
        .find({
            $or: [{ colaboradorEmail: email }, { email: email }]
        })
        .sort({ createdAt: -1 })
        .toArray();

    return docs.map((d) => ({
        id: d.id != null ? String(d.id) : String(d._id),
        conquista_titulo: typeof d.conquista_titulo === 'string' ? d.conquista_titulo : '',
        trophy_url: typeof d.trophy_url === 'string' ? d.trophy_url.trim() : '',
        xpClass: d.xpClass != null && !Number.isNaN(Number(d.xpClass)) ? Number(d.xpClass) : null,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null
    }));
}

async function ensureExcelenciaIndex(db) {
    try {
        await db.collection(COL_ATEND).createIndex({ colaboradorEmail: 1, createdAt: -1 });
    } catch (e) {
        /* noop */
    }
    try {
        await db.collection(COL_ATEND).createIndex({ email: 1, createdAt: -1 });
    } catch (e) {
        /* noop */
    }
}

module.exports = {
    fetchConquistasExcelencia,
    ensureExcelenciaIndex,
    COL_ATEND
};
