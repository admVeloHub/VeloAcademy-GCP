# 🧪 Guia de Testes - API Serverless Functions

## 📋 Checklist de Testes Antes do Deploy

### ✅ 1. Verificação de Estrutura de Arquivos

```bash
# Verificar se todas as pastas e arquivos foram criados
ls -R api/
ls lib/
```

**Estrutura esperada:**
```
api/
├── courses/
│   ├── [cursoNome].js
│   └── index.js
├── progress/
│   ├── [userEmail]/
│   │   └── [subtitle].js
│   ├── save.js
│   ├── unlock-quiz.js
│   └── user/
│       └── [userEmail].js
├── health.js
└── README.md

lib/
└── mongodb.js
```

### ✅ 2. Verificação de Sintaxe JavaScript

```bash
# Verificar sintaxe de todos os arquivos
node -c lib/mongodb.js
node -c api/progress/save.js
node -c api/progress/unlock-quiz.js
node -c api/progress/user/[userEmail].js
node -c api/progress/[userEmail]/[subtitle].js
node -c api/courses/index.js
node -c api/courses/[cursoNome].js
node -c api/health.js
```

**Resultado esperado:** Nenhum erro de sintaxe

### ✅ 3. Teste Local com Vercel CLI (Recomendado)

#### Instalar Vercel CLI (se não tiver)
```bash
npm install -g vercel
```

#### Executar servidor local
```bash
vercel dev
```

Isso iniciará um servidor local que simula o ambiente do Vercel.

#### Testar rotas manualmente:

**3.1. Health Check**
```bash
curl http://localhost:3000/api/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "mongodb": "connected" ou "disconnected",
  "mongodb_uri_configured": true/false,
  "timestamp": "2025-01-30T..."
}
```

**3.2. Salvar Progresso (POST)**
```bash
curl -X POST http://localhost:3000/api/progress/save \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "teste@example.com",
    "subtitle": "Chaves PIX",
    "lessonTitle": "Aula em vídeo",
    "allLessonTitles": ["Aula em vídeo"]
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Progresso salvo com sucesso",
  "progress": {
    "userEmail": "teste@example.com",
    "subtitle": "Chaves PIX",
    "completedVideos": {"Aula em vídeo": true},
    "quizUnlocked": true,
    "updatedAt": "..."
  }
}
```

**3.3. Obter Progresso (GET)**
```bash
curl "http://localhost:3000/api/progress/teste@example.com/Chaves%20PIX"
```

**Resposta esperada:**
```json
{
  "success": true,
  "progress": {
    "completedVideos": {"Aula em vídeo": true},
    "quizUnlocked": true,
    "completedAt": "..."
  }
}
```

**3.4. Listar Cursos (GET)**
```bash
curl http://localhost:3000/api/courses
```

**Resposta esperada:**
```json
{
  "success": true,
  "courses": [...]
}
```

**3.5. Obter Curso Específico (GET)**
```bash
curl "http://localhost:3000/api/courses/produtos"
```

**Resposta esperada:**
```json
{
  "success": true,
  "course": {...}
}
```

### ✅ 4. Teste de CORS

Verificar se as rotas respondem corretamente a requisições CORS:

```bash
curl -X OPTIONS http://localhost:3000/api/progress/save \
  -H "Origin: http://localhost:8080" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Verificar headers na resposta:**
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### ✅ 5. Teste de Validação de Parâmetros

**5.1. Teste sem parâmetros obrigatórios:**
```bash
curl -X POST http://localhost:3000/api/progress/save \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta esperada:** Status 400 com erro de validação

**5.2. Teste com método incorreto:**
```bash
curl -X GET http://localhost:3000/api/progress/save
```

**Resposta esperada:** Status 405 (Method Not Allowed)

### ✅ 6. Teste de Encoding de Parâmetros

Testar se caracteres especiais são tratados corretamente:

```bash
# Email com @
curl "http://localhost:3000/api/progress/lucas.gravina%40velotax.com.br/Chaves%20PIX"

# Subtítulo com espaços e caracteres especiais
curl "http://localhost:3000/api/progress/teste@example.com/Cr%C3%A9dito%20do%20Trabalhador"
```

### ✅ 7. Verificação de Variáveis de Ambiente

Verificar se as variáveis estão configuradas:

```bash
# No terminal, verificar se as variáveis estão definidas
echo $MONGODB_URI
echo $DB_NAME_ACADEMY
```

**Para teste local, criar arquivo `.env`:**
```env
MONGODB_URI=sua_connection_string_aqui
DB_NAME_ACADEMY=academy_registros
```

### ✅ 8. Teste de Conexão MongoDB

Verificar se a conexão MongoDB funciona:

```bash
curl http://localhost:3000/api/health
```

**Se MongoDB não estiver configurado:**
- `mongodb`: "disconnected"
- `mongodb_uri_configured`: false

**Se MongoDB estiver configurado:**
- `mongodb`: "connected"
- `mongodb_uri_configured`: true

### ✅ 9. Teste de Performance

Verificar tempo de resposta das rotas:

```bash
# Health check deve ser rápido (< 100ms)
time curl http://localhost:3000/api/health

# Rotas com MongoDB podem ser mais lentas (< 500ms)
time curl http://localhost:3000/api/courses
```

### ✅ 10. Teste no Frontend

Após deploy, testar no navegador:

1. Abrir console do navegador (F12)
2. Verificar se não há erros 404 nas chamadas `/api/*`
3. Verificar se as respostas são JSON válido
4. Testar funcionalidade de salvar progresso
5. Testar funcionalidade de obter progresso

## 🚨 Problemas Comuns e Soluções

### Problema: "Cannot find module '../../lib/mongodb'"
**Solução:** Verificar se o caminho relativo está correto na estrutura de pastas

### Problema: "MongoDB não disponível"
**Solução:** Verificar variáveis de ambiente no Vercel

### Problema: "404 Not Found" nas rotas
**Solução:** Verificar se `vercel.json` está configurado corretamente

### Problema: "CORS error"
**Solução:** Verificar se headers CORS estão sendo enviados corretamente

## 📝 Checklist Final Antes do Commit

- [ ] Todos os arquivos foram criados na estrutura correta
- [ ] Sintaxe JavaScript validada (sem erros)
- [ ] Testes locais executados com sucesso
- [ ] CORS funcionando corretamente
- [ ] Validação de parâmetros funcionando
- [ ] Encoding de caracteres especiais funcionando
- [ ] Variáveis de ambiente documentadas
- [ ] README.md atualizado (se necessário)
- [ ] Versões dos arquivos atualizadas

## 🚀 Próximos Passos Após Testes

1. ✅ Fazer commit das alterações
2. ✅ Push para GitHub
3. ✅ Deploy automático no Vercel
4. ✅ Verificar logs do Vercel após deploy
5. ✅ Testar rotas em produção
6. ✅ Monitorar erros no console do navegador

