// VERSION: v1.0.4 | DATE: 2026-03-27 | AUTHOR: VeloHub Development Team
// Serviços centralizados de autenticação

/** URL da API em tempo real (não fixar no load — host/porta mudam em LAN) */
function getAuthApiBaseUrl() {
    if (typeof window !== 'undefined' && typeof window.getApiBaseUrl === 'function') {
        try {
            return window.getApiBaseUrl();
        } catch (error) {
            console.warn('Erro ao obter API base URL:', error);
        }
    }
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

const AUTH_SERVICE_SESSION_ID_KEY = 'academy_session_id';

/**
 * Registra login no backend para controle de sessões
 * @param {object} userData - Dados do usuário (name, email, picture)
 * @returns {Promise<string|null>} sessionId ou null se erro
 */
async function registerLoginSession(userData) {
    try {
        const response = await fetch(`${getAuthApiBaseUrl()}/auth/session/login`, {
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

        const response = await fetch(`${getAuthApiBaseUrl()}/auth/session/logout`, {
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
 * Compatibilidade: o login Google na VeloAcademy é configurado em login-page.js
 * (OAuth2 initTokenClient + userinfo). Não chamar google.accounts.id.initialize aqui —
 * duplicava o cliente, reativava One Tap / gsi/status e conflitava com o botão "Continuar com Google".
 */
function initializeGoogleSignIn() {
    if (typeof window === 'undefined') return;
    console.info('[VeloAcademy auth-service] Login Google Web fica no login-page.js (OAuth2 com token). google.accounts.id.initialize não é chamado aqui.');
}

/**
 * Legado (ex.: data-callback em HTML antigo). O fluxo ativo é login-page.js.
 * @param {object} response - resposta GIS (credencial JWT, se algum fluxo antigo a chamar)
 */
function handleCredentialResponse(response) {
    if (response && response.credential) {
        console.warn('[VeloAcademy auth-service] handleCredentialResponse recebeu JWT; o fluxo ativo de login é OAuth2 no login-page.js.');
    }
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
