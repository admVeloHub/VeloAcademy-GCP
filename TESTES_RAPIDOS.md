# ⚡ Testes Rápidos - Checklist Antes do Commit

## 🎯 Testes Essenciais (5 minutos)

### 1. Verificar Sintaxe (30 segundos)
```bash
npm run test:syntax
```
**✅ Esperado:** "Sintaxe válida!" sem erros

### 2. Verificar Estrutura de Arquivos (30 segundos)
```bash
# Verificar se todos os arquivos existem
ls -la api/progress/save.js
ls -la api/progress/unlock-quiz.js
ls -la api/progress/[userEmail]/[subtitle].js
ls -la api/progress/user/[userEmail].js
ls -la api/courses/index.js
ls -la api/courses/[cursoNome].js
ls -la api/health.js
ls -la lib/mongodb.js
ls -la vercel.json
```
**✅ Esperado:** Todos os arquivos listados

### 3. Teste Manual Rápido com Server API Local (2 minutos)

**Terminal 1:** Iniciar servidor API local
```bash
npm run api
```

**Terminal 2:** Testar health check
```bash
curl http://localhost:3001/api/health
```
**✅ Esperado:** JSON com status "ok"

**Testar salvar progresso:**
```bash
curl -X POST http://localhost:3001/api/progress/save \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"teste@test.com","subtitle":"Teste","lessonTitle":"Aula 1"}'
```
**✅ Esperado:** JSON com `"success": true`

### 4. Verificar Imports e Require (1 minuto)
```bash
# Verificar se os requires estão corretos
grep -r "require.*mongodb" api/
grep -r "require.*lib" api/
```
**✅ Esperado:** Todos os requires apontam para caminhos corretos

### 5. Verificar CORS Headers (30 segundos)
```bash
grep -r "Access-Control-Allow-Origin" api/
```
**✅ Esperado:** Todas as rotas têm headers CORS

## ✅ Checklist Final (1 minuto)

- [ ] ✅ Sintaxe válida (`npm run test:syntax`)
- [ ] ✅ Todos os arquivos criados
- [ ] ✅ Health check funciona localmente
- [ ] ✅ POST /api/progress/save funciona localmente
- [ ] ✅ Imports corretos
- [ ] ✅ CORS configurado
- [ ] ✅ `vercel.json` existe e está correto

## 🚀 Pronto para Commit!

Se todos os testes acima passaram, você pode fazer commit:

```bash
git add .
git commit -m "feat: implementar serverless functions para API no Vercel"
git push
```

## 📋 Testes Completos (Opcional)

Para testes mais completos, veja `TESTES_API.md` que inclui:
- Testes com Vercel CLI (`vercel dev`)
- Testes de todas as rotas
- Testes de validação
- Testes de encoding
- Testes de performance

