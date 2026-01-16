// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/validate-access - Validação de acesso para Google SSO

const { connectToDatabase } = require('../../lib/mongodb');

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
        const { email, picture } = req.body;

        // Validação básica
        if (!email) {
            return res.status(400).json({
                success: false,
                error: 'Email é obrigatório'
            });
        }

        const { client, db } = await connectToDatabase();
        
        if (!client || !db) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        // Buscar usuário em console_analises.qualidade_funcionarios
        const qualidadeDb = client.db('console_analises');
        const funcionario = await qualidadeDb.collection('qualidade_funcionarios')
            .findOne({ userMail: email.toLowerCase() });

        if (!funcionario) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Verificar se está desligado
        if (funcionario.desligado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário desligado'
            });
        }

        // Verificar se está afastado
        if (funcionario.afastado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário afastado'
            });
        }

        // Verificar acesso ao VeloHub (conforme especificação)
        if (!funcionario.acessos || funcionario.acessos.Velohub !== true) {
            return res.status(403).json({
                success: false,
                error: 'Acesso ao VeloHub não autorizado'
            });
        }

        // Sincronizar avatar do Google se necessário
        let profilePicUpdated = false;
        if (picture && (!funcionario.profile_pic || funcionario.profile_pic !== picture)) {
            // Atualizar profile_pic no MongoDB
            await qualidadeDb.collection('qualidade_funcionarios').updateOne(
                { _id: funcionario._id },
                { 
                    $set: { 
                        profile_pic: picture,
                        updatedAt: new Date()
                    } 
                }
            );
            profilePicUpdated = true;
        }

        // Preparar dados do usuário para retorno (priorizar nome do MongoDB)
        const userData = {
            name: funcionario.colaboradorNome,
            email: funcionario.userMail,
            picture: funcionario.profile_pic || picture || null
        };

        return res.status(200).json({
            success: true,
            user: userData,
            pictureUpdated: profilePicUpdated
        });

    } catch (error) {
        console.error('Erro na validação de acesso:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
