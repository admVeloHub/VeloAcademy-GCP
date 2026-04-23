// VERSION: v1.1.0 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// Leitura de quiz_conteudo (1 documento = 1 quiz, array questões), notaCorte e tentativas com shuffle

const COL_QUIZ_CONTEUDO = 'quiz_conteudo';
const COL_QUIZ_ATTEMPTS = 'quiz_attempts';

const ATTEMPT_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas

/**
 * Fisher–Yates shuffle de índices 0..n-1
 * @param {number} n
 * @returns {number[]}
 */
function shuffleIndices(n) {
    const arr = Array.from({ length: n }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * opção1 é sempre a correta (convenção de importação)
 * @param {object} opcoes - { opção1, opção2, opção3, opção4 }
 * @returns {{ optionTexts: string[], correctIndex: number }}
 */
function shuffleOptions(opcoes) {
    if (!opcoes || typeof opcoes !== 'object') {
        throw new Error('Opções inválidas na pergunta');
    }
    const canonical = [
        opcoes.opção1,
        opcoes.opção2,
        opcoes.opção3,
        opcoes.opção4
    ];
    if (canonical.some(t => t == null || String(t).trim() === '')) {
        throw new Error('Pergunta com opções incompletas');
    }
    const perm = shuffleIndices(4);
    const optionTexts = perm.map(i => String(canonical[i]));
    const correctIndex = perm.indexOf(0);
    return { optionTexts, correctIndex };
}

/**
 * Monta Opções a partir de um elemento de questões[]
 * @param {object} q
 */
function questaoToOpcoes(q) {
    if (!q || typeof q !== 'object') return null;
    return {
        opção1: q.opção1,
        opção2: q.opção2,
        opção3: q.opção3,
        opção4: q.opção4
    };
}

/**
 * @param {import('mongodb').Db} db
 * @param {string} quizID
 * @returns {Promise<{ doc: object, rows: object[], notaCorte: number }>}
 */
async function loadQuizQuestions(db, quizID) {
    const col = db.collection(COL_QUIZ_CONTEUDO);
    const doc = await col.findOne({ quizID: quizID.trim() });

    if (!doc || !Array.isArray(doc.questões) || doc.questões.length === 0) {
        const err = new Error('Quiz não encontrado ou sem perguntas');
        err.code = 'QUIZ_NOT_FOUND';
        throw err;
    }

    const notaCorte = Number(doc.notaCorte);
    if (!Number.isFinite(notaCorte) || notaCorte < 0 || notaCorte > doc.questões.length) {
        const err = new Error('notaCorte inválida para o número de questões');
        err.code = 'NOTA_CORTE_INVALID';
        throw err;
    }

    const rows = doc.questões.map((q, idx) => {
        const enunciado = (q.pergunta != null && String(q.pergunta).trim() !== '')
            ? String(q.pergunta)
            : (q.questão != null ? String(q.questão) : '');
        const Opções = questaoToOpcoes(q);
        return {
            questionIndex: idx,
            questão: enunciado,
            Opções
        };
    });

    const bad = rows.find((r) => !r.questão.trim());
    if (bad) {
        const err = new Error('Questão com enunciado vazio');
        err.code = 'QUIZ_INVALID';
        throw err;
    }

    return { doc, rows, notaCorte: Math.floor(notaCorte) };
}

/**
 * @param {object[]} rows - linhas normalizadas com questionIndex, questão, Opções
 * @returns {{ questionIndex: number, optionTexts: string[], correctIndex: number }[]}
 */
function buildAttemptItemsFromRows(rows) {
    return rows.map((row) => {
        const { optionTexts, correctIndex } = shuffleOptions(row.Opções);
        return {
            questionIndex: row.questionIndex,
            optionTexts,
            correctIndex
        };
    });
}

module.exports = {
    COL_QUIZ_CONTEUDO,
    COL_QUIZ_ATTEMPTS,
    ATTEMPT_TTL_MS,
    loadQuizQuestions,
    buildAttemptItemsFromRows,
    shuffleOptions
};
