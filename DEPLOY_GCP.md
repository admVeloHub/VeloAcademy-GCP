# Deploy VeloAcademy no GCP Cloud Run

## Visão Geral

O VeloAcademy usa deploy no **Google Cloud Run**. O servidor unificado (`server-api.js`) serve a API e, conforme a imagem, também os ficheiros estáticos (HTML, CSS, JS).

## Pré-requisitos

1. **Google Cloud SDK** instalado e autenticado:
   ```bash
   gcloud auth login
   gcloud config set project SEU_PROJECT_ID
   ```

2. **APIs habilitadas** no projeto GCP:
   - Cloud Build API
   - Cloud Run API
   - Artifact Registry API

3. **Repositório Artifact Registry** (se não existir):
   ```bash
   gcloud artifacts repositories create cloud-run-source-deploy \
     --repository-format=docker \
     --location=us-east1 \
     --description="Imagens Cloud Run"
   ```

4. **Variáveis de ambiente** configuradas no Cloud Run (MongoDB, etc.)

## Variáveis de Ambiente Necessárias

Configure no Cloud Run (Console ou via gcloud):

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `MONGODB_URI` | Connection string do MongoDB | Sim |
| `DB_NAME_ACADEMY` | Nome do banco (padrão: academy_registros) | Não |

## Deploy Manual

### Opção 1: Via Cloud Build (recomendado)

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Opção 2: Build e deploy separados

```bash
# Build da imagem
docker build -t us-east1-docker.pkg.dev/SEU_PROJECT_ID/cloud-run-source-deploy/veloacademy:latest .

# Push para Artifact Registry (após configurar docker para gcloud)
gcloud auth configure-docker us-east1-docker.pkg.dev

docker push us-east1-docker.pkg.dev/SEU_PROJECT_ID/cloud-run-source-deploy/veloacademy:latest

# Deploy no Cloud Run
gcloud run deploy veloacademy \
  --image us-east1-docker.pkg.dev/SEU_PROJECT_ID/cloud-run-source-deploy/veloacademy:latest \
  --region us-east1 \
  --platform managed \
  --allow-unauthenticated
```

### Opção 3: Deploy direto (Cloud Build faz build + deploy)

```bash
gcloud run deploy veloacademy \
  --source . \
  --region us-east1 \
  --platform managed \
  --allow-unauthenticated
```

## Configurar Variáveis de Ambiente no Cloud Run

```bash
gcloud run services update veloacademy \
  --region us-east1 \
  --set-env-vars "MONGODB_URI=sua_connection_string,DB_NAME_ACADEMY=academy_registros"
```

## Customização do cloudbuild.yaml

Edite as substituições em `cloudbuild.yaml`:

```yaml
substitutions:
  _SERVICE_NAME: veloacademy   # Nome do serviço Cloud Run
  _REGION: us-east1            # Região (us-east1, us-central1, etc.)
```

## Teste Local com Docker

```bash
# Build
docker build -t veloacademy:local .

# Executar (passe MONGODB_URI se necessário)
docker run -p 8080:8080 -e MONGODB_URI="sua_uri" veloacademy:local

# Acesse http://localhost:8080
```

## Estrutura de Arquivos para Deploy

- `Dockerfile` - Build da imagem
- `.dockerignore` - Arquivos excluídos do build
- `cloudbuild.yaml` - Pipeline de build e deploy
- `server-api.js` - Servidor unificado (API + estáticos)

## Deploy atual

O fluxo oficial é **GCP Cloud Run** com `server-api.js`. Após o deploy:

1. Obtenha a URL do serviço no Cloud Run
2. Atualize o domínio customizado (se aplicável)
3. Configure secrets / variáveis de ambiente no serviço
