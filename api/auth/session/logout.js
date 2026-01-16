// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/session/logout - Registro de logout no sistema de sessões

const { connectToDatabase } = require('../../../lib/mongodb');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        const { sessionId } = req.body;

        // Validação básica
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'sessionId é obrigatório'
            });
        }

        const { client, db } = await connectToDatabase();
        
        if (!client || !db) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        // Buscar sessão ativa
        const session = await db.collection('sessions').findOne({
            sessionId: sessionId,
            isActive: true
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Sessão não encontrada ou já encerrada'
            });
        }

        // Calcular duração da sessão
        const now = new Date();
        const sessionDuration = now.getTime() - session.loginTimestamp.getTime();

        // Atualizar sessão com logout
        await db.collection('sessions').updateOne(
            { sessionId: sessionId },
            {
                $set: {
                    isActive: false,
                    logoutTimestamp: now,
                    sessionDuration: sessionDuration,
                    updatedAt: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            sessionDuration: sessionDuration,
            message: 'Logout registrado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao registrar logout:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
