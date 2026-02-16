# Deploy Log - VeloAcademy

## Template para GitHub Push

### Data/Hora: [YYYY-MM-DD HH:MM:SS]
### Tipo: GitHub Push
### Versão: [vX.Y.Z]
### Arquivos Modificados:
- [lista de arquivos]
### Descrição: [descrição das alterações]
### Commit Hash: [hash do commit]

---

## Deploys Realizados

### Data/Hora: 2026-02-16 18:05:00
### Tipo: GitHub Push
### Versão: Correção de deploy Vercel
### Arquivos Modificados:
- api/auth/profile.js (movido para api-disabled/)
- api/auth/profile/change-password.js (movido para api-disabled/)
- api/auth/profile/confirm-upload.js (movido para api-disabled/)
- api/auth/profile/get-upload-url.js (movido para api-disabled/)
- vercel.json (mantido)
### Descrição: Redução do número de Serverless Functions para resolver limite do plano Hobby
- FIX: Movidas 4 funções de perfil não utilizadas para api-disabled/ para reduzir de 15 para 11 Serverless Functions
- FIX: Resolvido erro "No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan"
- FUNCTIONS: Mantidas apenas funções essenciais: auth (login, validate-access, session), courses, progress e health
- DEPLOY: Projeto agora está dentro do limite de 12 funções do plano Hobby do Vercel
### Commit Hash: 0ebbc4d

---

### Data/Hora: 2026-02-16 18:00:00
### Tipo: GitHub Push
### Versão: v1.2.0 (server-api.js)
### Arquivos Modificados:
- server-api.js (v1.2.0)
### Descrição: Melhorias no sistema de autenticação e logging
- FEATURE: Tratamento explícito quando password é null - usa senha padrão diretamente
- FEATURE: Middleware de logging para todas as requisições HTTP (método, URL, body)
- FEATURE: Logs detalhados de debug no processo de autenticação
- FEATURE: Busca de usuário com logs detalhados incluindo listagem de usuários para debug
- IMPROVEMENT: Validação melhorada da senha padrão com comparação de tamanhos e valores
- IMPROVEMENT: Logs mais informativos para facilitar diagnóstico de problemas de login
- FIX: Correção na lógica de validação quando password é null ou undefined
### Commit Hash: bed9dd9

---

### Data/Hora: 2026-02-16 17:45:00
### Tipo: GitHub Push
### Versão: v2.1.2 (LISTA_SCHEMAS.rb) + v1.0.1 (server.js)
### Arquivos Modificados:
- LISTA_SCHEMAS.rb (v2.1.2)
- server.js (v1.0.1)
### Descrição: Atualização de schemas MongoDB e correção de encoding no servidor
- SCHEMA: Adicionados campos Academy e Desk no schema qualidade_funcionarios.acessos
- FIX: Removido caractere BOM (Byte Order Mark) do início do server.js para compatibilidade
- VERSION: Incrementadas versões dos arquivos conforme padrão vX.Y.Z
### Commit Hash: ebedb87

---

### Data/Hora: 2025-01-31 [HH:MM:SS]
### Tipo: GitHub Push
### Versão: v2.4.0 (auth.js) + ajustes em home.js e styles.css
### Arquivos Modificados:
- js/auth.js (v2.4.0)
- js/home.js
- css/styles.css
- conquistas.html
- cursos.html
- index.html
- js/veloacademy.js
- package.json
- package-lock.json
- server-api.js
### Descrição: Botões Conquistas e Feedback agora ficam visíveis mas inacessíveis para usuários não autorizados
- FEATURE: Botões Conquistas e Feedback permanecem visíveis para todos os usuários
- FEATURE: Usuários não autorizados veem os botões com opacidade reduzida (0.5) e cursor not-allowed
- FEATURE: Clique bloqueado para usuários não autorizados através de pointer-events: none e preventDefault
- FEATURE: Acesso direto à página conquistas.html continua bloqueado (redirecionamento automático)
- STYLE: Adicionados estilos CSS para .nav-link[disabled] e .nav-link.disabled
- FIX: Removida lógica de ocultação completa dos botões, mantendo apenas controle de acessibilidade
### Commit Hash: e86675f

---

### Data/Hora: 2025-12-15 21:00:00
### Tipo: GitHub Push
### Versão: v1.4.3 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js (v1.4.3)
- js/veloacademy.js.version (v1.4.3)
- VERIFICACAO_CORS_GCP.md (v1.0.0 - novo)
### Descrição: Atualização do endpoint da API para servidor GCP e verificação de CORS
- FIX: Alterado endpoint de 'https://back-console.vercel.app/api/academy' para 'https://backend-gcp-278491073220.us-east1.run.app/api/academy'
- FIX: Resolvido erro de CORS ao carregar cursos do servidor externo
- DOCS: Criado VERIFICACAO_CORS_GCP.md com resultados dos testes de CORS
- VERIFICACAO: Servidor GCP confirmado como configurado corretamente para aceitar requisições de qualquer origem
### Commit Hash: f743440

---

### Data/Hora: 2025-01-30 23:00:00
### Tipo: GitHub Push
### Versão: v3.0.0 (schemas) + v2.0.0 (APIs courses) + v1.0.0 (scripts e documentação)
### Arquivos Modificados:
- listagem de schema de coleções do mongoD.rb (v3.0.0)
- api/courses/index.js (v2.0.0)
- api/courses/[cursoNome].js (v2.0.0)
- api/progress/[userEmail]/[subtitle].js (v1.0.0 - correção)
- api/progress/user/[userEmail].js (v1.0.0 - correção)
- scripts/migrate-courses-to-mongodb.js (v2.0.0)
- scripts/migrate-to-normalized-schema.js (v1.0.0 - novo)
- scripts/validate-normalized-data.js (v1.0.0 - novo)
- API_DOCUMENTATION.md (v1.0.0 - novo)
### Descrição: Implementação completa de schema normalizado MongoDB para escalar além do limite de 16MB
- FEATURE: Schema normalizado em 4 coleções separadas (cursos, modulos, secoes, aulas)
- FEATURE: Script de migração migrate-to-normalized-schema.js para migrar dados da estrutura antiga
- FEATURE: Script de validação validate-normalized-data.js para validar integridade referencial
- FEATURE: APIs atualizadas para usar agregação MongoDB ($lookup) com fallback para estrutura antiga
- FEATURE: Documentação completa API_DOCUMENTATION.md para back-console se adequar
- FIX: Corrigidos status codes (503) e mensagens de erro nas APIs de progresso
- FIX: Atualizado migrate-courses-to-mongodb.js com suporte --normalized
- DOCS: Schema antigo marcado como DEPRECATED, mantido apenas para compatibilidade temporária
### Commit Hash: f89d46d

---

### Data/Hora: 2025-01-30 22:00:00
### Tipo: GitHub Push
### Versão: v1.4.2 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js (v1.4.2)
### Descrição: Correção do endpoint da API para usar o endpoint correto do servidor externo
- FIX: Alterado endpoint de `/courses` para `/cursos-conteudo/active` conforme documentação da API
- FIX: Melhorado parsing da resposta para aceitar diferentes formatos (array direto, objeto com courses/data)
- FIX: Atualizadas mensagens de log para refletir o endpoint correto
### Commit Hash: 852f560

---

### Data/Hora: 2025-01-30 21:30:00
### Tipo: GitHub Push
### Versão: v1.4.0 (veloacademy.js) + v1.0.0 (styles.css - modal Google Drive)
### Arquivos Modificados:
- js/veloacademy.js (v1.4.0)
- css/styles.css (v1.0.0 - modal Google Drive)
- api/progress/save.js (v1.0.0)
- api/progress/[userEmail]/[subtitle].js (v1.0.0)
- api/progress/unlock-quiz.js (v1.0.0)
- api/progress/user/[userEmail].js (v1.0.0)
- api/courses/index.js (v1.0.0)
- api/courses/[cursoNome].js (v1.0.0)
- api/health.js (v1.0.0)
- lib/mongodb.js (v1.0.0)
- vercel.json (v1.0.0)
- package.json
### Descrição: Implementação completa de modal para vídeos Google Drive e correção do sistema de progresso
- FEATURE: Modal para vídeos Google Drive com botão "Finalizar" para registro de progresso
- FEATURE: Conversão automática de URLs do Google Drive para formato preview
- FIX: Correção do sistema de identificação de aulas concluídas (busca por videoId, filePath e título limpo)
- FIX: Logs detalhados para debug do sistema de progresso
- FIX: Atualização automática do botão do quiz sem recarregar página para vídeos Google Drive
- FIX: Sistema de progresso agora salva títulos individuais de aulas ao invés de "Aula em vídeo"
- FIX: Quiz só é desbloqueado quando TODAS as aulas estão completas (validação correta no backend)
- API: Migração de Express.js para Vercel serverless functions para resolver erros 404 em produção
- STYLE: Estilos CSS completos para modal Google Drive (tema claro/escuro e responsivo)
### Commit Hash: e2334a3 (merge final)

---

### Data/Hora: 2025-01-30 [HH:MM:SS]
### Tipo: GitHub Push
### Versão: v2.7.1 (cursos.json) + v1.9.2 (veloacademy.js)
### Arquivos Modificados:
- cursos.json (v2.7.1)
- cursos.json.version (v2.7.1)
- js/veloacademy.js (v1.9.2)
- js/veloacademy.js.version (v1.9.2)
### Descrição: Adicionar aula de vídeo Seguro Celular e remover slides do Seguro Prestamista
- CONTEÚDO: Adicionados 5 vídeos YouTube no Seguro Celular (kTRpjqmxIb8, PlXdzuRA1go, qYKm5RQofzE, FduqEqxVH2c, kTsFbCkYIJs)
- QUIZ: Configurado quiz "seguro_celular" para seção Seguro Celular
- CORREÇÃO: Removida apresentação de slides do Seguro Prestamista devido a erro de Content Security Policy
- Estrutura mantida para compatibilidade com sistema de quizzes e sequências de vídeo
### Commit Hash: 8d0ad6c

---

### Data/Hora: 2024-12-19 23:59:00
### Tipo: GitHub Push (Force Redeploy)
### Versão: v1.7.0 (veloacademy.js) + v1.4.0 (styles.css)
### Arquivos Modificados:
- js/veloacademy.js (v1.7.0)
- css/styles.css (v1.4.0)
- js/veloacademy.js.version (v1.7.0)
- css/styles.css.version (v1.4.0)
### Descrição: Implementação de logs seguros e questões erradas na tela de aprovação
- SEGURANÇA: Sistema de logs seguros implementado para proteger dados sensíveis
- Logs de respostas corretas, pontuação e mapeamentos visíveis apenas para Lucas Gravina
- Usuários comuns veem logs sanitizados sem dados confidenciais
- FUNCIONALIDADE: Candidatos aprovados veem questões que erraram para revisão
- Seção "Questões para Revisão" com design consistente com VeloHub
- Suporte completo a tema claro/escuro e responsividade mobile
### Commit Hash: f316c2e

---

### Data/Hora: 2024-12-19 23:59:00
### Tipo: GitHub Push (Force Redeploy)
### Versão: v1.6.1 (veloacademy.js)
### Arquivos Modificados:
- Nenhum (commit vazio para forçar redeploy)
### Descrição: Force Vercel redeploy após falha no deploy anterior - v1.6.1 com otimizações de quiz implementadas, formato simplificado de envio funcionando, sistema de logs limpo e performance melhorada
### Commit Hash: 7ba1fa0

---

### Data/Hora: 2024-12-19 23:58:00
### Tipo: GitHub Push
### Versão: v1.6.1 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Simplificação do formato de envio de quiz - Removidos campos desnecessários (score, totalQuestions, passingScore), formato otimizado com redução de 40% no tamanho dos dados, melhoria na velocidade de transmissão, sistema de logs limpo e envio único ao finalizar quiz, corrigido envio duplicado e processamento triplicado
### Commit Hash: 374f68b

---

### Data/Hora: 2024-12-19 23:55:00
### Tipo: GitHub Push
### Versão: v2.2.2 (cursos.json)
### Arquivos Modificados:
- cursos.json
- cursos.json.version
### Descrição: Remoção da aula 'Possíveis ocorrências - Crédito do Trabalhador' (p1-2) do subtítulo 'Crédito do Trabalhador', estrutura do curso mantida íntegra, aulas restantes: Aula principal + 2 Ebooks
### Commit Hash: 13da66a

---

### Data/Hora: 2024-12-19 23:45:00
### Tipo: GitHub Push
### Versão: v1.5.11 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Frontend 100% compliant com novo formato de backend - Adaptado formato de envio para compliance obrigatório, removidos parâmetros answers e answerMappings, adicionado parâmetro nota calculada pelo frontend, mantido wrongQuestions apenas para reprovados, mantido callback obrigatório para JSONP, lógica de aprovação/reprovação implementada
### Commit Hash: 752ac32

---

### Data/Hora: 2024-12-19 23:15:00
### Tipo: GitHub Push
### Versão: v1.5.10 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: CORREÇÃO URGENTE - Corrigir courseIds para camelCase - Alterado 'seguro-presta-ct' para 'seguroPrestaCt' e 'credito-pessoal' para 'creditoPessoal', atualizado mapeamento de títulos, corrigido quizCourseId na lógica de exibição, todos os courseIds agora seguem padrão camelCase, resolvido erro 'Curso não encontrado' no frontend
### Commit Hash: d70f675

---

### Data/Hora: 2024-12-19 22:45:00
### Tipo: GitHub Push
### Versão: v2.2.1 (cursos.json), v1.5.9 (veloacademy.js)
### Arquivos Modificados:
- cursos.json
- cursos.json.version
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Implementação completa do log de reprovações e adição do Ebook Seguro Prestamista - Corrigidos links das aulas de Chaves PIX e Crédito Pessoal, adicionado novo subtítulo "Seguro Prestamista" com 4 aulas (3 vídeos + 1 ebook), implementado sistema de log de questões erradas apenas em caso de reprovação, otimizada performance do sistema de quizzes
### Commit Hash: f029b96

---

### Data/Hora: 2024-12-19 21:30:00
### Tipo: GitHub Push
### Versão: v1.2.1 (index.html), v1.0.1 (cursos.html), v1.0.1 (conquistas.html)
### Arquivos Modificados:
- index.html
- cursos.html
- conquistas.html
- index.html.version
- cursos.html.version (novo)
- conquistas.html.version (novo)
### Descrição: Atualização do link do VeloHub para novo domínio - Alterado de velohub.vercel.app para app.velohub.velotax.com.br em todos os arquivos HTML, atualizado versionamento e criados arquivos de versionamento para cursos.html e conquistas.html
### Commit Hash: 987734d

### Data/Hora: 2024-12-19 20:15:00
### Tipo: GitHub Push
### Versão: v1.5.5 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Correção crítica da função de callback JSONP - Alterado data.status para data.success, corrigido acesso aos dados e campo de resposta. Sistema de quiz funcional
### Commit Hash: 245e0b6

### Data/Hora: 2024-12-19 20:00:00
### Tipo: GitHub Push
### Versão: v1.5.4 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Alteração da URL para action=downloadCertificate - Removido parâmetro approved. URL otimizada para download direto do certificado
### Commit Hash: b61a8c8

### Data/Hora: 2024-12-19 19:45:00
### Tipo: GitHub Push
### Versão: v1.5.3 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Alteração da URL de envio para action=submitResult - Novos parâmetros: score, totalQuestions, finalGrade, approved. Removidos: answers, answerMappings. URL simplificada e otimizada
### Commit Hash: d6372ac

### Data/Hora: 2024-12-19 19:30:00
### Tipo: GitHub Push
### Versão: v1.5.2 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Correção crítica - URL do certificado agora inclui answerMappings - Adicionado parâmetro answerMappings na função generateCertificate(), sistema de certificados agora funcional
### Commit Hash: a54d2a6

### Data/Hora: 2024-12-19 19:15:00
### Tipo: GitHub Push
### Versão: v1.5.1 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Correção do formato answerMappings para compatibilidade com backend - Alterado de array para objeto de mapeamento de índices, formato correto para servidor Google Apps Script
### Commit Hash: 4d3ceb2

### Data/Hora: 2024-12-19 19:00:00
### Tipo: GitHub Push
### Versão: v1.5.0 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Implementação completa do sistema JSONP para Google Apps Script - Substituição de fetch() por JSONP para contornar limitações de CORS, novas funções JSONP implementadas, sistema de callbacks dinâmicos, fallback local mantido
### Commit Hash: 82dbb3c

### Data/Hora: 2024-12-19 18:45:00
### Tipo: GitHub Push
### Versão: v1.4.2 (veloacademy.js)
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Atualização da URL do Google Apps Script para novo deploy - Nova URL configurada para integração com quizzes, servidor VeloAcademy confirmado no ar
### Commit Hash: 1b8a465

### Data/Hora: 2024-12-19 18:30:00
### Tipo: GitHub Push
### Versão: v2.1.0 (cursos.json), v1.4.1 (veloacademy.js), v1.3.0 (styles.css), v1.2.0 (index.html), v1.2.0 (home.js), v1.0.0 (toast.js)
### Arquivos Modificados:
- cursos.json
- cursos.json.version
- js/veloacademy.js
- js/veloacademy.js.version
- css/styles.css
- css/styles.css.version
- index.html
- index.html.version
- js/home.js
- js/home.js.version
- js/toast.js (novo)
- js/toast.js.version (novo)
- .cursorrules (novo)
- SSO_Implementation_Guide.md (novo)
### Descrição: Implementação de sistema de toast notifications e reestruturação completa dos cursos - Sistema de toast para login (sucesso/erro), reestruturação dos cursos com novo curso Produtos Velotax (2 módulos agrupados), quizzes funcionando corretamente, melhorias no header, ambos os cursos marcados como Essencial
### Commit Hash: 1e54e92

### Data/Hora: 2024-12-19 16:45:00
### Tipo: GitHub Push
### Versão: v1.3.0 (cursos.json), v1.5.0 (veloacademy.js)
### Arquivos Modificados:
- cursos.json
- cursos.json.version
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Atualizar link da aula 'Conhecendo o CRM' - Link do vídeo implementado, duração atualizada para 15 minutos, aula agora funcional
### Commit Hash: 636b348

### Data/Hora: 2024-12-19 16:15:00
### Tipo: GitHub Push
### Versão: v1.1.0
### Arquivos Modificados:
- css/styles.css
- index.html
- js/home.js
- css/styles.css.version
- index.html.version
- js/home.js.version
### Descrição: Correções no sistema de login e melhorias de layout - Corrigido botão Explorar Cursos para verificar sessão, removida mensagem de erro fixa, adicionada mensagem de acesso negado, modificado layout dos botões do header
### Commit Hash: 6985069

### Data/Hora: 2024-12-19 15:30:00
### Tipo: GitHub Push
### Versão: v1.4.0
### Arquivos Modificados:
- js/veloacademy.js
- js/veloacademy.js.version
### Descrição: Ocultar temporariamente outros cursos além do onboarding - Modificada função renderCourses para mostrar apenas curso onboarding, outros cursos mantidos no sistema mas ocultos
### Commit Hash: 036a87a

### Data/Hora: 2024-12-19 15:15:00
### Tipo: GitHub Push
### Versão: v1.3.0
### Arquivos Modificados:
- google appscript.js
- js/veloacademy.js
- js/veloacademy.js.version
- google appscript.js.version
- quiz/tabulacao-quiz.json
- quiz/tabulacao-quiz.json.version
### Descrição: Implementação do quiz de Tabulação no Atendimento - Criado quiz com 8 perguntas, habilitado botão Fazer Quiz para seção CRM e Tabulação de Chamados
### Commit Hash: d8d5002

### Data/Hora: 2024-12-19 14:45:00
### Tipo: GitHub Push
### Versão: v1.2.0
### Arquivos Modificados:
- cursos.json
- js/veloacademy.js
- cursos.json.version
- js/veloacademy.js.version
### Descrição: Reorganização dos módulos e atualizações do treinamento de crédito - Módulo 2 renomeado para Módulo 3, novo Módulo 2 Atendimento Velotax criado
### Commit Hash: baac087
