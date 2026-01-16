// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/session/login - Registro de login no sistema de sessões

const { v4: uuidv4 } = require('uuid');
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
        const { colaboradorNome, userEmail, ipAddress, userAgent } = req.body;

        // Validação básica
        if (!colaboradorNome || !userEmail) {
            return res.status(400).json({
                success: false,
                error: 'colaboradorNome e userEmail são obrigatórios'
            });
        }

        const { client, db } = await connectToDatabase();
        
        if (!client || !db) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        // Gerar sessionId único
        const sessionId = uuidv4();
        const now = new Date();

        // Criar sessão em academy_registros.sessions
        const sessionData = {
            colaboradorNome: colaboradorNome,
            userEmail: userEmail.toLowerCase(),
            sessionId: sessionId,
            ipAddress: ipAddress || req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
            userAgent: userAgent || req.headers['user-agent'] || null,
            isActive: true,
            loginTimestamp: now,
            logoutTimestamp: null,
            sessionDuration: null,
            createdAt: now,
            updatedAt: now
        };

        await db.collection('sessions').insertOne(sessionData);

        return res.status(200).json({
            success: true,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Erro ao registrar login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
