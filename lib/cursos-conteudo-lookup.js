// VERSION: v1.1.0 | DATE: 2026-04-23 | expectedLessonTitlesBySubtitle (paridade com js/veloacademy.js; 1 ou N aulas)

const COL_CURSOS = 'cursos_conteudo';

/**
 * @param {string} temaNome
 */
function snakeCaseTemaId(temaNome) {
    return String(temaNome || '')
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

/**
 * @param {object} sec
 * @returns {string}
 */
function sectionCourseId(sec) {
    if (sec.quizId && String(sec.quizId).trim()) return String(sec.quizId).trim();
    const tn = sec.temaNome || sec.subtitle || '';
    return snakeCaseTemaId(tn);
}

/**
 * @param {string} badgeCategoria 'Prata' | 'Bronze'
 * @param {string} [bronze]
 * @param {string} [prata]
 */
function pickTemaTrophySnapshotUrl(badgeCategoria, bronze, prata) {
    const b = typeof bronze === 'string' ? bronze.trim() : '';
    const p = typeof prata === 'string' ? prata.trim() : '';
    if (badgeCategoria === 'Prata' && p) return p;
    if (b) return b;
    return p || '';
}

/**
 * @param {object} sec raw section from Mongo
 */
/**
 * Paridade com js/veloacademy.js — URLs YouTube na trilha.
 * @param {string} [filePath]
 */
function isYouTubeLessonUrl(filePath) {
    const s = typeof filePath === 'string' ? filePath : '';
    return /youtube\.com|youtu\.be/i.test(s);
}

/**
 * Ordem: vídeos YouTube da secção, depois pdf/document/audio/slide e vídeo não-YouTube.
 * @param {object[]} lessons
 * @returns {string[]}
 */
function expectedLessonTitlesFromSectionLessons(lessons) {
    const list = Array.isArray(lessons) ? lessons : [];
    const out = [];
    const yt = list.filter((l) => l && l.type === 'video' && isYouTubeLessonUrl(l.filePath));
    yt.forEach((l) => {
        const t = typeof l.title === 'string' ? l.title.trim() : '';
        if (t) out.push(t);
    });
    list.forEach((l) => {
        if (!l || !l.title) return;
        const t = String(l.title).trim();
        if (!t) return;
        if (
            l.type === 'pdf' ||
            l.type === 'document' ||
            l.type === 'audio' ||
            l.type === 'slide' ||
            (l.type === 'video' && !isYouTubeLessonUrl(l.filePath))
        ) {
            out.push(t);
        }
    });
    return out;
}

/**
 * @param {object} raw secção Mongo (com lessons[])
 * @param {string} sub subtitle / tema chave no progresso
 */
function sectionSubtitleMatches(raw, sec, sub) {
    return (
        sec.temaNome === sub ||
        (typeof raw.subtitle === 'string' && raw.subtitle.trim() === sub)
    );
}

function normalizeSection(sec) {
    const temaNome =
        (typeof sec.temaNome === 'string' && sec.temaNome.trim()) ||
        (typeof sec.subtitle === 'string' && sec.subtitle.trim()) ||
        '';
    return {
        temaNome,
        temaOrder: sec.temaOrder,
        isActive: sec.isActive,
        hasQuiz: sec.hasQuiz === true,
        quizId: sec.quizId != null ? String(sec.quizId).trim() : '',
        temaTrophyIconUrlBronze:
            (typeof sec.temaTrophyIconUrlBronze === 'string' && sec.temaTrophyIconUrlBronze.trim()) ||
            (typeof sec.temaTrophyIconUrl === 'string' ? sec.temaTrophyIconUrl.trim() : '') ||
            '',
        temaTrophyIconUrlPrata:
            (typeof sec.temaTrophyIconUrlPrata === 'string' && sec.temaTrophyIconUrlPrata.trim()) ||
            (typeof sec.temaTrophyIconUrl === 'string' ? sec.temaTrophyIconUrl.trim() : '') ||
            ''
    };
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} quizId courseId / quizID
 * @returns {Promise<null | { cursoNome: string, moduleId: string, moduleNome: string, moduleTrophyIconUrl: string, section: ReturnType<normalizeSection>, courseId: string }>}
 */
async function findSectionContextByQuizId(db, quizId) {
    const q = String(quizId || '').trim();
    if (!q) return null;

    const courses = await db
        .collection(COL_CURSOS)
        .find({ isActive: true })
        .project({ cursoNome: 1, modules: 1 })
        .toArray();

    for (const c of courses) {
        const cursoNome = typeof c.cursoNome === 'string' ? c.cursoNome : '';
        for (const mod of c.modules || []) {
            if (mod.isActive === false) continue;
            const moduleId = typeof mod.moduleId === 'string' ? mod.moduleId : String(mod.moduleId || '');
            const moduleNome =
                typeof mod.moduleNome === 'string' && mod.moduleNome.trim()
                    ? mod.moduleNome.trim()
                    : moduleId;
            const moduleTrophyIconUrl =
                typeof mod.moduleTrophyIconUrl === 'string' ? mod.moduleTrophyIconUrl.trim() : '';
            for (const raw of mod.sections || []) {
                if (raw.isActive === false) continue;
                const sec = normalizeSection(raw);
                const cid = sectionCourseId({ ...raw, ...sec });
                if (cid === q || sec.quizId === q) {
                    return {
                        cursoNome,
                        moduleId,
                        moduleNome,
                        moduleTrophyIconUrl,
                        section: sec,
                        courseId: cid
                    };
                }
            }
        }
    }
    return null;
}

/**
 * subtitle do progresso = temaNome exibido
 * @param {import('mongodb').Db} db
 * @param {string} subtitle
 */
async function findSectionContextBySubtitle(db, subtitle) {
    const sub = String(subtitle || '').trim();
    if (!sub) return null;

    const courses = await db
        .collection(COL_CURSOS)
        .find({ isActive: true })
        .project({ cursoNome: 1, modules: 1 })
        .toArray();

    for (const c of courses) {
        const cursoNome = typeof c.cursoNome === 'string' ? c.cursoNome : '';
        for (const mod of c.modules || []) {
            if (mod.isActive === false) continue;
            const moduleId = typeof mod.moduleId === 'string' ? mod.moduleId : String(mod.moduleId || '');
            const moduleNome =
                typeof mod.moduleNome === 'string' && mod.moduleNome.trim()
                    ? mod.moduleNome.trim()
                    : moduleId;
            const moduleTrophyIconUrl =
                typeof mod.moduleTrophyIconUrl === 'string' ? mod.moduleTrophyIconUrl.trim() : '';
            for (const raw of mod.sections || []) {
                if (raw.isActive === false) continue;
                const sec = normalizeSection(raw);
                if (sectionSubtitleMatches(raw, sec, sub)) {
                    return {
                        cursoNome,
                        moduleId,
                        moduleNome,
                        moduleTrophyIconUrl,
                        section: sec,
                        courseId: sectionCourseId({ ...raw, ...sec })
                    };
                }
            }
        }
    }
    return null;
}

/**
 * Lista de títulos de aula esperados para o tema (course_progress / quizUnlocked).
 * Fonte: cursos_conteudo — mesma regra que o front (1 aula ou várias).
 * @param {import('mongodb').Db} db
 * @param {string} subtitle
 * @returns {Promise<string[]|null>} null se tema não encontrado
 */
async function findExpectedLessonTitlesBySubtitle(db, subtitle) {
    const sub = String(subtitle || '').trim();
    if (!sub) return null;

    const courses = await db
        .collection(COL_CURSOS)
        .find({ isActive: true })
        .project({ modules: 1 })
        .toArray();

    for (const c of courses) {
        for (const mod of c.modules || []) {
            if (mod.isActive === false) continue;
            for (const raw of mod.sections || []) {
                if (raw.isActive === false) continue;
                const sec = normalizeSection(raw);
                if (!sectionSubtitleMatches(raw, sec, sub)) continue;
                const titles = expectedLessonTitlesFromSectionLessons(raw.lessons);
                if (titles.length === 0) return null;
                return titles;
            }
        }
    }
    return null;
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} cursoNome
 * @param {string} moduleId
 * @returns {Promise<null | { cursoNome: string, moduleId: string, moduleNome: string, moduleTrophyIconUrl: string, sections: object[] }>}
 */
async function findModuleContext(db, cursoNome, moduleId) {
    const cn = String(cursoNome || '').trim();
    const mid = String(moduleId || '').trim();
    if (!cn || !mid) return null;

    const course = await db.collection(COL_CURSOS).findOne({ cursoNome: cn, isActive: true }, { projection: { modules: 1 } });
    if (!course) return null;
    for (const mod of course.modules || []) {
        if (mod.isActive === false) continue;
        const mId = typeof mod.moduleId === 'string' ? mod.moduleId : String(mod.moduleId || '');
        if (mId !== mid) continue;
        const moduleNome =
            typeof mod.moduleNome === 'string' && mod.moduleNome.trim()
                ? mod.moduleNome.trim()
                : mId;
        const moduleTrophyIconUrl =
            typeof mod.moduleTrophyIconUrl === 'string' ? mod.moduleTrophyIconUrl.trim() : '';
        return {
            cursoNome: cn,
            moduleId: mId,
            moduleNome,
            moduleTrophyIconUrl,
            sections: mod.sections || []
        };
    }
    return null;
}

module.exports = {
    COL_CURSOS,
    snakeCaseTemaId,
    sectionCourseId,
    pickTemaTrophySnapshotUrl,
    findSectionContextByQuizId,
    findSectionContextBySubtitle,
    findExpectedLessonTitlesBySubtitle,
    findModuleContext,
    normalizeSection,
    expectedLessonTitlesFromSectionLessons,
    isYouTubeLessonUrl
};
