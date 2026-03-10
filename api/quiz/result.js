// VERSION: v1.0.0 | DATE: 2026-03-10 | AUTHOR: VeloHub Development Team
// POST /api/quiz/result - Registrar resultado do quiz (aprovado -> curso_certificados, reprovado -> quiz_reprovas)

const { getDatabase } = require('../../lib/mongodb');
const { v4: uuidv4 } = require('uuid');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        const { name, email, courseId, courseName, score, totalQuestions, finalGrade, approved, wrongQuestions } = req.body;

        if (!name || !email || !courseId) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: name, email, courseId'
            });
        }

        const db = await getDatabase();

        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível'
            });
        }

        const now = new Date();
        const wrongQuestionsStr = wrongQuestions && Array.isArray(wrongQuestions)
            ? JSON.stringify(wrongQuestions)
            : (wrongQuestions || '[]');
        const wrongQuestionsDisplay = wrongQuestionsStr !== '[]' ? wrongQuestionsStr : 'Sem Erros';

        if (approved) {
            const certificadosCollection = db.collection('curso_certificados');
            const certificateId = uuidv4();
            const doc = {
                date: now,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                courseId: courseId,
                courseName: courseName || courseId,
                score: score != null ? parseInt(score) : null,
                totalQuestions: totalQuestions != null ? parseInt(totalQuestions) : null,
                finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
                wrongQuestions: wrongQuestionsDisplay,
                status: 'Aprovado',
                certificateUrl: '',
                certificateId: certificateId
            };
            await certificadosCollection.insertOne(doc);
            console.log('Certificado registrado:', { email: doc.email, courseId: doc.courseId });
            return res.status(200).json({ success: true, collection: 'curso_certificados', certificateId });
        } else {
            const reprovasCollection = db.collection('quiz_reprovas');
            const doc = {
                date: now,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                courseId: courseId,
                courseName: courseName || courseId,
                finalGrade: finalGrade != null ? parseFloat(finalGrade) : null,
                wrongQuestions: wrongQuestionsDisplay
            };
            await reprovasCollection.insertOne(doc);
            console.log('Reprovação registrada:', { email: doc.email, courseId: doc.courseId });
            return res.status(200).json({ success: true, collection: 'quiz_reprovas' });
        }
    } catch (error) {
        console.error('Erro ao registrar resultado do quiz:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao registrar resultado',
            details: error.message
        });
    }
};
