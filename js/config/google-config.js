// VERSION: v1.0.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// Configuração do Google OAuth

/**
 * Obtém o Client ID do Google OAuth
 * @returns {string} Client ID do Google
 */
function getClientId() {
    // Client ID do Google OAuth para VeloAcademy
    // No navegador, não temos acesso a process.env, então usamos o valor direto
    // Se necessário, pode ser configurado via variável global ou meta tag
    if (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID) {
        return window.GOOGLE_CLIENT_ID;
    }
    
    return '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com';
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.getClientId = getClientId;
    window.GOOGLE_CLIENT_ID = getClientId();
}

// Exportar para módulos (se usando CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getClientId };
}
