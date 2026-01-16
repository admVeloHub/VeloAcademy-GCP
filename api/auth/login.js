// VERSION: v1.0.2 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// POST /api/auth/login - Login por email/senha

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
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
        const { email, password } = req.body;

        // Validação básica
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email e senha são obrigatórios'
            });
        }

        const { connectToDatabase } = require('../../lib/mongodb');
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
                error: 'Email ou senha incorretos'
            });
        }

        // Verificar se está desligado ou afastado
        if (funcionario.desligado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário desligado'
            });
        }

        if (funcionario.afastado === true) {
            return res.status(403).json({
                success: false,
                error: 'Usuário afastado'
            });
        }

        // Verificar acesso ao Academy
        if (!funcionario.acessos || funcionario.acessos.Academy !== true) {
            return res.status(403).json({
                success: false,
                error: 'Acesso ao Academy não autorizado'
            });
        }

        // Validar senha
        let passwordValid = false;
        
        console.log('=== DEBUG LOGIN ===');
        console.log('Email recebido:', email);
        console.log('Senha recebida (primeiros 3 chars):', password ? password.substring(0, 3) + '...' : 'null');
        console.log('Senha armazenada (primeiros 3 chars):', funcionario.password ? funcionario.password.substring(0, 3) + '...' : 'null');
        console.log('Tipo da senha armazenada:', typeof funcionario.password);
        
        if (funcionario.password) {
            // Verificar se a senha armazenada é um hash bcrypt (começa com $2a$, $2b$ ou $2y$)
            const isBcryptHash = typeof funcionario.password === 'string' && 
                                 (funcionario.password.startsWith('$2a$') || 
                                  funcionario.password.startsWith('$2b$') || 
                                  funcionario.password.startsWith('$2y$'));
            
            console.log('É hash bcrypt?', isBcryptHash);
            
            if (isBcryptHash) {
                // Senha está em hash bcrypt - comparar hash
                passwordValid = await bcrypt.compare(password, funcionario.password);
                console.log('Comparação bcrypt:', passwordValid);
            } else {
                // Senha está em texto plano - comparar diretamente
                passwordValid = password === funcionario.password;
                console.log('Comparação texto plano:', passwordValid);
                console.log('Senha recebida:', password);
                console.log('Senha armazenada:', funcionario.password);
                console.log('São iguais?', password === funcionario.password);
            }
        }
        
        // Se ainda não validou, tentar senha padrão: nome.sobrenomeCPF
        if (!passwordValid) {
            const nomeCompleto = funcionario.colaboradorNome || '';
            const partesNome = nomeCompleto.toLowerCase().trim().split(/\s+/);
            
            console.log('Tentando senha padrão...');
            console.log('Nome completo:', nomeCompleto);
            console.log('Partes do nome:', partesNome);
            console.log('CPF:', funcionario.CPF);
            
            if (partesNome.length >= 2 && funcionario.CPF) {
                const primeiroNome = partesNome[0];
                const ultimoNome = partesNome[partesNome.length - 1];
                const senhaPadrao = `${primeiroNome}.${ultimoNome}${funcionario.CPF}`;
                
                console.log('Senha padrão calculada:', senhaPadrao);
                console.log('Senha recebida:', password);
                
                // Comparar senha fornecida com senha padrão
                passwordValid = password === senhaPadrao;
                console.log('Comparação senha padrão:', passwordValid);
            }
        }
        
        console.log('Resultado final da validação:', passwordValid);
        console.log('=== FIM DEBUG ===');

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        // Criar sessão em academy_registros.sessions
        const sessionId = uuidv4();
        const now = new Date();
        
        const sessionData = {
            colaboradorNome: funcionario.colaboradorNome,
            userEmail: funcionario.userMail,
            sessionId: sessionId,
            ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress || null,
            userAgent: req.headers['user-agent'] || null,
            isActive: true,
            loginTimestamp: now,
            logoutTimestamp: null,
            sessionDuration: null,
            createdAt: now,
            updatedAt: now
        };

        await db.collection('sessions').insertOne(sessionData);

        // Preparar dados do usuário para retorno
        const userData = {
            name: funcionario.colaboradorNome,
            email: funcionario.userMail,
            picture: funcionario.profile_pic || null
        };

        return res.status(200).json({
            success: true,
            user: userData,
            sessionId: sessionId
        });

    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
};
