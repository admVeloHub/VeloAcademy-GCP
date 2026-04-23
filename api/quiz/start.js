// VERSION: v1.1.0 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// POST /api/quiz/start - Carrega perguntas do MongoDB, embaralha opções e cria quiz_attempts

const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../../lib/mongodb');
const {
    COL_QUIZ_CONTEUDO,
    COL_QUIZ_ATTEMPTS,
    ATTEMPT_TTL_MS,
    loadQuizQuestions,
    buildAttemptItemsFromRows
} = require('../../lib/quiz-content');

let indexesEnsured = false;

async function ensureQuizIndexes(db) {
    if (indexesEnsured) return;
    try {
        await db.collection(COL_QUIZ_CONTEUDO).createIndex({ quizID: 1 }, { unique: true });
    } catch (e) {
        console.warn('ensureQuizIndexes quiz_conteudo unique (fallback sem unique se houver duplicados legados):', e.message);
        try {
            await db.collection(COL_QUIZ_CONTEUDO).createIndex({ quizID: 1 });
        } catch (e2) {
            console.warn('ensureQuizIndexes quiz_conteudo:', e2.message);
        }
    }
    try {
        await db.collection(COL_QUIZ_ATTEMPTS).createIndex({ attemptId: 1 }, { unique: true });
        await db.collection(COL_QUIZ_ATTEMPTS).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    } catch (e) {
        console.warn('ensureQuizIndexes quiz_attempts:', e.message);
    }
    indexesEnsured = true;
}

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    try {
        const quizID = req.body?.quizId || req.body?.quizID;
        if (!quizID || typeof quizID !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Campo obrigatório: quizId'
            });
        }

        const db = await getDatabase();
        if (!db) {
            return res.status(503).json({ success: false, error: 'MongoDB não disponível' });
        }

        await ensureQuizIndexes(db);

        const { doc, rows, notaCorte } = await loadQuizQuestions(db, quizID.trim());
        const items = buildAttemptItemsFromRows(rows);
        const quizContentId = doc._id.toString();

        const attemptId = uuidv4();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ATTEMPT_TTL_MS);

        await db.collection(COL_QUIZ_ATTEMPTS).insertOne({
            attemptId,
            quizID: quizID.trim(),
            quizContentId,
            notaCorte,
            items,
            consumed: false,
            createdAt: now,
            expiresAt
        });

        const questions = rows.map((row, i) => ({
            questionId: `${quizContentId}_${row.questionIndex}`,
            question: row.questão,
            options: items[i].optionTexts
        }));

        return res.status(200).json({
            success: true,
            attemptId,
            quizID: quizID.trim(),
            totalQuestions: questions.length,
            passingScore: notaCorte,
            questions
        });
    } catch (error) {
        console.error('Erro em /api/quiz/start:', error);
        if (error.code === 'QUIZ_NOT_FOUND') {
            return res.status(404).json({ success: false, error: error.message });
        }
        if (error.code === 'NOTA_CORTE_MISMATCH' || error.code === 'NOTA_CORTE_INVALID' || error.code === 'QUIZ_INVALID') {
            return res.status(400).json({ success: false, error: error.message });
        }
        return res.status(500).json({
            success: false,
            error: 'Erro ao iniciar quiz',
            details: error.message
        });
    }
};
