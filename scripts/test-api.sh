#!/bin/bash
# VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
# Script de teste para API Serverless Functions

echo "🧪 Iniciando testes da API..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI não encontrado. Instalando...${NC}"
    npm install -g vercel
fi

# Verificar sintaxe dos arquivos
echo "📝 Verificando sintaxe dos arquivos..."
echo ""

ERRORS=0

check_syntax() {
    if node -c "$1" 2>/dev/null; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

check_syntax "lib/mongodb.js"
check_syntax "api/progress/save.js"
check_syntax "api/progress/unlock-quiz.js"
check_syntax "api/progress/user/[userEmail].js"
check_syntax "api/progress/[userEmail]/[subtitle].js"
check_syntax "api/courses/index.js"
check_syntax "api/courses/[cursoNome].js"
check_syntax "api/health.js"

echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os arquivos têm sintaxe válida!${NC}"
else
    echo -e "${RED}❌ Encontrados $ERRORS erros de sintaxe${NC}"
    exit 1
fi

echo ""
echo "📦 Verificando estrutura de arquivos..."
echo ""

# Verificar se todos os arquivos existem
FILES=(
    "lib/mongodb.js"
    "api/progress/save.js"
    "api/progress/unlock-quiz.js"
    "api/progress/user/[userEmail].js"
    "api/progress/[userEmail]/[subtitle].js"
    "api/courses/index.js"
    "api/courses/[cursoNome].js"
    "api/health.js"
    "vercel.json"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${RED}❌ $file (não encontrado)${NC}"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}✅ Todos os arquivos estão presentes!${NC}"
else
    echo -e "${RED}❌ Faltam $MISSING arquivos${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Testes básicos concluídos!${NC}"
echo ""
echo "📋 Próximos passos:"
echo "   1. Execute 'vercel dev' para testar localmente"
echo "   2. Teste as rotas manualmente (veja TESTES_API.md)"
echo "   3. Faça commit e push para GitHub"
echo "   4. Verifique o deploy no Vercel"
echo ""

