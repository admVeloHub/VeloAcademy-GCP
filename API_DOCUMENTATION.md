# Documentação da API VeloAcademy - Estrutura Normalizada

<!-- VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team -->

## Visão Geral

A API VeloAcademy utiliza uma estrutura normalizada em 4 coleções MongoDB separadas para escalar além do limite de 16MB por documento:

1. **academy_registros.cursos** - Metadados dos cursos
2. **academy_registros.modulos** - Módulos dos cursos (referência: cursoId)
3. **academy_registros.secoes** - Seções/Temas dos módulos (referência: moduloId)
4. **academy_registros.aulas** - Aulas das seções (referência: secaoId)

## Endpoints Disponíveis

### GET /api/academy/cursos-conteudo/active
Lista todos os cursos ativos com estrutura completa (módulos, seções e aulas).

**Resposta:**
```json
{
  "success": true,
  "courses": [
    {
      "_id": "ObjectId",
      "cursoClasse": "Essencial",
      "cursoNome": "produtos",
      "cursoDescription": "Descrição do curso",
      "courseOrder": 1,
      "isActive": true,
      "modules": [
        {
          "moduleId": "modulo-1",
          "moduleNome": "Módulo 1: Introdução",
          "moduleOrder": 1,
          "isActive": true,
          "sections": [
            {
              "temaNome": "Digital",
              "temaOrder": 1,
              "isActive": true,
              "hasQuiz": true,
              "quizId": "produtos-digital",
              "lessons": [
                {
                  "_id": "ObjectId",
                  "lessonId": "p-digital-1",
                  "lessonTipo": "video",
                  "lessonTitulo": "Aula - Produtos Digitais",
                  "lessonOrdem": 1,
                  "isActive": true,
                  "lessonContent": [
                    { "url": "https://youtu.be/ABC123xyz" }
                  ],
                  "driveId": null,
                  "youtubeId": "ABC123xyz",
                  "duration": "10 min"
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "structure": "normalized"
}
```

### GET /api/academy/cursos-conteudo/:cursoNome
Obtém um curso específico por nome.

**Parâmetros:**
- `cursoNome` (string): Nome do curso (ex: "produtos", "onboarding")

**Resposta:**
```json
{
  "success": true,
  "course": {
    "_id": "ObjectId",
    "cursoClasse": "Essencial",
    "cursoNome": "produtos",
    "cursoDescription": "Descrição do curso",
    "courseOrder": 1,
    "isActive": true,
    "modules": [...]
  },
  "structure": "normalized"
}
```

## Como Criar/Editar Cursos na Estrutura Normalizada

### 1. Criar um Curso

**Coleção:** `academy_registros.cursos`

```javascript
const cursoDoc = {
  cursoClasse: "Essencial",  // "Essencial", "Atualização", "Opcional", "Reciclagem"
  cursoNome: "novo-curso",   // Identificador único (sem espaços, minúsculas)
  cursoDescription: "Descrição do curso",
  courseOrder: 1,             // Ordem de exibição
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: "admin@velotax.com.br",
  version: 1
};

// Inserir
const cursoResult = await db.collection('cursos').insertOne(cursoDoc);
const cursoId = cursoResult.insertedId;
```

### 2. Criar Módulos para o Curso

**Coleção:** `academy_registros.modulos`

```javascript
const moduloDoc = {
  cursoId: cursoId,           // ObjectId do curso criado acima
  moduleId: "modulo-1",       // Identificador único dentro do curso
  moduleNome: "Módulo 1: Introdução",
  moduleOrder: 1,             // Ordem dentro do curso
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

// Inserir
const moduloResult = await db.collection('modulos').insertOne(moduloDoc);
const moduloId = moduloResult.insertedId;
```

### 3. Criar Seções para o Módulo

**Coleção:** `academy_registros.secoes`

```javascript
const secaoDoc = {
  moduloId: moduloId,         // ObjectId do módulo criado acima
  temaNome: "Digital",        // Nome da seção/tema
  temaOrder: 1,               // Ordem dentro do módulo
  isActive: true,
  hasQuiz: true,              // Se tem quiz associado
  quizId: "produtos-digital", // ID do quiz (se houver)
  createdAt: new Date(),
  updatedAt: new Date()
};

// Inserir
const secaoResult = await db.collection('secoes').insertOne(secaoDoc);
const secaoId = secaoResult.insertedId;
```

### 4. Criar Aulas para a Seção

**Coleção:** `academy_registros.aulas`

```javascript
const aulaDoc = {
  secaoId: secaoId,           // ObjectId da seção criada acima
  lessonId: "p-digital-1",    // Identificador único dentro da seção
  lessonTipo: "video",        // "video", "pdf", "audio", "slide", "document"
  lessonTitulo: "Aula - Produtos Digitais",
  lessonOrdem: 1,             // Ordem dentro da seção
  isActive: true,
  lessonContent: [            // Array de URLs (permite múltiplas para sequências)
    { url: "https://youtu.be/ABC123xyz" }
  ],
  driveId: null,              // ID do Google Drive (se aplicável)
  youtubeId: "ABC123xyz",     // ID do YouTube (se aplicável)
  duration: "10 min",         // Duração (opcional)
  createdAt: new Date(),
  updatedAt: new Date()
};

// Inserir
await db.collection('aulas').insertOne(aulaDoc);
```

### Exemplo Completo: Criar Curso Completo

```javascript
const { MongoClient, ObjectId } = require('mongodb');

async function criarCursoCompleto() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db('academy_registros');
  
  try {
    // 1. Criar curso
    const cursoResult = await db.collection('cursos').insertOne({
      cursoClasse: "Essencial",
      cursoNome: "novo-curso",
      cursoDescription: "Curso completo de exemplo",
      courseOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: "admin@velotax.com.br",
      version: 1
    });
    const cursoId = cursoResult.insertedId;
    
    // 2. Criar módulo
    const moduloResult = await db.collection('modulos').insertOne({
      cursoId: cursoId,
      moduleId: "modulo-1",
      moduleNome: "Módulo 1: Introdução",
      moduleOrder: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const moduloId = moduloResult.insertedId;
    
    // 3. Criar seção
    const secaoResult = await db.collection('secoes').insertOne({
      moduloId: moduloId,
      temaNome: "Primeira Seção",
      temaOrder: 1,
      isActive: true,
      hasQuiz: false,
      quizId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const secaoId = secaoResult.insertedId;
    
    // 4. Criar aulas
    await db.collection('aulas').insertMany([
      {
        secaoId: secaoId,
        lessonId: "l1-1",
        lessonTipo: "video",
        lessonTitulo: "Primeira Aula",
        lessonOrdem: 1,
        isActive: true,
        lessonContent: [{ url: "https://youtu.be/ABC123xyz" }],
        driveId: null,
        youtubeId: "ABC123xyz",
        duration: "10 min",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        secaoId: secaoId,
        lessonId: "l1-2",
        lessonTipo: "pdf",
        lessonTitulo: "Material Complementar",
        lessonOrdem: 2,
        isActive: true,
        lessonContent: [{ url: "https://drive.google.com/file/d/XYZ789/view" }],
        driveId: "XYZ789",
        youtubeId: null,
        duration: "Leitura",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    console.log('✅ Curso criado com sucesso!');
    
  } finally {
    await client.close();
  }
}
```

## Operações de Atualização

### Atualizar Curso

```javascript
await db.collection('cursos').updateOne(
  { cursoNome: "produtos" },
  {
    $set: {
      cursoDescription: "Nova descrição",
      updatedAt: new Date()
    }
  }
);
```

### Atualizar Módulo

```javascript
await db.collection('modulos').updateOne(
  { cursoId: cursoId, moduleId: "modulo-1" },
  {
    $set: {
      moduleNome: "Novo nome do módulo",
      updatedAt: new Date()
    }
  }
);
```

### Atualizar Seção

```javascript
await db.collection('secoes').updateOne(
  { moduloId: moduloId, temaNome: "Digital" },
  {
    $set: {
      hasQuiz: true,
      quizId: "novo-quiz-id",
      updatedAt: new Date()
    }
  }
);
```

### Atualizar Aula

```javascript
await db.collection('aulas').updateOne(
  { secaoId: secaoId, lessonId: "l1-1" },
  {
    $set: {
      lessonTitulo: "Novo título da aula",
      lessonContent: [{ url: "https://youtu.be/NEW123xyz" }],
      youtubeId: "NEW123xyz",
      updatedAt: new Date()
    }
  }
);
```

## Operações de Exclusão (Desativação)

**IMPORTANTE:** Não deletar documentos, apenas desativar usando `isActive: false`

### Desativar Curso

```javascript
await db.collection('cursos').updateOne(
  { cursoNome: "produtos" },
  {
    $set: {
      isActive: false,
      updatedAt: new Date()
    }
  }
);
```

### Desativar Módulo

```javascript
await db.collection('modulos').updateOne(
  { cursoId: cursoId, moduleId: "modulo-1" },
  {
    $set: {
      isActive: false,
      updatedAt: new Date()
    }
  }
);
```

### Desativar Seção

```javascript
await db.collection('secoes').updateOne(
  { moduloId: moduloId, temaNome: "Digital" },
  {
    $set: {
      isActive: false,
      updatedAt: new Date()
    }
  }
);
```

### Desativar Aula

```javascript
await db.collection('aulas').updateOne(
  { secaoId: secaoId, lessonId: "l1-1" },
  {
    $set: {
      isActive: false,
      updatedAt: new Date()
    }
  }
);
```

## Índices Recomendados

Para otimizar performance, criar os seguintes índices:

```javascript
// Cursos
await db.collection('cursos').createIndex({ cursoNome: 1 }, { unique: true });
await db.collection('cursos').createIndex({ isActive: 1, courseOrder: 1 });

// Módulos
await db.collection('modulos').createIndex({ cursoId: 1 });
await db.collection('modulos').createIndex({ cursoId: 1, isActive: 1, moduleOrder: 1 });

// Seções
await db.collection('secoes').createIndex({ moduloId: 1 });
await db.collection('secoes').createIndex({ moduloId: 1, isActive: 1, temaOrder: 1 });

// Aulas
await db.collection('aulas').createIndex({ secaoId: 1 });
await db.collection('aulas').createIndex({ secaoId: 1, isActive: 1, lessonOrdem: 1 });
```

## Validações Importantes

1. **cursoNome** deve ser único na collection `cursos`
2. **moduleId** deve ser único dentro do mesmo curso (cursoId)
3. **temaNome** deve ser único dentro do mesmo módulo (moduloId)
4. **lessonId** deve ser único dentro da mesma seção (secaoId)
5. Sempre verificar se referências existem antes de criar:
   - Verificar se `cursoId` existe antes de criar módulo
   - Verificar se `moduloId` existe antes de criar seção
   - Verificar se `secaoId` existe antes de criar aula

## Migração da Estrutura Antiga

Para migrar dados da estrutura antiga (`cursos_conteudo`) para a estrutura normalizada, use o script:

```bash
node scripts/migrate-to-normalized-schema.js
```

Este script:
- Lê dados da collection `cursos_conteudo`
- Cria documentos nas 4 novas coleções
- Mantém referências corretas entre documentos
- Gera relatório de migração

## Estrutura Antiga (DEPRECATED)

A estrutura antiga (`academy_registros.cursos_conteudo`) ainda é suportada como fallback durante a transição, mas está marcada como DEPRECATED e será removida no futuro.

**Não criar novos cursos na estrutura antiga.** Use sempre a estrutura normalizada.

## Suporte e Contato

Para dúvidas sobre a API ou estrutura de dados, consulte:
- Documentação de schemas: `listagem de schema de coleções do mongoD.rb`
- Scripts de migração: `scripts/migrate-to-normalized-schema.js`
- Validação de dados: `scripts/validate-normalized-data.js`

