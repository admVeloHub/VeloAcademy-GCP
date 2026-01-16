// VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/profile/confirm-upload - Confirmar upload e atualizar MongoDB

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
        const { email, filePath } = req.body;

        if (!email || !filePath) {
            return res.status(400).json({
                success: false,
                error: 'Email e filePath são obrigatórios'
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

        // Construir URL do arquivo no GCS
        // TODO: Ajustar conforme configuração do seu bucket
        const bucketName = 'mediabank_velohub'; // Ajustar conforme necessário
        const fileUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

        // Atualizar profile_pic no MongoDB
        await qualidadeDb.collection('qualidade_funcionarios').updateOne(
            { userMail: email.toLowerCase() },
            { 
                $set: { 
                    profile_pic: fileUrl,
                    updatedAt: new Date()
                } 
            }
        );

        return res.status(200).json({
            success: true,
            url: fileUrl,
            message: 'Foto de perfil atualizada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao confirmar upload:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
