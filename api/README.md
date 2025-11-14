# API Serverless Functions - VeloAcademy

## Estrutura de Rotas

O Vercel detecta automaticamente as rotas baseado na estrutura de pastas:

- `api/progress/save.js` → `POST /api/progress/save`
- `api/progress/unlock-quiz.js` → `POST /api/progress/unlock-quiz`
- `api/progress/[userEmail]/[subtitle].js` → `GET /api/progress/:userEmail/:subtitle`
- `api/progress/user/[userEmail].js` → `GET /api/progress/user/:userEmail`
- `api/courses/index.js` → `GET /api/courses`
- `api/courses/[cursoNome].js` → `GET /api/courses/:cursoNome`
- `api/health.js` → `GET /api/health`

## Parâmetros Dinâmicos

Para rotas dinâmicas, o Vercel passa os parâmetros via `req.query`:
- `[userEmail].js` → `req.query.userEmail`
- `[subtitle].js` → `req.query.subtitle`
- `[cursoNome].js` → `req.query.cursoNome`

## Variáveis de Ambiente

Configure no Vercel:
- `MONGODB_URI`: Connection string do MongoDB
- `DB_NAME_ACADEMY`: Nome do banco (padrão: `academy_registros`)

## Desenvolvimento Local

Para testar localmente, use o `server-api.js`:
```bash
npm run api
```

O servidor rodará em `http://localhost:3001`

