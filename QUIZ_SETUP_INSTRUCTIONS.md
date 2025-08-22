# 📋 Instruções para Configuração dos Quizzes

## 🎯 Arquivos Criados

Foram criados os seguintes arquivos JSON para você fazer upload na pasta do Google Drive:

### 📁 Arquivos de Quiz
1. **`pix-quiz.json`** - Quiz sobre PIX: Normas e Segurança (6 questões)
2. **`credito-quiz.json`** - Quiz sobre Crédito do Trabalhador (8 questões)
3. **`quiz-template.json`** - Template para criar novos quizzes

### ⚙️ Arquivo de Configuração
4. **`quiz-config.json`** - Configuração do sistema de quizzes

## 📤 Passos para Upload no Google Drive

### 1. Acesse a Pasta
- Vá para: https://drive.google.com/drive/folders/1hb6gBRMllqyyTlbUzJ9y2PULsP9FvJyf?usp=drive_link
- Esta é a pasta "Quiz" que você criou

### 2. Faça Upload dos Arquivos
- Faça upload dos 4 arquivos JSON criados
- Mantenha os nomes originais dos arquivos

### 3. Obtenha os IDs dos Arquivos
Após o upload, para cada arquivo:
1. Clique com botão direito no arquivo
2. Selecione "Compartilhar"
3. Clique em "Copiar link"
4. O ID é a parte do link entre `/d/` e `/view`
   - Exemplo: `https://drive.google.com/file/d/1ABC123DEF456/view` → ID: `1ABC123DEF456`

### 4. Atualize o quiz-config.json
Substitua os valores `SUBSTITUIR_PELO_ID_DO_ARQUIVO_XXX` pelos IDs reais:

```json
{
    "quizFiles": {
        "pix": {
            "driveId": "ID_REAL_DO_PIX_QUIZ"
        },
        "credito": {
            "driveId": "ID_REAL_DO_CREDITO_QUIZ"
        }
    }
}
```

## 🎓 Características dos Quizzes

### Quiz PIX
- **6 questões** sobre normas e segurança PIX
- **Nota de corte: 9** (conforme solicitado)
- **Tempo limite: 30 minutos**
- Foco em: vinculação de chaves, exclusão, procedimentos da Receita

### Quiz Crédito do Trabalhador
- **8 questões** sobre análise e concessão
- **Nota de corte: 9** (conforme solicitado)
- **Tempo limite: 45 minutos**
- Foco em: documentação, prazos, taxas, procedimentos

## 🔧 Configurações Disponíveis

No `quiz-config.json` você pode ajustar:

- **`cacheTimeout`**: Tempo de cache (1 hora padrão)
- **`fallbackToLocal`**: Usar versão local se Drive falhar
- **`showExplanations`**: Mostrar explicações das respostas (desabilitado)
- **`allowRetry`**: Permitir nova tentativa
- **`maxRetries`**: Máximo de tentativas (3 padrão)

## 📝 Para Criar Novos Quizzes

1. Use o `quiz-template.json` como base
2. Altere o `courseId` para o ID do curso
3. Adicione as questões específicas
4. Faça upload no Google Drive
5. Atualize o `quiz-config.json` com o novo ID

## ✅ Próximos Passos

Após fazer o upload e configurar os IDs:
1. O sistema carregará automaticamente os quizzes do Google Drive
2. Os quizzes aparecerão nos cursos correspondentes
3. Os usuários poderão fazer os testes
4. Se reprovarem, deverão refazer o curso e tentar novamente

## 🎯 Filosofia do Sistema

- **Aprovação direta**: Nota 9 ou superior para aprovação
- **Sem explicações**: Se reprovar, deve estudar o curso novamente
- **Foco no aprendizado**: Incentiva revisão completa do conteúdo

---

**🎉 Pronto!** Seus quizzes estão configurados com nota de corte 9 e carregamento dinâmico do Google Drive.
