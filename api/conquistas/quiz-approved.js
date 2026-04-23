// VERSION: v1.0.0 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// POST /api/conquistas/quiz-approved - Stub para integração futura (badges / aba Conquistas)

const { logQuizApprovedForConquistas } = require('../../lib/conquistas-quiz-approved');

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
        const { email, quizID, courseName, certificateId } = req.body || {};
        if (!email || !quizID || !certificateId) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: email, quizID, certificateId'
            });
        }

        logQuizApprovedForConquistas({
            email: String(email).toLowerCase().trim(),
            quizID: String(quizID).trim(),
            courseName: courseName || quizID,
            certificateId: String(certificateId)
        });

        return res.status(200).json({
            success: true,
            message: 'Recebido (stub — política de conquistas em desenvolvimento)'
        });
    } catch (error) {
        console.error('Erro em /api/conquistas/quiz-approved:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno',
            details: error.message
        });
    }
};
