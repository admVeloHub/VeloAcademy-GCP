# API — módulos VeloAcademy

## Execução local e GCP

A API em produção e em desenvolvimento alvo é o **`server-api.js`** (Express), iniciado com:

```bash
npm run api
```

Servidor em `http://localhost:3001`. O Cloud Run usa o mesmo processo (`npm run start:gcp`).

## Pasta `api/`

Os ficheiros em `api/**/*.js` são **handlers** reutilizáveis: parte das rotas é registada no `server-api.js` com `app.get` / `app.post` e `require('./api/...')`; outros módulos mantêm a mesma assinatura `(req, res)` para consistência e para `node -c` na pipeline de sintaxe.

Rotas dinâmicas nestes handlers expõem parâmetros em **`req.query`** (ex.: `[userEmail].js` → `req.query.userEmail`), conforme o contrato esperado pelo Express ao montar a rota.

## Variáveis de ambiente

- `MONGODB_URI`
- `DB_NAME_ACADEMY` (padrão: `academy_registros`)

Configurar no `.env` local e nos secrets do Cloud Run.
