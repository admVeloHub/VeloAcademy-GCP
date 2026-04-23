// VERSION: v1.0.0 | DATE: 2026-04-14 | Temas recentes (secoes ou agregação cursos_conteudo) para home
/**
 * @param {import('mongodb').Db} db
 * @param {number} limit
 * @returns {Promise<Array<{ temaNome: string, cursoNome: string, moduleNome: string, updatedAt: string|null }>>}
 */
async function fetchRecentTemasFromSecoes(db, limit) {
    try {
        const pipeline = [
            { $match: { isActive: true } },
            { $sort: { updatedAt: -1, _id: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'modulos',
                    localField: 'moduloId',
                    foreignField: '_id',
                    as: '_m'
                }
            },
            { $unwind: { path: '$_m', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'cursos',
                    localField: '_m.cursoId',
                    foreignField: '_id',
                    as: '_c'
                }
            },
            { $unwind: { path: '$_c', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    temaNome: '$temaNome',
                    cursoNome: '$_c.cursoNome',
                    moduleNome: '$_m.moduleNome',
                    updatedAt: 1
                }
            }
        ];
        const rows = await db.collection('secoes').aggregate(pipeline).toArray();
        if (!rows.length) return null;
        return rows;
    } catch (e) {
        return null;
    }
}

async function fetchRecentTemasFromCursosConteudoAgg(db, limit) {
    const col = db.collection('cursos_conteudo');
    const pipeline = [
        { $match: { isActive: true } },
        { $unwind: { path: '$modules', preserveNullAndEmptyArrays: false } },
        { $match: { 'modules.isActive': true } },
        { $unwind: { path: '$modules.sections', preserveNullAndEmptyArrays: false } },
        { $match: { 'modules.sections.isActive': true } },
        {
            $addFields: {
                _sortAt: { $ifNull: ['$modules.sections.updatedAt', '$updatedAt'] }
            }
        },
        { $sort: { _sortAt: -1, _id: -1 } },
        { $limit: limit },
        {
            $project: {
                _id: 0,
                temaNome: '$modules.sections.temaNome',
                cursoNome: '$cursoNome',
                moduleNome: '$modules.moduleNome',
                updatedAt: '$_sortAt'
            }
        }
    ];
    return col.aggregate(pipeline).toArray();
}

function serializeRows(rows) {
    return (rows || []).map((r) => ({
        temaNome: typeof r.temaNome === 'string' ? r.temaNome : String(r.temaNome || ''),
        cursoNome: typeof r.cursoNome === 'string' ? r.cursoNome : String(r.cursoNome || ''),
        moduleNome: typeof r.moduleNome === 'string' ? r.moduleNome : String(r.moduleNome || ''),
        updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : null
    }));
}

async function fetchRecentTemas(db, limit) {
    let rows = await fetchRecentTemasFromSecoes(db, limit);
    if (!rows) {
        rows = await fetchRecentTemasFromCursosConteudoAgg(db, limit);
    }
    return serializeRows(rows);
}

module.exports = { fetchRecentTemas };
