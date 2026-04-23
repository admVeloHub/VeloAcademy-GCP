// VERSION: v1.1.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Configuração do Google OAuth + filtro opcional de ruído [GSI_LOGGER] no console
// Em produção (container), o servidor serve /api/config/google-client.js a partir de GOOGLE_CLIENT_ID.

/**
 * Obtém o Client ID do Google OAuth
 * @returns {string} Client ID do Google
 */
function getClientId() {
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

/**
 * O SDK do Google Identity Services envia muitas mensagens [GSI_LOGGER] (ex.: origem OAuth).
 * Para ver tudo no console: sessionStorage.setItem('VELO_GSI_VERBOSE','1') e recarregar.
 */
(function suppressGoogleIdentityConsoleNoise() {
    if (typeof window === 'undefined' || window.__VELO_GSI_CONSOLE_PATCH__) return;
    window.__VELO_GSI_CONSOLE_PATCH__ = true;

    function verboseGsi() {
        try {
            return window.VELO_GSI_VERBOSE === true ||
                sessionStorage.getItem('VELO_GSI_VERBOSE') === '1';
        } catch (e) {
            return false;
        }
    }

    function isGsiNoise(args) {
        if (verboseGsi()) return false;
        const text = args.map(function (a) {
            if (typeof a === 'string') return a;
            if (a && typeof a.message === 'string') return a.message;
            return '';
        }).join(' ');
        return /\[GSI_LOGGER\]|GSI_LOGGER|The given origin is not allowed for the given client id|accounts\.google\.com\/gsi\/status/i.test(text);
    }

    ['error', 'warn'].forEach(function (level) {
        const orig = console[level];
        console[level] = function () {
            const args = Array.prototype.slice.call(arguments);
            if (isGsiNoise(args)) return;
            return orig.apply(console, args);
        };
    });
})();

// Exportar para módulos (se usando CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getClientId };
}
