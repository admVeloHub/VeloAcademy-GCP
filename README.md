# VeloAcademy Simplificado

Este é o repositório do sistema VeloAcademy simplificado, focado em ser uma plataforma de cursos e treinamentos para funcionários, sem as funcionalidades de gamificação e pontuação.

## Como Adicionar Novos Cursos e Conteúdos

Para adicionar novos cursos e módulos, você precisará editar o arquivo `cursos.json` e o arquivo `veloacademy.js` localizado na pasta `js/`.

### 1. Editando `cursos.json`

O arquivo `cursos.json` contém a estrutura dos seus cursos. Cada curso é um objeto JSON com as seguintes propriedades:

-   `title`: Título do curso.
-   `description`: Descrição breve do curso.
-   `modules`: Uma array de módulos, onde cada módulo contém:
    -   `title`: Título do módulo.
    -   `lessons`: Uma array de aulas, onde cada aula contém:
        -   `id`: Um ID único para a aula (ex: `l1-1`).
        -   `title`: Título da aula.
        -   `type`: Tipo de conteúdo (ex: `video`, `audio`, `pdf`).
        -   `duration`: Duração da aula (ex: `5 min`, `Leitura`).
        -   `filePath`: O link direto para o seu conteúdo no Google Drive ou outro serviço de hospedagem. **Certifique-se de que o link seja público ou acessível pelos usuários.**

**Exemplo de estrutura em `cursos.json`:**

```json
{
    "cs005": {
        "title": "Novo Curso de Exemplo",
        "description": "Este é um novo curso para demonstração.",
        "modules": [
            {
                "title": "Módulo de Introdução",
                "lessons": [
                    { "id": "l9-1", "title": "Primeira Aula", "type": "video", "duration": "5 min", "filePath": "LINK_DO_SEU_VIDEO" },
                    { "id": "l9-2", "title": "Documento Importante", "type": "pdf", "duration": "Leitura", "filePath": "LINK_DO_SEU_PDF" }
                ]
            }
        ]
    }
}
```

### 2. Editando `veloacademy.js`

O arquivo `veloacademy.js` contém o código JavaScript que carrega e exibe os cursos. Você precisará adicionar o novo curso ao objeto `courseDatabase` dentro da função `loadCourses()`.

**Exemplo de como adicionar um novo curso em `veloacademy.js`:**

```javascript
// ... (código existente)

    loadCourses() {
        this.courseDatabase = {
            // ... (cursos existentes)

            'cs005': {
                title: 'Novo Curso de Exemplo',
                description: 'Este é um novo curso para demonstração.',
                modules: [
                    {
                        title: 'Módulo de Introdução',
                        lessons: [
                            { id: 'l9-1', title: 'Primeira Aula', type: 'video', duration: '5 min', filePath: 'LINK_DO_SEU_VIDEO' },
                            { id: 'l9-2', title: 'Documento Importante', type: 'pdf', duration: 'Leitura', filePath: 'LINK_DO_SEU_PDF' }
                        ]
                    }
                ]
            },
        };
    },

// ... (código restante)
```

**Importante:**

-   Certifique-se de que os IDs dos cursos (`csXXX`) e das aulas (`lX-X`) sejam únicos.
-   Após fazer as alterações, salve os arquivos e faça o commit e push para o seu repositório GitHub. As alterações serão refletidas automaticamente no site online após o deploy.

## Design e Identidade Visual

O layout e as cores do VeloAcademy foram atualizados para seguir a identidade visual da Camp Learning. As cores principais utilizadas são:

-   **Azul Escuro:** `#1C1E37`
-   **Azul Médio:** `#202449`
-   **Azul Claro:** `#2b2e52`
-   **Verde Destaque:** `#0fff80`
-   **Rosa Destaque:** `#FF2AB1`
-   **Texto Claro:** `#dfe0f7`
-   **Texto Médio:** `#8386a0`
-   **Texto Escuro:** `#181a30`
-   **Branco:** `#FFFFFF`

Essas cores estão definidas no arquivo `css/styles.css` como variáveis CSS para facilitar a manutenção e padronização.

## Deploy

O site está atualmente online em: [https://ieggmqmf.manus.space](https://ieggmqmf.manus.space)

Qualquer dúvida ou necessidade de alteração, entre em contato.


