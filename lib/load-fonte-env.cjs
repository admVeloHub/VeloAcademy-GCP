// VERSION: v1.0.0 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Carrega MONGO_ENV e outras chaves a partir de FONTE DA VERDADE (ecossistema VeloHub) ou .env local.
// Deve chamar-se com a raiz do repositório VeloAcademy: loadFrom(__dirname) em server-api.js,
// loadFrom(path.join(__dirname, '..')) a partir de lib/*.

const path = require('path');
const fs = require('fs');

/**
 * Sobe bootstrapFonteEnv / dotenv na mesma ordem que o servidor unificado.
 * @param {string} projectRoot - Diretório raiz do projeto (pasta com package.json e server-api.js)
 */
function loadFrom(projectRoot) {
    (function loadVelohubFonteEnv(here) {
        let d = here;
        for (let i = 0; i < 24; i++) {
            const loader = path.join(d, 'FONTE DA VERDADE', 'bootstrapFonteEnv.cjs');
            if (fs.existsSync(loader)) {
                require(loader).loadFrom(here);
                return;
            }
            const parent = path.dirname(d);
            if (parent === d) break;
            d = parent;
        }
    })(projectRoot);

    (function loadFonteVerdadeDotenv() {
        if ((process.env.MONGO_ENV || '').trim()) return;
        let d = projectRoot;
        for (let i = 0; i < 24; i++) {
            const envFile = path.join(d, 'FONTE DA VERDADE', '.env');
            if (fs.existsSync(envFile)) {
                try {
                    require('dotenv').config({ path: envFile, override: true });
                    if ((process.env.MONGO_ENV || '').trim()) {
                        console.log('MONGO_ENV carregada de:', envFile);
                    } else {
                        console.warn('Arquivo .env encontrado, mas MONGO_ENV está vazia ou ausente:', envFile);
                    }
                } catch (e) {
                    console.warn('Falha ao ler FONTE DA VERDADE/.env:', e && e.message);
                }
                return;
            }
            const parent = path.dirname(d);
            if (parent === d) break;
            d = parent;
        }
    })();

    (function loadLocalMongoEnvFallback() {
        if ((process.env.MONGO_ENV || '').trim()) return;
        const envPath = path.join(projectRoot, '.env');
        if (!fs.existsSync(envPath)) return;
        try {
            require('dotenv').config({ path: envPath });
            if ((process.env.MONGO_ENV || '').trim()) {
                console.log('MONGO_ENV carregada do arquivo .env na raiz do VeloAcademy (fallback depois da FONTE DA VERDADE).');
            }
        } catch (e) {
            console.warn('Não foi possível carregar o arquivo .env local:', e && e.message);
        }
    })();
}

module.exports = { loadFrom };
