// VERSION: v1.0.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// Configuração centralizada da API base URL

/**
 * Obtém a URL base da API
 * @returns {string} URL base da API
 */
function getApiBaseUrl() {
    // Em desenvolvimento local, sempre usar servidor API local na porta 3001
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1')) {
        // Sempre usar localhost:3001 em desenvolvimento local
        return 'http://localhost:3001/api';
    }
    
    // Em produção, usar URL relativa (mesmo domínio do frontend)
    // Os endpoints de auth são serverless functions do Vercel no mesmo domínio
    return '/api';
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.getApiBaseUrl = getApiBaseUrl;
    window.API_BASE_URL = getApiBaseUrl();
}

// Exportar para módulos (se usando CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getApiBaseUrl };
}
