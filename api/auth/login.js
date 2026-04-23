// VERSION: v1.1.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
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

        const emailLower = email.toLowerCase();
        const debugLogin = process.env.DEBUG_LOGIN === '1';
        if (debugLogin) {
            console.log('[api/auth/login] busca', emailLower);
        }

        // Validar senha (alinhado a server-api.js /api/auth/login)
        let passwordValid = false;

        if (!funcionario.password || funcionario.password === null || funcionario.password === undefined) {
            const nomeCompleto = funcionario.colaboradorNome || '';
            const partesNome = nomeCompleto.toLowerCase().trim().split(/\s+/);
            if (partesNome.length >= 2 && funcionario.CPF) {
                const primeiroNome = partesNome[0];
                const ultimoNome = partesNome[partesNome.length - 1];
                const senhaPadrao = `${primeiroNome}.${ultimoNome}${funcionario.CPF}`;
                passwordValid = password === senhaPadrao;
                if (debugLogin) {
                    console.log('[api/auth/login] senha padrão aplicável, match:', passwordValid);
                }
            }
        } else {
            const isBcryptHash = typeof funcionario.password === 'string' &&
                (funcionario.password.startsWith('$2a$') ||
                    funcionario.password.startsWith('$2b$') ||
                    funcionario.password.startsWith('$2y$'));
            if (isBcryptHash) {
                passwordValid = await bcrypt.compare(password, funcionario.password);
            } else {
                passwordValid = password === funcionario.password;
            }
            if (!passwordValid) {
                const nomeCompleto = funcionario.colaboradorNome || '';
                const partesNome = nomeCompleto.toLowerCase().trim().split(/\s+/);
                if (partesNome.length >= 2 && funcionario.CPF) {
                    const primeiroNome = partesNome[0];
                    const ultimoNome = partesNome[partesNome.length - 1];
                    const senhaPadrao = `${primeiroNome}.${ultimoNome}${funcionario.CPF}`;
                    passwordValid = password === senhaPadrao;
                    if (debugLogin) {
                        console.log('[api/auth/login] fallback senha padrão, match:', passwordValid);
                    }
                }
            }
        }

        if (!passwordValid) {
            if (debugLogin) {
                console.log('[api/auth/login] falha de autenticação', emailLower);
            }
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        if (debugLogin) {
            console.log('[api/auth/login] sucesso', emailLower);
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
