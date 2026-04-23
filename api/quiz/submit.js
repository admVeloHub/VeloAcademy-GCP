// VERSION: v1.0.3 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// POST /api/quiz/submit - Corrige tentativa no servidor e registra aprovação/reprovação

const { getDatabase } = require('../../lib/mongodb');
const { registerQuizResult } = require('../../lib/quiz-register-result');
const { COL_QUIZ_ATTEMPTS } = require('../../lib/quiz-content');
const { logQuizApprovedForConquistas } = require('../../lib/conquistas-quiz-approved');

function buildResultPayload(score, totalQuestions, notaCorte, approved, wrongQuestions, reg) {
    const finalGrade = totalQuestions > 0 ? (score / totalQuestions) * 10 : 0;
    return {
        score,
        totalQuestions,
        finalGrade,
        passingScore: notaCorte,
        approved,
        wrongQuestions,
        collection: reg.collection,
        certificateId: reg.certificateId || null
    };
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
        const {
            attemptId,
            answers,
            name,
            email,
            courseName
        } = req.body || {};

        if (!attemptId || typeof attemptId !== 'string') {
            return res.status(400).json({ success: false, error: 'Campo obrigatório: attemptId' });
        }
        if (!name || !email) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: name, email'
            });
        }
        if (!Array.isArray(answers)) {
            return res.status(400).json({ success: false, error: 'Campo obrigatório: answers (array)' });
        }

        const db = await getDatabase();
        if (!db) {
            return res.status(503).json({ success: false, error: 'MongoDB não disponível' });
        }

        const col = db.collection(COL_QUIZ_ATTEMPTS);
        const attempt = await col.findOne({ attemptId: attemptId.trim() });

        if (!attempt) {
            return res.status(404).json({ success: false, error: 'Tentativa não encontrada' });
        }

        if (new Date() > new Date(attempt.expiresAt)) {
            return res.status(410).json({ success: false, error: 'Tentativa expirada. Inicie o quiz novamente.' });
        }

        if (attempt.consumed && attempt.resultSummary) {
            return res.status(200).json({
                success: true,
                idempotent: true,
                ...attempt.resultSummary
            });
        }

        if (attempt.consumed) {
            return res.status(409).json({ success: false, error: 'Tentativa já utilizada' });
        }

        const items = attempt.items || [];
        if (answers.length !== items.length) {
            return res.status(400).json({
                success: false,
                error: `Número de respostas (${answers.length}) diferente do número de questões (${items.length})`
            });
        }

        let score = 0;
        const wrongQuestions = [];
        for (let i = 0; i < items.length; i++) {
            const chosen = answers[i];
            const valid = typeof chosen === 'number' && chosen >= 0 && chosen <= 3;
            const correct = valid && chosen === items[i].correctIndex;
            if (correct) {
                score++;
            } else {
                wrongQuestions.push(i + 1);
            }
        }

        const totalQuestions = items.length;
        const notaCorte = attempt.notaCorte;
        const approved = score >= notaCorte;
        const finalGrade = totalQuestions > 0 ? (score / totalQuestions) * 10 : 0;

        const reg = await registerQuizResult(db, {
            name,
            email,
            courseId: attempt.quizID,
            courseName: courseName || attempt.quizID,
            score,
            totalQuestions,
            finalGrade,
            approved,
            wrongQuestions
        });

        const resultSummary = buildResultPayload(
            score,
            totalQuestions,
            notaCorte,
            approved,
            wrongQuestions,
            reg
        );

        if (approved && reg.certificateId && reg.approvalInserted === true) {
            logQuizApprovedForConquistas({
                email: email.toLowerCase().trim(),
                quizID: attempt.quizID,
                courseName: courseName || attempt.quizID,
                certificateId: reg.certificateId
            });
        }

        await col.updateOne(
            { attemptId: attemptId.trim() },
            {
                $set: {
                    consumed: true,
                    consumedAt: new Date(),
                    resultSummary
                }
            }
        );

        return res.status(200).json({
            success: true,
            ...resultSummary
        });
    } catch (error) {
        console.error('Erro em /api/quiz/submit:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao enviar quiz',
            details: error.message
        });
    }
};
