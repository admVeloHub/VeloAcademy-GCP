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
