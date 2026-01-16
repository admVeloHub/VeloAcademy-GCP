// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/profile/change-password - Alterar senha do usuário

const bcrypt = require('bcrypt');
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
        const { email, novaSenha } = req.body;

        if (!email || !novaSenha) {
            return res.status(400).json({
                success: false,
                error: 'Email e nova senha são obrigatórios'
            });
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                success: false,
                error: 'A senha deve ter no mínimo 6 caracteres'
            });
        }

        const { client, db } = await connectToDatabase();
        
        if (!client || !db) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        // Buscar usuário
        const qualidadeDb = client.db('console_analises');
        const funcionario = await qualidadeDb.collection('qualidade_funcionarios')
            .findOne({ userMail: email.toLowerCase() });

        if (!funcionario) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Gerar hash da nova senha
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(novaSenha, saltRounds);

        // Atualizar senha no MongoDB
        await qualidadeDb.collection('qualidade_funcionarios').updateOne(
            { userMail: email.toLowerCase() },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: new Date()
                } 
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Senha alterada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
