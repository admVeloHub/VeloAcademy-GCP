// VERSION: v1.0.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// Serviços centralizados de autenticação

// Função auxiliar para obter URL da API (evita conflito de declaração)
function getAuthApiBaseUrl() {
    // Tentar usar função global se disponível
    if (typeof window !== 'undefined' && window.getApiBaseUrl) {
        try {
            return window.getApiBaseUrl();
        } catch (error) {
            console.warn('Erro ao obter API base URL da função global:', error);
        }
    }
    
    // Fallback: determinar URL base
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        // Sempre usar localhost:3001 em desenvolvimento local
        return 'http://localhost:3001/api';
    }
    
    // Em produção, usar URL relativa (mesmo domínio do frontend)
    // Os endpoints de auth são serverless functions do Vercel
    return '/api';
}

// Função auxiliar para obter Client ID
function getAuthClientId() {
    if (typeof window !== 'undefined' && window.getClientId) {
        try {
            return window.getClientId();
        } catch (error) {
            console.warn('Erro ao obter Client ID da função global:', error);
        }
    }
    return '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com';
}

// Obter URL base para endpoints de auth
// Endpoints de auth são serverless functions do Vercel (mesmo domínio do frontend)
const API_BASE_URL = getAuthApiBaseUrl();
// Usar chave diferente para sessionId para evitar conflito
const AUTH_SERVICE_SESSION_ID_KEY = 'academy_session_id';

/**
 * Registra login no backend para controle de sessões
 * @param {object} userData - Dados do usuário (name, email, picture)
 * @returns {Promise<string|null>} sessionId ou null se erro
 */
async function registerLoginSession(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/session/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                colaboradorNome: userData.name,
                userEmail: userData.email,
                ipAddress: null, // Pode ser obtido do backend se necessário
                userAgent: navigator.userAgent
            })
        });

        const result = await response.json();

        if (result.success && result.sessionId) {
            // Salvar sessionId no localStorage
            localStorage.setItem(AUTH_SERVICE_SESSION_ID_KEY, result.sessionId);
            console.log('Sessão registrada no backend:', result.sessionId);
            return result.sessionId;
        } else {
            console.error('Erro ao registrar sessão:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Erro ao registrar login no backend:', error);
        return null;
    }
}

/**
 * Registra logout no backend
 * @returns {Promise<boolean>} true se sucesso, false caso contrário
 */
async function registerLogoutSession() {
    try {
        const sessionId = localStorage.getItem(AUTH_SERVICE_SESSION_ID_KEY);
        if (!sessionId) {
            console.log('Nenhuma sessão ativa para fazer logout');
            return false;
        }

        const response = await fetch(`${API_BASE_URL}/auth/session/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                sessionId: sessionId
            })
        });

        const result = await response.json();

        if (result.success) {
            localStorage.removeItem(AUTH_SERVICE_SESSION_ID_KEY);
            console.log('Logout registrado no backend');
            return true;
        } else {
            console.error('Erro ao registrar logout:', result.error);
            return false;
        }
    } catch (error) {
        console.error('Erro ao registrar logout no backend:', error);
        return false;
    }
}

/**
 * Inicializa o Google Sign-In
 */
function initializeGoogleSignIn() {
    if (typeof window === 'undefined' || !window.google) {
        console.warn('Google Identity Services não está disponível');
        return;
    }

    const clientId = getClientId();
    
    if (!clientId) {
        console.error('Client ID do Google não está definido!');
        return;
    }

    try {
        window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });
        
        console.log('Google Sign-In inicializado com Client ID:', clientId);
    } catch (error) {
        console.error('Erro ao inicializar Google Sign-In:', error);
    }
}

/**
 * Handler para resposta de credenciais do Google
 * Esta função será sobrescrita pelo componente de login
 * @param {object} response - Resposta do Google OAuth
 */
function handleCredentialResponse(response) {
    console.log('handleCredentialResponse chamado - deve ser implementado pelo componente de login');
}

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.registerLoginSession = registerLoginSession;
    window.registerLogoutSession = registerLogoutSession;
    window.initializeGoogleSignIn = initializeGoogleSignIn;
    window.handleCredentialResponse = handleCredentialResponse;
}

// Exportar para módulos (se usando CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerLoginSession,
        registerLogoutSession,
        initializeGoogleSignIn,
        handleCredentialResponse
    };
}
