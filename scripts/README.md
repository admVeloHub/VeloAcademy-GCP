# Scripts de Migração

## migrate-courses-to-mongodb.js

Script para migrar dados de `cursos.json` para a collection MongoDB `cursos_conteudo`.

### Pré-requisitos

1. Variável de ambiente `MONGODB_URI` ou `VERCEL_MONGODB_URI` configurada
2. Arquivo `.env` na raiz do projeto com a URI do MongoDB
3. Dependências instaladas (`npm install`)

### Como usar

```bash
npm run migrate-courses
```

Ou diretamente:

```bash
node scripts/migrate-courses-to-mongodb.js
```

### O que o script faz

1. **Lê** o arquivo `cursos.json` da raiz do projeto
2. **Transforma** os dados para o formato MongoDB conforme schema aprovado
3. **Conecta** ao MongoDB usando as variáveis de ambiente
4. **Insere ou atualiza** os cursos na collection `cursos_conteudo`

### Transformações realizadas

- **cursoNome**: Usado como chave do objeto JSON
- **cursoClasse**: Mapeado automaticamente baseado no cursoNome
- **courseOrder**: Gerado sequencialmente (1, 2, 3...)
- **moduleId**: Gerado como `modulo-1`, `modulo-2`, etc.
- **moduleOrder**: Baseado na ordem dos módulos
- **temaOrder**: Baseado na ordem das seções
- **lessonOrdem**: Baseado na ordem das aulas
- **lessonContent**: Transformado de `filePath` para array `[{ url: ... }]`
- **youtubeId**: Extraído automaticamente de URLs do YouTube
- **driveId**: Extraído automaticamente de URLs do Google Drive ou usado do campo existente
- **hasQuiz** e **quizId**: Gerados automaticamente baseados no subtitle

### Mapeamento de cursoClasse

- `onboarding` → Essencial
- `produtos` → Essencial
- `novidades-modificacoes` → Atualização
- `cs004` → Reciclagem
- `cs003` → Opcional
- `operacoes` → Atualização
- `youtube-curso` → Opcional

### Estrutura antiga vs nova

O script suporta ambas as estruturas:

**Estrutura com sections (nova):**
```json
{
  "modules": [
    {
      "title": "Módulo 1",
      "sections": [
        {
          "subtitle": "Tema",
          "lessons": [...]
        }
      ]
    }
  ]
}
```

**Estrutura com lessons diretas (antiga):**
```json
{
  "modules": [
    {
      "title": "Módulo 1",
      "lessons": [...]
    }
  ]
}
```

Para a estrutura antiga, o script cria automaticamente uma section única com o título do módulo.

### Comportamento

- **Cursos existentes**: São atualizados (mantém `createdAt` original)
- **Cursos novos**: São inseridos com `createdAt` e `createdBy` novos
- **Aulas com filePath = "#"**: São marcadas como `isActive: false`
- **YouTube IDs**: Extraídos automaticamente de URLs do YouTube
- **Drive IDs**: Extraídos de URLs ou usados do campo `driveId` existente

### Exemplo de saída

```
📖 Lidos 7 cursos de cursos.json
✅ Conectado ao MongoDB

📝 Processando curso: onboarding
  ✅ Curso inserido: onboarding

📝 Processando curso: produtos
  ✅ Curso inserido: produtos

...

✅ Migração concluída! 7 cursos processados.

📊 Total de cursos na collection: 7

🔌 Conexão MongoDB fechada
```

### Troubleshooting

**Erro: MONGODB_URI não configurada**
- Verifique se o arquivo `.env` existe na raiz do projeto
- Adicione `MONGODB_URI=sua_uri_aqui` no arquivo `.env`

**Erro: Arquivo não encontrado**
- Certifique-se de que `cursos.json` está na raiz do projeto

**Erro: Conexão MongoDB falhou**
- Verifique se a URI está correta
- Verifique se o MongoDB está acessível
- Verifique se as credenciais estão corretas

