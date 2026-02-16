// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// GET /api/auth/profile - Buscar dados do perfil do usuário
// PUT /api/auth/profile - Atualizar dados do perfil

const { connectToDatabase } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { client, db } = await connectToDatabase();
        
        if (!client || !db) {
            return res.status(503).json({
                success: false,
                error: 'Serviço temporariamente indisponível'
            });
        }

        // GET - Buscar dados do perfil
        if (req.method === 'GET') {
            const { email } = req.query;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
                });
            }

            // Buscar usuário em console_analises.qualidade_funcionarios
            const qualidadeDb = client.db('console_analises');
            const funcionario = await qualidadeDb.collection('qualidade_funcionarios')
                .findOne({ userMail: email.toLowerCase() });

            if (!funcionario) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuário não encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                profile: {
                    colaboradorNome: funcionario.colaboradorNome || '',
                    telefone: funcionario.telefone || '',
                    userMail: funcionario.userMail || email,
                    profile_pic: funcionario.profile_pic || ''
                }
            });
        }

        // PUT - Atualizar dados do perfil
        if (req.method === 'PUT') {
            const { email, colaboradorNome, telefone } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    error: 'Email é obrigatório'
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

            // Preparar dados para atualização
            const updateData = {
                updatedAt: new Date()
            };

            if (colaboradorNome !== undefined) {
                updateData.colaboradorNome = colaboradorNome;
            }

            if (telefone !== undefined) {
                updateData.telefone = telefone;
            }

            // Atualizar no MongoDB
            await qualidadeDb.collection('qualidade_funcionarios').updateOne(
                { userMail: email.toLowerCase() },
                { $set: updateData }
            );

            return res.status(200).json({
                success: true,
                message: 'Perfil atualizado com sucesso'
            });
        }

        // Método não permitido
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });

    } catch (error) {
        console.error('Erro no endpoint de perfil:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
