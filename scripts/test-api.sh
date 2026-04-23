#!/bin/bash
# VERSION: v1.0.1 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
# Testes básicos de sintaxe e ficheiros (API servida por server-api.js / GCP)

echo "🧪 Iniciando testes da API..."
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ERRORS=0

check_syntax() {
    if node -c "$1" 2>/dev/null; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📝 Verificando sintaxe dos arquivos..."
echo ""

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

FILES=(
    "lib/mongodb.js"
    "api/progress/save.js"
    "api/progress/unlock-quiz.js"
    "api/progress/user/[userEmail].js"
    "api/progress/[userEmail]/[subtitle].js"
    "api/courses/index.js"
    "api/courses/[cursoNome].js"
    "api/health.js"
    "server-api.js"
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
echo "   1. npm run api  — subir API em http://localhost:3001"
echo "   2. curl http://localhost:3001/api/health"
echo "   3. Documentação adicional: TESTES_API.md, DEPLOY_GCP.md"
echo ""
