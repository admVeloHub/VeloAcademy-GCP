# VERSION: v1.0.0 | VeloAcademy - Deploy GCP Cloud Run
# Imagem base Node.js LTS
FROM node:20-slim

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências (produção apenas)
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Porta exposta (Cloud Run usa variável PORT)
ENV PORT=8080
EXPOSE 8080

# Health check (Cloud Run usa configuração própria; útil para docker run local)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||8080)+'/api/health',r=>{r.resume();process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Iniciar servidor unificado (API + estáticos)
CMD ["node", "server-api.js"]
