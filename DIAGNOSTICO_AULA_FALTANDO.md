# 🔍 Diagnóstico - Aula Aparece em Produção mas Não em Desenvolvimento

## 📋 Checklist de Verificação

### ✅ 1. Verificar se o Servidor API está Rodando

**No terminal, execute:**
```bash
npm run api
```

**Resultado esperado:**
```
🚀 API Server rodando em http://localhost:3001
📊 Endpoints disponíveis:
   GET  /api/courses
```

**Se não estiver rodando:**
- O frontend não conseguirá carregar os cursos do MongoDB
- Você verá uma mensagem de erro na tela

### ✅ 2. Verificar Conexão MongoDB no Servidor API

**Verifique se o servidor API mostra:**
```
✅ Conectado ao MongoDB: academy_registros
```

**Se mostrar:**
```
⚠️ MONGODB_URI não configurada
```

**Solução:** Configure a variável de ambiente `MONGODB_URI` no arquivo `.env`:
```env
MONGODB_URI=sua_connection_string_aqui
DB_NAME_ACADEMY=academy_registros
```

### ✅ 3. Limpar Cache e Forçar Recarregamento

**No console do navegador (F12), execute:**
```javascript
veloAcademyApp.forceReloadCourses();
```

Isso irá:
- Limpar o cache completamente
- Forçar recarregamento do MongoDB
- Mostrar logs detalhados no console

### ✅ 4. Verificar Logs no Console

**Após executar `forceReloadCourses()`, verifique os logs:**

**Logs esperados:**
```
🔄 Forçando recarregamento de cursos...
🔗 Carregando cursos de: http://localhost:3001/api/courses
📚 Cursos recebidos do MongoDB: X
   - cursoNome1: Y módulos, Z aulas
   - cursoNome2: Y módulos, Z aulas
✅ Cursos carregados do MongoDB
✅ Cursos transformados: [lista de IDs]
```

**Se aparecer:**
```
⚠️ Aula filtrada (isActive=false): Nome da Aula (ID: xxx)
```

**Significa:** A aula existe no banco mas está com `isActive: false`

### ✅ 5. Verificar Status da Aula no MongoDB

**Opções para verificar:**

**A) Via MongoDB Compass ou Studio 3T:**
1. Conecte ao banco `academy_registros`
2. Abra a collection `cursos_conteudo`
3. Procure pelo curso que contém a aula
4. Verifique se a aula tem `isActive: true`

**B) Via API diretamente:**
```bash
curl http://localhost:3001/api/courses
```

**C) Via console do navegador:**
```javascript
// Ver todos os cursos carregados
console.log(veloAcademyApp.courseDatabase);

// Ver detalhes de um curso específico
console.log(veloAcademyApp.courseDatabase['cursoNome']);
```

### ✅ 6. Comparar Dados entre Dev e Prod

**Possíveis diferenças:**

1. **isActive diferente:**
   - Dev: `isActive: false`
   - Prod: `isActive: true`

2. **Cache antigo:**
   - Dev pode estar usando cache de dados antigos
   - Solução: `veloAcademyApp.forceReloadCourses()`

3. **Banco de dados diferente:**
   - Dev pode estar conectado a um banco diferente
   - Verificar `MONGODB_URI` no `.env`

4. **Servidor API não atualizado:**
   - O servidor pode estar rodando código antigo
   - Solução: Reiniciar o servidor (`npm run api`)

## 🔧 Soluções Comuns

### Problema: Servidor API não está rodando
**Solução:**
```bash
npm run api
```

### Problema: Cache antigo
**Solução:**
```javascript
veloAcademyApp.forceReloadCourses();
```

### Problema: Aula com isActive=false
**Solução:** Atualizar no MongoDB:
```javascript
// Via MongoDB shell ou Compass
db.cursos_conteudo.updateOne(
  { "cursoNome": "nomeDoCurso", "modules.sections.lessons.lessonId": "ID_DA_AULA" },
  { $set: { "modules.$[].sections.$[].lessons.$[lesson].isActive": true } }
)
```

### Problema: MongoDB não conectado
**Solução:**
1. Criar arquivo `.env` na raiz do projeto
2. Adicionar:
   ```env
   MONGODB_URI=sua_connection_string
   DB_NAME_ACADEMY=academy_registros
   ```
3. Reiniciar servidor API

## 📊 Funções de Debug Disponíveis

### `forceReloadCourses()`
Limpa cache e força recarregamento completo:
```javascript
veloAcademyApp.forceReloadCourses();
```

### `retryLoadCourses()`
Tenta recarregar cursos (mantém cache):
```javascript
veloAcademyApp.retryLoadCourses();
```

### Ver dados carregados
```javascript
// Ver todos os cursos
console.log(veloAcademyApp.courseDatabase);

// Ver cache
console.log(veloAcademyApp.courseDatabaseCache);

// Ver URL da API
console.log(veloAcademyApp.getApiBaseUrl());
```

## 🎯 Próximos Passos

1. ✅ Execute `npm run api` para iniciar servidor
2. ✅ Execute `veloAcademyApp.forceReloadCourses()` no console
3. ✅ Verifique os logs no console
4. ✅ Compare os dados entre dev e prod
5. ✅ Verifique se a aula tem `isActive: true` no MongoDB

