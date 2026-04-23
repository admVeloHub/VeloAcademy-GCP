// VERSION: v1.0.0 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// Hook preparatório para futura política de badges/conquistas (sem persistência ainda)

/**
 * @param {object} payload
 * @param {string} payload.email
 * @param {string} payload.quizID
 * @param {string} [payload.courseName]
 * @param {string} payload.certificateId
 */
function logQuizApprovedForConquistas(payload) {
    // TODO: integrar com coleção de conquistas / aba Conquistas quando implementado
    console.log('[conquistas] quiz-approved (stub):', {
        email: payload.email,
        quizID: payload.quizID,
        courseName: payload.courseName,
        certificateId: payload.certificateId
    });
}

module.exports = {
    logQuizApprovedForConquistas
};
