// VERSION: v1.4.3 | DATE: 2025-12-15 | AUTHOR: VeloHub Development Team
// Sistema principal de gerenciamento de cursos VeloAcademy

const veloAcademyApp = {

    courseDatabase: {},

    videoSequencesCache: {}, // Cache para sequências de vídeos por seção
    
    courseDatabaseCache: {
        data: {},
        timestamp: null,
        ttl: 5 * 60 * 1000, // 5 minutos
        source: null // "mongodb" ou "json"
    },
    
    // Função para obter URL base da API
    getApiBaseUrl() {
        // Usar servidor externo GCP para todos os ambientes
        return 'https://backend-gcp-278491073220.us-east1.run.app/api/academy';
    },

    logoConfig: {

        googleDriveId: null,

        fallbackIcon: 'bx-book-bookmark'

    },

    appConfig: {},

    // Variáveis para armazenar resultado do quiz
    quizResult: null,
    certificateUrl: null,

    // Configuração do Google Apps Script para Quiz
    appsScriptConfig: {
        scriptUrl: 'https://script.google.com/macros/s/AKfycbyLR1pyRoBjSivGP5xrDTD7DZeJCCpKF868qlSaKZC1u3srLIMJkwiQ5R8RZpD_tsCqCQ/exec'
    },

    // Função para verificar se o usuário é Lucas Gravina (desenvolvedor)
    isDeveloperUser() {
        try {
            const userData = this.getAuthenticatedUserData();
            const isLucasGravina = userData.email === 'lucas.gravina@velotax.com.br' || 
                                  userData.name.toLowerCase().includes('lucas gravina');
            return isLucasGravina;
        } catch (error) {
            return false; // Se não conseguir obter dados, não é desenvolvedor
        }
    },

    // Função para log seguro (só mostra dados sensíveis para desenvolvedor)
    secureLog(message, sensitiveData = null, logLevel = 'log') {
        if (this.isDeveloperUser()) {
            // Desenvolvedor: logs completos com dados sensíveis
            console[logLevel](message, sensitiveData);
        } else {
            // Usuário comum: logs sanitizados SEM dados sensíveis
            if (sensitiveData && typeof sensitiveData === 'object') {
                const sanitizedData = this.sanitizeSensitiveData(sensitiveData);
                console[logLevel](message, sanitizedData);
            } else {
                console[logLevel](message);
            }
        }
    },

    // Função para sanitizar dados sensíveis
    sanitizeSensitiveData(data) {
        if (!data || typeof data !== 'object') return data;
        
        const sanitized = { ...data };
        
        // Remover respostas corretas de questões
        if (sanitized.questions && Array.isArray(sanitized.questions)) {
            sanitized.questions = sanitized.questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                // correctAnswer removido para usuários comuns
            }));
        }
        
        // Remover respostas corretas de questão individual
        if (sanitized.correctAnswer !== undefined) {
            delete sanitized.correctAnswer;
        }
        
        // Remover respostas do usuário
        if (sanitized.userAnswers) {
            sanitized.userAnswers = '[DADOS SENSÍVEIS OCULTADOS]';
        }
        
        // Remover pontuação detalhada
        if (sanitized.score !== undefined) {
            sanitized.score = '[OCULTO]';
        }
        if (sanitized.finalGrade !== undefined) {
            sanitized.finalGrade = '[OCULTO]';
        }
        if (sanitized.passingScore !== undefined) {
            sanitized.passingScore = '[OCULTO]';
        }
        
        // Remover mapeamento de opções
        if (sanitized.optionMappings) {
            sanitized.optionMappings = '[OCULTO]';
        }
        
        return sanitized;
    },

    // Função para log de pontuação segura
    secureScoreLog(message, scoreData) {
        if (this.isDeveloperUser()) {
            console.log(message, scoreData);
        } else {
            console.log(message, '[DADOS DE PONTUAÇÃO OCULTADOS POR SEGURANÇA]');
        }
    },

    // Função para testar CORS via JSONP
    testCORS() {
        return new Promise((resolve, reject) => {
            console.log('=== TESTANDO CORS VIA JSONP ===');
            
            const callbackName = 'corsTestCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            console.log('CORS test callback name:', callbackName);
            
            // Criar função de callback global
            window[callbackName] = (data) => {
                console.log('Resposta do teste CORS:', data);
                
                // Limpar callback e script
                document.head.removeChild(script);
                delete window[callbackName];
                
                if (data && data.status === 'success') {
                    console.log('✅ CORS funcionando via JSONP!');
                    resolve(data);
                } else {
                    console.error('❌ Erro no teste CORS:', data?.error);
                    reject(new Error(data?.error || 'Erro no teste CORS'));
                }
            };
            
            // Criar script tag para JSONP
            const script = document.createElement('script');
            const url = `${this.appsScriptConfig.scriptUrl}?action=testCORS&callback=${callbackName}`;
            console.log('URL teste CORS:', url);
            
            script.src = url;
            script.onerror = () => {
                console.error('❌ Erro ao carregar script de teste CORS');
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('Erro ao testar CORS via JSONP'));
            };
            
            document.head.appendChild(script);
        });
    },

    // Dados do quiz atual
    currentQuiz: null,

    // Função para carregar quiz do Google Apps Script via JSONP
    loadQuizFromAppsScript(courseId) {
        return new Promise((resolve, reject) => {
            console.log('=== INICIANDO CARREGAMENTO DO QUIZ VIA JSONP ===');
            console.log('Course ID:', courseId);
            console.log('Apps Script URL:', this.appsScriptConfig.scriptUrl);
            
            const callbackName = 'quizCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            console.log('Callback name:', callbackName);
            
            // Criar função de callback global
            window[callbackName] = (data) => {
                console.log('Resposta recebida via JSONP:', data);
                
                // Limpar callback e script
                document.head.removeChild(script);
                delete window[callbackName];
                
                if (data && data.success === true && data.quiz) {
                    this.secureLog('Status de sucesso confirmado via JSONP');
                    this.secureLog('Quiz recebido:', data.quiz);
                    this.secureLog('Perguntas recebidas:', data.quiz.questions);
                    this.secureLog('Nota de aprovação:', data.quiz.passingScore);
                    
                    // Verificar se as perguntas têm as respostas corretas válidas
                    const hasValidAnswers = data.quiz.questions.every(q => 
                        q.correctAnswer !== undefined && 
                        q.correctAnswer >= 0 && 
                        q.correctAnswer <= 3
                    );
                    this.secureLog('Perguntas têm respostas corretas válidas:', hasValidAnswers);
                    
                    if (!hasValidAnswers) {
                        console.warn('Apps Script não retornou respostas corretas válidas, usando fallback');
                        // Usar fallback: assumir que a primeira opção é sempre a correta
                        data.quiz.questions.forEach(q => {
                            if (q.correctAnswer === -1 || q.correctAnswer === undefined) {
                                q.correctAnswer = 0; // Primeira opção como correta
                                this.secureLog(`Fallback aplicado para questão ${q.id}: resposta correta = 0`);
                            }
                        });
                    }
                    
                    this.currentQuiz = {
                        courseId: courseId,
                        questions: data.quiz.questions,
                        passingScore: data.quiz.passingScore || Math.ceil(data.quiz.questions.length * 0.7), // Fallback: 70% das questões
                        currentQuestion: 0,
                        userAnswers: [],
                        startTime: Date.now(),
                        optionMappings: data.quiz.optionMappings || {} // Mapeamento de opções randomizadas
                    };
                    
                    this.secureLog('Quiz carregado com sucesso via JSONP:', this.currentQuiz);
                    this.secureLog('Mapeamento de opções recebido:', this.currentQuiz.optionMappings);
                    this.showQuizInterface();
                    resolve(true);
                } else {
                    console.error('Status de erro recebido via JSONP:', data?.success);
                    reject(new Error(data?.error || 'Erro desconhecido no servidor'));
                }
            };
            
            // Criar script tag para JSONP
            const script = document.createElement('script');
            const url = `${this.appsScriptConfig.scriptUrl}?action=getQuizJSONP&courseId=${courseId}&callback=${callbackName}`;
            console.log('URL JSONP:', url);
            
            script.src = url;
            script.onerror = () => {
                console.error('Erro ao carregar script JSONP');
                document.head.removeChild(script);
                delete window[callbackName];
                reject(new Error('Erro ao carregar quiz via JSONP'));
            };
            
            document.head.appendChild(script);
        });
    },



    // Função para iniciar o quiz
    startQuiz(courseId) {
        console.log('Iniciando quiz para:', courseId);
        this.loadQuizFromAppsScript(courseId);
    },

    // Função para mostrar a interface do quiz
    showQuizInterface() {
        if (!this.currentQuiz) {
            console.error('Nenhum quiz carregado');
            return;
        }

        // Mudar para a view do quiz
        this.switchView('quiz-view');

        // Renderizar a primeira pergunta
        this.renderCurrentQuestion();
    },

    // Função para renderizar a pergunta atual
    renderCurrentQuestion() {
        const quizView = document.getElementById('quiz-view');
        if (!quizView || !this.currentQuiz) return;

        const question = this.currentQuiz.questions[this.currentQuiz.currentQuestion];
        const questionNumber = this.currentQuiz.currentQuestion + 1;
        const totalQuestions = this.currentQuiz.questions.length;

        this.secureLog(`Renderizando questão ${questionNumber}:`, question);
        this.secureLog(`Resposta correta da questão ${questionNumber}:`, question.correctAnswer);

        quizView.innerHTML = `
            <div class="quiz-header">
                <h2>Quiz - ${this.getCourseTitle(this.currentQuiz.courseId)}</h2>
                <div class="quiz-info">
                    <span>Pergunta ${questionNumber} de ${totalQuestions}</span>
                </div>
            </div>
            
            <div class="quiz-question">
                <h3>${question.question}</h3>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <div class="quiz-option" onclick="veloAcademyApp.selectAnswer(${index})">
                            <span class="option-text">${option}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="quiz-navigation">
                ${this.currentQuiz.currentQuestion > 0 ? 
                    `<button class="btn-secondary" onclick="veloAcademyApp.previousQuestion()">Anterior</button>` : 
                    '<div></div>'
                }
                ${this.currentQuiz.currentQuestion < totalQuestions - 1 ? 
                    `<button class="btn-primary" onclick="veloAcademyApp.nextQuestion()">Próxima</button>` : 
                    `<button class="btn-primary" onclick="veloAcademyApp.finishQuiz()">Finalizar Quiz</button>`
                }
            </div>
        `;
    },

    // Função para selecionar uma resposta
    selectAnswer(answerIndex) {
        if (!this.currentQuiz) return;

        this.secureLog(`Selecionando resposta ${answerIndex} para questão ${this.currentQuiz.currentQuestion + 1}`);

        // Salvar a resposta do usuário
        this.currentQuiz.userAnswers[this.currentQuiz.currentQuestion] = answerIndex;

        console.log('Respostas atualizadas:', this.currentQuiz.userAnswers);

        // Marcar visualmente a opção selecionada
        const options = document.querySelectorAll('.quiz-option');
        options.forEach((option, index) => {
            option.classList.remove('selected');
            if (index === answerIndex) {
                option.classList.add('selected');
            }
        });
    },

    // Função para ir para a próxima pergunta
    nextQuestion() {
        if (!this.currentQuiz || this.currentQuiz.currentQuestion >= this.currentQuiz.questions.length - 1) {
            return;
        }

        this.currentQuiz.currentQuestion++;
        this.renderCurrentQuestion();
    },

    // Função para ir para a pergunta anterior
    previousQuestion() {
        if (!this.currentQuiz || this.currentQuiz.currentQuestion <= 0) {
            return;
        }

        this.currentQuiz.currentQuestion--;
        this.renderCurrentQuestion();
    },

    // Função para finalizar o quiz
    async finishQuiz() {
        if (!this.currentQuiz) return;

        // Verificar se todas as perguntas foram respondidas
        const unansweredQuestions = this.currentQuiz.userAnswers.filter(answer => answer === undefined || answer === null).length;
        if (unansweredQuestions > 0) {
            if (!confirm(`Você tem ${unansweredQuestions} pergunta(s) não respondida(s). Deseja finalizar mesmo assim?`)) {
                return;
            }
        }

        // Calcular resultado e enviar UMA VEZ para o backend
        try {
            await this.submitQuizToAppsScript();
            // Mostrar resultado local após envio bem-sucedido
            this.showQuizResult();
        } catch (error) {
            console.error('Erro ao enviar quiz:', error);
            // Em caso de erro, mostrar resultado local mesmo assim
            this.showQuizResult();
        }
    },

    // Função para enviar quiz para o Apps Script
    submitQuizToAppsScript() {
        return new Promise((resolve, reject) => {
            try {
                const userData = this.getAuthenticatedUserData();
                const courseId = this.currentQuiz.courseId;
                
                // Calcular pontuação
                let score = 0;
                this.currentQuiz.questions.forEach((question, index) => {
                    if (this.currentQuiz.userAnswers[index] === question.correctAnswer) {
                        score++;
                    }
                });
                
                const totalQuestions = this.currentQuiz.questions.length;
                const finalGrade = (score / totalQuestions) * 10;
                const passingScore = this.currentQuiz.passingScore || Math.ceil(totalQuestions * 0.7);
                const isReproved = score < passingScore;
                
                // Calcular questões erradas
                const wrongQuestions = this.calculateWrongQuestions();
                
                // Preparar dados para envio (formato simplificado)
                const formData = new FormData();
                formData.append('action', 'submitResult');
                formData.append('name', userData.name);
                formData.append('email', userData.email);
                formData.append('courseId', courseId);
                formData.append('approved', (!isReproved).toString());
                formData.append('finalGrade', finalGrade.toString());
                
                // Adicionar questões erradas se houver
                if (wrongQuestions.length > 0) {
                    formData.append('wrongQuestions', JSON.stringify(wrongQuestions));
                }
                
                // Enviar dados
                fetch(this.appsScriptConfig.scriptUrl, {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.text())
                .then(data => {
                    // Armazenar resultado para uso posterior
                    this.quizResult = {
                        score,
                        totalQuestions,
                        finalGrade,
                        passingScore,
                        isReproved,
                        wrongQuestions,
                        response: data
                    };
                    
                    if (!isReproved) {
                        // Para aprovados, extrair URL do certificado
                        const match = data.match(/url=([^"'\s]+)/);
                        if (match) {
                            this.certificateUrl = match[1];
                        }
                    }
                    resolve(data);
                })
                .catch(error => {
                    console.error('Erro ao enviar quiz:', error);
                    reject(error);
                });
                
            } catch (error) {
                console.error('Erro ao processar quiz:', error);
                
                // Verificar se é erro de autenticação
                if (error.message.includes('não está autenticado') || error.message.includes('não autorizado')) {
                    alert('Erro de autenticação: ' + error.message + '\n\nRedirecionando para login...');
                    // Limpar dados inválidos e redirecionar
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userPicture');
                    localStorage.removeItem('dadosAtendenteChatbot');
                    setTimeout(() => {
                        window.location.href = './index.html';
                    }, 2000);
                    return;
                }
                
                reject(error);
            }
        });
    },

    // Função auxiliar para calcular questões erradas
    calculateWrongQuestions() {
        if (!this.currentQuiz) return [];
        
        const wrongQuestions = [];
        this.currentQuiz.questions.forEach((question, index) => {
            if (this.currentQuiz.userAnswers[index] !== question.correctAnswer) {
                wrongQuestions.push(index + 1);
            }
        });
        
        return wrongQuestions;
    },

    // Função para mostrar resultado do quiz
    showQuizResult() {
        if (!this.quizResult) {
            // Se não há resultado armazenado, calcular localmente
            this.calculateAndShowResult();
            return;
        }
        
        const { score, totalQuestions, finalGrade, passingScore, isReproved } = this.quizResult;
        const quizView = document.getElementById('quiz-view');
        if (!quizView) return;

        const resultClass = isReproved ? 'failed' : 'passed';
        const resultText = isReproved ? 'REPROVADO' : 'APROVADO';
        const resultMessage = isReproved 
            ? `Você acertou ${score} de ${totalQuestions} questões. É necessário acertar pelo menos ${passingScore} questões para aprovação.` 
            : 'Parabéns! Você foi aprovado no quiz.';

        // Calcular questões erradas para aprovados
        let wrongQuestionsSection = '';
        if (!isReproved && this.currentQuiz) {
            const wrongQuestions = this.calculateWrongQuestions();
            if (wrongQuestions.length > 0) {
                const wrongQuestionsList = wrongQuestions.map(qNum => {
                    const question = this.currentQuiz.questions[qNum - 1];
                    return `<li>Questão ${qNum}: ${question.question}</li>`;
                }).join('');
                
                wrongQuestionsSection = `
                    <div class="wrong-questions-section">
                        <h3>Questões para Revisão</h3>
                        <p>Você acertou ${score} de ${totalQuestions} questões. Abaixo estão as questões que você errou para revisão:</p>
                        <ul class="wrong-questions-list">
                            ${wrongQuestionsList}
                        </ul>
                    </div>
                `;
            }
        }

        const resultHTML = `
            <div class="quiz-results ${resultClass}">
                <div class="result-header">
                    <h2>Resultado</h2>
                    <div class="result-image">
                        <img src="./Public/${isReproved ? 'reprovado' : 'aprovado'}.png" alt="${resultText}" class="result-status-image">
                        <div class="result-subtitle">
                            <span class="status ${resultClass}">${resultText}</span>
                        </div>
                    </div>
                    <div class="result-score">
                        <div class="score-circle">
                            <span class="score-number">${finalGrade.toFixed(1)}</span>
                            <span class="score-max">/ 10</span>
                        </div>
                    </div>
                </div>
                ${wrongQuestionsSection}
                <div class="result-actions">
                    ${isReproved ? 
                        `<button class="btn-primary" onclick="veloAcademyApp.returnToCourse()">Voltar ao Curso</button>` :
                        `<button class="btn-primary" onclick="veloAcademyApp.generateCertificate()">Receber Certificado</button>`
                    }
                </div>
            </div>
        `;

        quizView.innerHTML = resultHTML;
        this.switchView('quiz-view');
    },

    // Função auxiliar para calcular resultado local (fallback)
    calculateAndShowResult() {
        if (!this.currentQuiz) return;

        let score = 0;
        this.currentQuiz.questions.forEach((question, index) => {
            if (this.currentQuiz.userAnswers[index] === question.correctAnswer) {
                score++;
            }
        });

        const totalQuestions = this.currentQuiz.questions.length;
        const finalGrade = (score / totalQuestions) * 10;
        const passingScore = this.currentQuiz.passingScore || Math.ceil(totalQuestions * 0.7);
        const isReproved = score < passingScore;

        // Armazenar resultado
        this.quizResult = {
            score,
            totalQuestions,
            finalGrade,
            passingScore,
            isReproved,
            wrongQuestions: this.calculateWrongQuestions()
        };

        // Mostrar resultado
        this.showQuizResult();
    },

    // Função para processar quiz localmente (fallback)
    processQuizLocally() {
        console.log('=== PROCESSANDO QUIZ LOCALMENTE ===');
        if (!this.currentQuiz) {
            console.error('Nenhum quiz carregado para processar');
            return;
        }

        this.secureLog('Respostas do usuário:', this.currentQuiz.userAnswers);
        this.secureLog('Perguntas do quiz:', this.currentQuiz.questions);

        // Calcular pontuação
        let score = 0;
        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.currentQuiz.userAnswers[index];
            const correctAnswer = question.correctAnswer;
            
            this.secureLog(`Questão ${index + 1}:`);
            this.secureLog(`  - Resposta do usuário: ${userAnswer}`);
            this.secureLog(`  - Resposta correta: ${correctAnswer}`);
            this.secureLog(`  - Acertou: ${userAnswer === correctAnswer}`);
            
            if (userAnswer === correctAnswer) {
                score++;
            }
        });

        const totalQuestions = this.currentQuiz.questions.length;
        const finalGrade = (score / totalQuestions) * 10;
        const passingScore = this.currentQuiz.passingScore;

        this.secureScoreLog('Pontuação calculada:', { score, totalQuestions, finalGrade, passingScore });

        // Mostrar resultado
        this.showLocalQuizResult(score, finalGrade, passingScore, totalQuestions);
    },

    // Função para mostrar resultado local
    showLocalQuizResult(score, finalGrade, passingScore, totalQuestions) {
        console.log('=== MOSTRANDO RESULTADO LOCAL ===');
        const quizView = document.getElementById('quiz-view');
        if (!quizView) {
            console.error('Elemento quiz-view não encontrado');
            return;
        }

        console.log('Elemento quiz-view encontrado, atualizando conteúdo...');

        const isPassed = score >= passingScore;
        const resultClass = isPassed ? 'passed' : 'failed';
        const resultText = isPassed ? 'APROVADO' : 'REPROVADO';
        const resultMessage = isPassed 
            ? 'Parabéns! Você foi aprovado no quiz.' 
            : `Você acertou ${score} de ${totalQuestions} questões. É necessário acertar pelo menos ${passingScore} questões para aprovação.`;

        // Calcular questões erradas para aprovados
        let wrongQuestionsSection = '';
        if (isPassed && this.currentQuiz) {
            const wrongQuestions = this.calculateWrongQuestions();
            if (wrongQuestions.length > 0) {
                const wrongQuestionsList = wrongQuestions.map(qNum => {
                    const question = this.currentQuiz.questions[qNum - 1];
                    return `<li>Questão ${qNum}: ${question.question}</li>`;
                }).join('');
                
                wrongQuestionsSection = `
                    <div class="wrong-questions-section">
                        <h3>Questões para Revisão</h3>
                        <p>Você acertou ${score} de ${totalQuestions} questões. Abaixo estão as questões que você errou para revisão:</p>
                        <ul class="wrong-questions-list">
                            ${wrongQuestionsList}
                        </ul>
                    </div>
                `;
            }
        }

        const resultHTML = `
            <div class="quiz-results ${resultClass}">
                <div class="result-header">
                    <h2>Resultado</h2>
                    <div class="result-image">
                        <img src="./Public/${isPassed ? 'aprovado' : 'reprovado'}.png" alt="${resultText}" class="result-status-image">
                        <div class="result-subtitle">
                            <span class="status ${resultClass}">${resultText}</span>
                        </div>
                    </div>
                    <div class="result-score">
                        <div class="score-circle">
                            <span class="score-number">${finalGrade.toFixed(1)}</span>
                            <span class="score-max">/ 10</span>
                        </div>
                    </div>
                </div>
                ${wrongQuestionsSection}
                <div class="result-actions">
                    ${isPassed ? 
                        `<button class="btn-primary" onclick="veloAcademyApp.generateCertificate()">Receba o Certificado</button>` :
                        `<button class="btn-primary" onclick="veloAcademyApp.returnToCourse()">Voltar ao Curso</button>`
                    }
                </div>
            </div>
        `;

        console.log('HTML do resultado gerado, aplicando ao DOM...');
        quizView.innerHTML = resultHTML;
        console.log('Resultado aplicado com sucesso');
        
        // Garantir que a view do quiz esteja ativa
        this.switchView('quiz-view');
    },

    // Função para voltar ao curso
    returnToCourse() {
        // Limpar dados do quiz
        this.currentQuiz = null;
        this.quizResult = null;
        this.certificateUrl = null;
        
        // Voltar para a visualização do curso
        this.switchView('course-view');
    },

    // Função para obter dados completos do usuário logado
    getAuthenticatedUserData() {
        console.log('=== OBTENDO DADOS DO USUÁRIO AUTENTICADO ===');
        
        // Tentar obter dados do localStorage
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        const userPicture = localStorage.getItem('userPicture');
        
        // Tentar obter dados do objeto salvo no chatbot
        let dadosCompletos = null;
        try {
            const dadosSalvosString = localStorage.getItem('dadosAtendenteChatbot');
            if (dadosSalvosString) {
                dadosCompletos = JSON.parse(dadosSalvosString);
            }
        } catch (e) {
            console.warn('Erro ao parsear dados do usuário:', e);
        }
        
        // Validar se o usuário está realmente logado
        if (!userName || !userEmail) {
            throw new Error('Usuário não está autenticado. Faça login novamente.');
        }
        
        // Verificar se o email é do domínio autorizado
        if (!userEmail.endsWith('@velotax.com.br')) {
            throw new Error('Email não autorizado para emissão de certificado.');
        }
        
        // Usar dados mais completos se disponíveis
        const userData = {
            name: dadosCompletos?.nome || userName,
            email: dadosCompletos?.email || userEmail,
            picture: dadosCompletos?.picture || userPicture,
            timestamp: dadosCompletos?.timestamp || Date.now()
        };
        
        console.log('Dados do usuário autenticado:', userData);
        return userData;
    },

    // Função para gerar certificado
    async generateCertificate() {
        if (this.certificateUrl) {
            // Se já temos a URL do certificado, abrir diretamente
            window.open(this.certificateUrl, '_blank');
        } else {
            // Se não temos, gerar nova URL
            try {
                const userData = this.getAuthenticatedUserData();
                const { score, totalQuestions, finalGrade } = this.quizResult;
                
                const url = `${this.appsScriptConfig.scriptUrl}?action=downloadCertificate&name=${encodeURIComponent(userData.name)}&email=${encodeURIComponent(userData.email)}&courseId=${this.currentQuiz.courseId}&score=${score}&totalQuestions=${totalQuestions}&finalGrade=${finalGrade}`;
                
                window.open(url, '_blank');
            } catch (error) {
                console.error('Erro ao gerar certificado:', error);
                alert('Erro ao gerar certificado. Tente novamente.');
            }
        }
        
        // Voltar ao curso após gerar certificado
        setTimeout(() => {
            this.returnToCourse();
        }, 2000);
    },



    // Função auxiliar para obter o título do curso
    getCourseTitle(courseId) {
        // Mapeamento específico para IDs de quiz
        const quizTitles = {
            'pix': 'PIX: Normas e Segurança',
            'credito': 'Crédito do Trabalhador: Análise e Concessão',
            'creditoPessoal': 'Crédito Pessoal',
            'seguroPrestaCt': 'Seguro Prestamista'
        };
        
        // Se for um quiz, usar o mapeamento
        if (quizTitles[courseId]) {
            return quizTitles[courseId];
        }
        
        // Caso contrário, buscar no banco de dados de cursos
        const course = this.courseDatabase[courseId];
        return course ? course.title : 'Curso';
    },

    async init() {
        console.log('=== Inicializando VeloAcademy app ===');
        
        await this.loadConfig();
        console.log('Config loaded');

        await this.loadCourses();
        console.log('Courses loaded:', this.courseDatabase);

        // Carregar progresso do usuário se autenticado
        if (typeof ProgressTracker !== 'undefined') {
            await ProgressTracker.loadUserProgress();
            console.log('User progress loaded');
        }

        // Renderizar cursos apenas se houver cursos carregados
        // Se houver erro, showMongoDBError() já definiu o conteúdo
        if (Object.keys(this.courseDatabase).length > 0) {
            this.renderCourses();
            console.log('Courses rendered');
        } else {
            console.log('No courses loaded - error message should be displayed');
        }

        this.initTheme();
        console.log('Theme initialized');

        this.initLogo();
        console.log('Logo initialized');

        this.initLogout();
        console.log('Logout initialized');
        
        // Aguardar um pouco para garantir que auth.js foi carregado
        setTimeout(() => {
            if (typeof checkAuthenticationState === 'function') {
                checkAuthenticationState();
                console.log('Estado de autenticação verificado');
            } else {
                console.error('Função checkAuthenticationState não encontrada - auth.js pode não ter carregado');
                // Fallback: tentar novamente após mais tempo
                setTimeout(() => {
                    if (typeof checkAuthenticationState === 'function') {
                        checkAuthenticationState();
                        console.log('Estado de autenticação verificado (tentativa 2)');
                    } else {
                        console.error('auth.js ainda não carregado após 500ms');
                    }
                }, 400);
            }
        }, 200);
        
        // Criar estrutura HTML do modal YouTube
        this.createYouTubeModal();
        
        console.log('=== VeloAcademy app inicializado com sucesso ===');
    },

    // Variáveis para controle de múltiplos vídeos
    currentVideoSequence: null,
    currentVideoIndex: 0,
    videoSequenceMetadata: null, // { courseId, moduleId, subtitle }
    
    // Variáveis para controle de PDF
    currentPDF: null,
    currentPDFPage: 1,
    totalPDFPages: 0,
    pdfMetadata: null, // { subtitle, lessonTitle, pdfUrl }
    
    // Variáveis para controle de Aula (Slides/Imagens)
    currentAulaSlides: null,
    currentAulaMetadata: null, // { subtitle, lessonTitle, slidesUrl }
    
    // Variáveis para controle de vídeo Google Drive
    googleDriveVideoMetadata: null, // { subtitle, lessonTitle, videoUrl, courseId, moduleId }

    // Função para criar estrutura HTML do modal YouTube dinamicamente
    createYouTubeModal() {
        // Verificar se o modal já existe
        if (document.getElementById('youtube-modal-overlay')) {
            return;
        }
        
        // Criar overlay e container do modal
        const modalHTML = `
            <div class="youtube-modal-overlay" id="youtube-modal-overlay">
                <div class="youtube-modal-container">
                    <div class="youtube-modal-header">
                        <h3 id="youtube-modal-title">Título do Vídeo</h3>
                        <button class="youtube-modal-close" onclick="veloAcademyApp.closeYouTubeModal()" aria-label="Fechar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="youtube-modal-body">
                        <iframe 
                            id="youtube-player" 
                            src="" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="youtube-modal-footer" id="youtube-modal-footer">
                        <button class="btn btn-secondary youtube-btn-prev" id="youtube-btn-prev" onclick="veloAcademyApp.previousVideo()" disabled>
                            <i class="fas fa-arrow-left"></i> Voltar
                        </button>
                        <div class="youtube-modal-progress">
                            <div class="youtube-progress-bar">
                                <div class="youtube-progress-fill" id="youtube-progress-fill"></div>
                            </div>
                            <span id="youtube-video-counter">1 / 1</span>
                        </div>
                        <button class="btn btn-primary youtube-btn-next" id="youtube-btn-next" onclick="veloAcademyApp.nextVideo()" disabled>
                            Próximo <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="btn btn-success youtube-btn-finish" id="youtube-btn-finish" onclick="veloAcademyApp.finishVideoSequence()" style="display: none;" disabled>
                            Finalizar <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Adicionar event listener para fechar ao clicar no overlay
        const overlay = document.getElementById('youtube-modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeYouTubeModal();
            }
        });
        
        // Adicionar event listener para fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                this.closeYouTubeModal();
            }
        });
        
        // Carregar YouTube IFrame API para detecção de fim de vídeo
        this.loadYouTubeAPI();
    },
    
    // Carregar YouTube IFrame API
    loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
            return; // API já carregada
        }
        
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // Callback quando API estiver pronta
        window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube IFrame API carregada');
        };
    },
    
    // Criar player YouTube para detecção de eventos
    createYouTubePlayer(videoId) {
        const iframe = document.getElementById('youtube-player');
        if (!iframe) return null;
        
        // Usar YouTube IFrame API se disponível
        if (window.YT && window.YT.Player) {
            return new window.YT.Player('youtube-player', {
                videoId: videoId,
                events: {
                    'onStateChange': (event) => {
                        // 0 = ENDED (vídeo terminou)
                        if (event.data === 0) {
                            this.onVideoEnded();
                        }
                    }
                }
            });
        }
        
        return null;
    },
    
    // Callback quando vídeo termina
    onVideoEnded() {
        console.log('Vídeo terminou, habilitando botão de navegação');
        const nextBtn = document.getElementById('youtube-btn-next');
        const finishBtn = document.getElementById('youtube-btn-finish');
        
        // Verificar se é o último vídeo
        const isLastVideo = this.currentVideoSequence && 
                           this.currentVideoIndex === this.currentVideoSequence.length - 1;
        
        if (isLastVideo) {
            // Se for o último vídeo, habilitar botão Finalizar
            console.log('Último vídeo terminou, habilitando botão Finalizar');
            if (finishBtn) {
                finishBtn.disabled = false;
            }
            if (nextBtn) {
                nextBtn.style.display = 'none';
            }
        } else {
            // Se não for o último vídeo, habilitar botão Próximo
            console.log('Vídeo intermediário terminou, habilitando botão Próximo');
            if (nextBtn) {
                nextBtn.disabled = false;
            }
            if (finishBtn) {
                finishBtn.style.display = 'none';
            }
        }
        
        // Não marcar vídeo individual como completo aqui
        // Apenas marcar "Aula em vídeo" quando finalizar toda a sequência em finishVideoSequence()
    },

    async loadConfig() {

        try {

            const response = await fetch('./config.json');

            if (response.ok) {

                this.appConfig = await response.json();

                this.logoConfig = this.appConfig.logo || this.logoConfig;

            }

        } catch (error) {

            console.warn('Erro ao carregar configurações, usando padrões:', error);

        }

    },

    initLogo() {

        if (this.logoConfig.localPath) {

            this.loadLocalLogo();

        } else if (this.logoConfig.googleDriveId && this.logoConfig.googleDriveId !== '1ABC123DEF456') {

            this.loadLogoFromGoogleDrive();

        }

    },

    loadLocalLogo() {

        const logoImage = document.getElementById('logo-image');

        const logoIcon = document.getElementById('logo-icon');

        

        // Criar nova imagem para testar se carrega

        const testImage = new Image();

        

        testImage.onload = () => {

            // Se a imagem carregou com sucesso, mostrar ela

            logoImage.src = this.logoConfig.localPath;

            logoImage.style.display = 'block';

            logoIcon.style.display = 'none';

            

            // Aplicar dimensões personalizadas se configuradas

            if (this.logoConfig.width) {

                logoImage.style.width = this.logoConfig.width;

            }

            if (this.logoConfig.height) {

                logoImage.style.height = this.logoConfig.height;

            }

        };

        

        testImage.onerror = () => {

            // Se falhou, manter o ícone

            console.warn('Falha ao carregar logo local, usando ícone de fallback');

            logoImage.style.display = 'none';

            logoIcon.style.display = 'block';

        };

        

        testImage.src = this.logoConfig.localPath;

    },

    loadLogoFromGoogleDrive() {

        const logoImage = document.getElementById('logo-image');

        const logoIcon = document.getElementById('logo-icon');

        

        // URL do Google Drive para visualização direta

        const googleDriveUrl = `https://drive.google.com/uc?export=view&id=${this.logoConfig.googleDriveId}`;

        

        // Criar nova imagem para testar se carrega

        const testImage = new Image();

        

        testImage.onload = () => {

            // Se a imagem carregou com sucesso, mostrar ela

            logoImage.src = googleDriveUrl;

            logoImage.style.display = 'block';

            logoIcon.style.display = 'none';

            

            // Aplicar dimensões personalizadas se configuradas

            if (this.logoConfig.width) {

                logoImage.style.width = this.logoConfig.width;

            }

            if (this.logoConfig.height) {

                logoImage.style.height = this.logoConfig.height;

            }

        };

        

        testImage.onerror = () => {

            // Se falhou, manter o ícone

            console.warn('Falha ao carregar logo do Google Drive, usando ícone de fallback');

            logoImage.style.display = 'none';

            logoIcon.style.display = 'block';

        };

        

        testImage.src = googleDriveUrl;

    },

    // Função para transformar dados MongoDB para formato do courseDatabase
    transformMongoDBToCourseDatabase(mongoCourses) {
        const transformed = {};
        
        mongoCourses.forEach(course => {
            // cursoNome é usado diretamente como título exibido
            transformed[course.cursoNome] = {
                title: course.cursoNome, // cursoNome é o título exibido
                description: course.cursoDescription || "",    // Fallback se não existir
                cursoClasse: course.cursoClasse || 'Curso', // Classe do curso (Essencial, Atualização, etc.)
                modules: course.modules
                    .filter(m => m.isActive)
                    .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
                    .map(module => ({
                        title: module.moduleNome,
                        sections: module.sections
                            .filter(s => s.isActive)
                            .sort((a, b) => (a.temaOrder || 0) - (b.temaOrder || 0))
                            .map(section => ({
                                subtitle: section.temaNome,
                                hasQuiz: section.hasQuiz || false, // Preservar hasQuiz do MongoDB
                                quizId: section.quizId || null, // Preservar quizId do MongoDB
                                lessons: section.lessons
                                    .filter(l => {
                                        if (!l.isActive) {
                                            console.log(`⚠️ Aula filtrada (isActive=false): ${l.lessonTitulo} (ID: ${l.lessonId})`);
                                        }
                                        return l.isActive;
                                    })
                                    .sort((a, b) => (a.lessonOrdem || 0) - (b.lessonOrdem || 0))
                                    .map(lesson => {
                                        // lessonContent é um ARRAY - processar todas as URLs
                                        const contentUrls = lesson.lessonContent && lesson.lessonContent.length > 0 
                                            ? lesson.lessonContent.map(c => c.url).filter(url => url && url !== '#')
                                            : [];
                                        
                                        // Se houver múltiplas URLs, armazenar todas para sequência de vídeos
                                        const filePath = contentUrls[0] || null; // Primeira URL para compatibilidade
                                        const allUrls = contentUrls.length > 1 ? contentUrls : null; // Todas as URLs se houver múltiplas
                                        
                                        // Log se não houver filePath mas houver lessonContent
                                        if (!filePath && lesson.lessonContent && lesson.lessonContent.length > 0) {
                                            console.warn(`⚠️ Aula sem filePath válido:`, {
                                                lessonId: lesson.lessonId,
                                                lessonTitulo: lesson.lessonTitulo,
                                                lessonContent: lesson.lessonContent,
                                                contentUrls: contentUrls
                                            });
                                        }
                                        
                                        return {
                                            id: lesson.lessonId,
                                            title: lesson.lessonTitulo,
                                            type: lesson.lessonTipo,
                                            duration: lesson.duration || "",
                                            filePath: filePath,
                                            allUrls: allUrls, // Array com todas as URLs se houver múltiplas
                                            driveId: lesson.driveId || null
                                        };
                                    })
                            }))
                    }))
            };
        });
        
        return transformed;
    },

    async loadCourses() {
        // Verificar cache primeiro (apenas se for do MongoDB)
        if (this.courseDatabaseCache && 
            this.courseDatabaseCache.timestamp && 
            Date.now() - this.courseDatabaseCache.timestamp < this.courseDatabaseCache.ttl &&
            this.courseDatabaseCache.source === 'mongodb') {
            this.courseDatabase = this.courseDatabaseCache.data;
            console.log('📦 Usando cache de cursos (MongoDB)');
            console.log('📦 Cache criado há:', Math.round((Date.now() - this.courseDatabaseCache.timestamp) / 1000), 'segundos');
            this.hideMongoDBError();
            return;
        }
        
        // Tentar MongoDB via servidor externo (única fonte)
        try {
            const apiUrl = `${this.getApiBaseUrl()}/cursos-conteudo/active`;
            console.log('🔗 Carregando cursos de:', apiUrl);
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            // O endpoint pode retornar diretamente um array ou um objeto com propriedade courses/data
            let courses = [];
            if (Array.isArray(result)) {
                courses = result;
            } else if (result.courses && Array.isArray(result.courses)) {
                courses = result.courses;
            } else if (result.data && Array.isArray(result.data)) {
                courses = result.data;
            } else if (result.success && result.courses && Array.isArray(result.courses)) {
                courses = result.courses;
            }
            
            if (courses.length > 0) {
                console.log('📚 Cursos recebidos do MongoDB:', courses.length);
                
                // Log detalhado de cada curso e suas aulas
                courses.forEach(course => {
                    const totalLessons = course.modules?.reduce((total, module) => {
                        return total + (module.sections?.reduce((sectionTotal, section) => {
                            return sectionTotal + (section.lessons?.length || 0);
                        }, 0) || 0);
                    }, 0) || 0;
                    console.log(`   - ${course.cursoNome}: ${course.modules?.length || 0} módulos, ${totalLessons} aulas`);
                });
                
                const transformed = this.transformMongoDBToCourseDatabase(courses);
                this.courseDatabase = transformed;
                
                // Cachear resultado
                this.courseDatabaseCache = {
                    data: transformed,
                    timestamp: Date.now(),
                    ttl: 5 * 60 * 1000,
                    source: 'mongodb'
                };
                
                console.log('✅ Cursos carregados do servidor externo:', courses.length, 'cursos');
                this.hideMongoDBError();
                return;
            } else {
                throw new Error('Nenhum curso encontrado no servidor');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar cursos do servidor externo:', error);
            console.error('❌ URL tentada:', `${this.getApiBaseUrl()}/cursos-conteudo/active`);
            console.error('❌ Verifique se:');
            console.error('   1. O servidor API está rodando (npm run api)');
            console.error('   2. A conexão MongoDB está configurada no servidor');
            console.error('   3. Há cursos ativos no banco de dados');
            // Não usar fallback - MongoDB é obrigatório
            this.courseDatabase = {};
            this.showMongoDBError(error);
            // Não chamar renderCourses() - showMongoDBError() já define o conteúdo
            return;
        }
    },

    // Função para exibir erro quando MongoDB não está disponível
    showMongoDBError(error) {
        // Mostrar mensagem de erro na interface
        const coursesGrid = document.getElementById('courses-grid');
        if (coursesGrid) {
            const errorMessage = error.message || 'Erro desconhecido ao conectar ao banco de dados';
            coursesGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <div style="max-width: 500px; margin: 0 auto;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--error-color, #e74c3c); margin-bottom: 1rem;"></i>
                        <h3 style="margin-bottom: 1rem;">Erro ao carregar cursos</h3>
                        <p style="margin-bottom: 0.5rem;">Não foi possível conectar ao banco de dados MongoDB.</p>
                        <p style="margin-bottom: 1.5rem; color: var(--text-secondary, #666); font-size: 0.9rem;">
                            <small>${errorMessage}</small>
                        </p>
                        <button onclick="veloAcademyApp.retryLoadCourses();" class="btn btn-primary">
                            <i class="fas fa-redo"></i> Tentar Novamente
                        </button>
                    </div>
                </div>
            `;
        }
    },

    // Função para ocultar mensagem de erro
    hideMongoDBError() {
        // Remover mensagem de erro se existir
        const errorMsg = document.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    },

    // Função para tentar carregar cursos novamente (retry)
    async retryLoadCourses() {
        // Limpar cache para forçar recarregamento
        this.courseDatabaseCache = {
            data: {},
            timestamp: null,
            ttl: 5 * 60 * 1000,
            source: null
        };
        
        // Tentar carregar novamente
        await this.loadCourses();
        
        // Se carregou com sucesso, renderizar cursos
        if (Object.keys(this.courseDatabase).length > 0) {
            this.renderCourses();
        }
    },
    
    // Função para limpar cache e forçar recarregamento (útil para debug)
    async forceReloadCourses() {
        console.log('🔄 Forçando recarregamento de cursos...');
        
        // Limpar cache completamente
        this.courseDatabaseCache = {
            data: {},
            timestamp: null,
            ttl: 5 * 60 * 1000,
            source: null
        };
        
        // Limpar courseDatabase
        this.courseDatabase = {};
        
        // Tentar carregar novamente
        await this.loadCourses();
        
        // Log detalhado para debug
        console.log('📊 Cursos carregados:', Object.keys(this.courseDatabase));
        console.log('📊 Detalhes dos cursos:', this.courseDatabase);
        
        // Se carregou com sucesso, renderizar cursos
        if (Object.keys(this.courseDatabase).length > 0) {
            this.renderCourses();
        } else {
            console.warn('⚠️ Nenhum curso carregado. Verifique:');
            console.warn('   1. Se o servidor API está rodando (npm run api)');
            console.warn('   2. Se a conexão MongoDB está configurada');
            console.warn('   3. Se há cursos ativos no banco de dados');
        }
    },

    // Função de fallback removida - MongoDB é obrigatório
    // loadFallbackCourses() foi removida pois MongoDB é a única fonte de dados

    renderCourses(filterByClass = null) {

        // Renderizar seletor de classe se ainda não existir
        this.renderClassFilter();
        
        const coursesGrid = document.getElementById('courses-grid');
        console.log('Courses grid element:', coursesGrid);
        console.log('Course database:', this.courseDatabase);
        
        if (!coursesGrid) {
            console.error('Courses grid element not found!');
            return;
        }
        
        coursesGrid.innerHTML = '';

        let index = 0;

        for (const courseId in this.courseDatabase) {
            const course = this.courseDatabase[courseId];
            
            // Aplicar filtro por classe se especificado
            if (filterByClass && course.cursoClasse !== filterByClass) {
                continue;
            }

            const card = document.createElement('div');

            card.className = 'course-card';

            card.setAttribute('data-course', courseId);

            card.style.animationDelay = `${index * 100}ms`;

            

            // Calcular estatísticas do curso

            const totalModules = course.modules.length;

            const totalLessons = this.countTotalLessons(course);

            // Usar cursoClasse do MongoDB, ou fallback para getCourseType() se não existir
            const courseType = course.cursoClasse || this.getCourseType(courseId);
            
            // Normalizar cursoClasse para classe CSS (remover acentos e espaços)
            const cursoClasseNormalized = courseType.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/\s+/g, '-'); // Substitui espaços por hífens

            

            card.innerHTML = `

                <h3>${course.title}</h3>

                <p>${course.description}</p>

                <div class="course-meta">

                    <div class="course-stats">

                        <div class="course-stat">

                            <span>${totalModules} módulos</span>

                        </div>

                        <div class="course-stat">

                            <span>${totalLessons} aulas</span>

                        </div>

                    </div>

                    <div class="course-badge badge-${cursoClasseNormalized}">${courseType}</div>

                </div>

            `;

            card.addEventListener('click', (e) => {
                console.log('Card clicado:', courseId);
                console.log('Curso encontrado:', this.courseDatabase[courseId]);
                e.preventDefault();
                e.stopPropagation();
                this.openCourse(courseId);
            });

            coursesGrid.appendChild(card);

            index++;

        }

    },

    // Renderizar seletor de classe (filtro)
    renderClassFilter() {
        const filterContainer = document.getElementById('course-filter-container');
        if (!filterContainer) {
            return;
        }
        
        // Verificar se já foi renderizado
        if (filterContainer.innerHTML.trim() !== '') {
            return;
        }
        
        const classes = [
            { id: 'essencial', label: 'Essencial', color: 'essencial' },
            { id: 'reciclagem', label: 'Reciclagem', color: 'reciclagem' },
            { id: 'opcional', label: 'Opcional', color: 'opcional' },
            { id: 'atualizacao', label: 'Atualização', color: 'atualizacao' }
        ];
        
        let filterHtml = '<div class="course-class-filter">';
        
        classes.forEach((classe) => {
            filterHtml += `
                <button class="class-filter-btn" 
                        data-class="${classe.id}" 
                        data-color="${classe.color}"
                        onclick="veloAcademyApp.filterCoursesByClass('${classe.id}')">
                    ${classe.label}
                </button>
            `;
        });
        
        filterHtml += '</div>';
        filterContainer.innerHTML = filterHtml;
    },

    // Filtrar cursos por classe
    filterCoursesByClass(selectedClass) {
        // Verificar se o botão clicado já está ativo
        const clickedButton = document.querySelector(`.class-filter-btn[data-class="${selectedClass}"]`);
        const isCurrentlyActive = clickedButton && clickedButton.classList.contains('active');
        
        // Se estiver ativo, desativar e mostrar todos os cursos
        if (isCurrentlyActive) {
            const filterButtons = document.querySelectorAll('.class-filter-btn');
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.remove('filter-essencial', 'filter-reciclagem', 'filter-opcional', 'filter-atualizacao');
            });
            this.renderCourses(null); // Mostrar todos os cursos
            return;
        }
        
        // Caso contrário, aplicar o filtro normalmente
        // Atualizar estado visual dos botões
        const filterButtons = document.querySelectorAll('.class-filter-btn');
        filterButtons.forEach(btn => {
            const btnClass = btn.getAttribute('data-class');
            const btnColor = btn.getAttribute('data-color');
            
            // Remover todas as classes de cor e active
            btn.classList.remove('active');
            btn.classList.remove('filter-essencial', 'filter-reciclagem', 'filter-opcional', 'filter-atualizacao');
            
            if (btnClass === selectedClass) {
                // Botão selecionado
                btn.classList.add('active');
                if (btnColor) {
                    // Aplicar cor apenas se não for "Todos"
                    btn.classList.add(`filter-${btnColor}`);
                }
            }
        });
        
        // Renderizar cursos filtrados
        // Converter ID do filtro para valor do cursoClasse
        const classMap = {
            'essencial': 'Essencial',
            'reciclagem': 'Reciclagem',
            'opcional': 'Opcional',
            'atualizacao': 'Atualização'
        };
        this.renderCourses(classMap[selectedClass]);
    },

    countTotalLessons(course) {

        let total = 0;

        course.modules.forEach(module => {

            if (module.sections) {

                module.sections.forEach(section => {

                    total += section.lessons.length;

                });

            } else if (module.lessons) {

                total += module.lessons.length;

            }

        });

        return total;

    },

    getCourseType(courseId) {

        const types = {

            'onboarding': 'Essencial',

            'produtos': 'Essencial',

            'novidades-modificacoes': 'Atualização',

            'cs004': 'Reciclagem',

            'cs003': 'Opcional',

            'operacoes': 'Atualização'

        };

        return types[courseId] || 'Curso';

    },

    estimateCourseDuration(course) {

        let totalMinutes = 0;

        course.modules.forEach(module => {

            if (module.sections) {

                module.sections.forEach(section => {

                    section.lessons.forEach(lesson => {

                        const duration = lesson.duration;

                        if (duration.includes('min')) {

                            totalMinutes += parseInt(duration);

                        } else if (duration.includes('hora')) {

                            totalMinutes += parseInt(duration) * 60;

                        } else {

                            totalMinutes += 15; // Estimativa padrão para leitura

                        }

                    });

                });

            } else if (module.lessons) {

                module.lessons.forEach(lesson => {

                    const duration = lesson.duration;

                    if (duration.includes('min')) {

                        totalMinutes += parseInt(duration);

                    } else if (duration.includes('hora')) {

                        totalMinutes += parseInt(duration) * 60;

                    } else {

                        totalMinutes += 15; // Estimativa padrão para leitura

                    }

                });

            }

        });

        

        const hours = Math.ceil(totalMinutes / 60);

        return hours;

    },

    getLessonIcon(type) {

        switch (type) {

            case 'video': return '<i class="fas fa-video"></i>';

            case 'pdf': return '<i class="fas fa-file-pdf"></i>';

            case 'slide': return '<i class="fas fa-chalkboard-teacher"></i>';

            case 'audio': return '<i class="fas fa-headphones-alt"></i>';

            case 'document': return '<i class="fas fa-file-alt"></i>';

            default: return '<i class="fas fa-book"></i>';

        }

    },

    openCourse(courseId, moduleIdToExpand = null) {
        console.log('=== openCourse CHAMADO ===');
        console.log('Course ID recebido:', courseId);
        console.log('Module ID para expandir:', moduleIdToExpand);
        console.log('CourseDatabase completo:', this.courseDatabase);
        console.log('Chaves disponíveis:', Object.keys(this.courseDatabase));

        const course = this.courseDatabase[courseId];

        if (!course) {
            console.error('❌ Curso não encontrado:', courseId);
            console.error('Cursos disponíveis:', Object.keys(this.courseDatabase));
            alert(`Erro: Curso "${courseId}" não encontrado. Cursos disponíveis: ${Object.keys(this.courseDatabase).join(', ')}`);
            return;
        }

        console.log('✅ Curso encontrado:', course.title);
        console.log('=== ABRINDO CURSO ===');
        console.log('Course ID:', courseId);
        console.log('Course:', course);

        console.log('Carregando curso:', course.title);

        console.log('Módulos encontrados:', course.modules.length);

        const courseView = document.getElementById('course-view');
        
        // Adicionar data attributes para acesso posterior pelos modais
        if (courseView) {
            courseView.dataset.courseId = courseId;
            if (moduleIdToExpand !== null && moduleIdToExpand !== undefined) {
                courseView.dataset.moduleId = moduleIdToExpand;
            }
        }

        let modulesHtml = '';

        course.modules.forEach((module, moduleIndex) => {

            console.log(`Módulo ${moduleIndex + 1}:`, module.title);

            

            const moduleAccordionId = `module-accordion-${moduleIndex}`;
            
            let moduleHtml = `<div class="module-card">
                <h3 class="module-title" onclick="veloAcademyApp.toggleAccordion('${moduleAccordionId}')">
                    ${module.title}
                    <i class="fas fa-chevron-down accordion-icon"></i>
                </h3>
                <div class="accordion-content" id="${moduleAccordionId}">`;

            

            // Verifica se o módulo tem seções (estrutura nova) ou lessons diretas (estrutura antiga)

            if (module.sections) {

                // Nova estrutura com seções

                module.sections.forEach((section, sectionIndex) => {

                    console.log(`Seção ${sectionIndex + 1}:`, section.subtitle);

                    console.log('Aulas encontradas:', section.lessons.length);
                    
                    // Log detalhado de cada aula
                    section.lessons.forEach((lesson, idx) => {
                        console.log(`  Aula ${idx + 1}:`, {
                            id: lesson.id,
                            title: lesson.title,
                            type: lesson.type,
                            filePath: lesson.filePath,
                            isYouTube: lesson.type === 'video' && this.isYouTubeLink(lesson.filePath),
                            hasFilePath: !!lesson.filePath
                        });
                    });

                    

                    const accordionId = `accordion-${moduleIndex}-${sectionIndex}`;

                    

                    moduleHtml += `

                        <h4 class="module-subtitle" onclick="veloAcademyApp.toggleAccordion('${accordionId}')">

                            ${section.subtitle}

                            <i class="fas fa-chevron-down accordion-icon"></i>

                        </h4>

                    `;

                    

                    moduleHtml += `<div class="accordion-content" id="${accordionId}">`;

                    // Separar vídeos YouTube de outros conteúdos
                    const youtubeVideos = section.lessons.filter(l => {
                        const isVideo = l.type === 'video';
                        const hasFilePath = !!l.filePath;
                        const isYouTube = hasFilePath && this.isYouTubeLink(l.filePath);
                        const matches = isVideo && isYouTube;
                        
                        if (!matches && l.type === 'video') {
                            console.log(`⚠️ Vídeo não incluído em youtubeVideos:`, {
                                title: l.title,
                                id: l.id,
                                type: l.type,
                                filePath: l.filePath,
                                hasFilePath,
                                isYouTube: hasFilePath ? this.isYouTubeLink(l.filePath) : false
                            });
                        }
                        
                        return matches;
                    });
                    const otherLessons = section.lessons.filter(l => {
                        const isVideo = l.type === 'video';
                        const hasFilePath = !!l.filePath;
                        const isYouTube = hasFilePath && this.isYouTubeLink(l.filePath);
                        const matches = !(isVideo && isYouTube);
                        
                        return matches;
                    });
                    
                    console.log(`📊 Separação de aulas para "${section.subtitle}":`);
                    console.log(`   - Vídeos YouTube: ${youtubeVideos.length}`);
                    console.log(`   - Outras aulas: ${otherLessons.length}`);
                    console.log(`   - Total processado: ${youtubeVideos.length + otherLessons.length}`);

                    moduleHtml += '<ul class="modules-list">';

                    // Renderizar vídeos YouTube
                    console.log(`🎥 Renderizando ${youtubeVideos.length} vídeos YouTube para "${section.subtitle}"`);
                    
                    // Se há apenas 1 aula de vídeo YouTube, agrupar todas as URLs dela
                    // Se há múltiplas aulas, renderizar cada uma separadamente
                    if (youtubeVideos.length === 1) {
                        // Uma única aula - agrupar todas as URLs dela em uma sequência
                        const v = youtubeVideos[0];
                        let videoSequence = [];
                        
                        console.log(`🎥 Processando vídeo YouTube único:`, {
                            id: v.id,
                            title: v.title,
                            filePath: v.filePath,
                            allUrls: v.allUrls,
                            allUrlsCount: v.allUrls ? v.allUrls.length : 0
                        });
                        
                        if (v.allUrls && v.allUrls.length > 1) {
                            // Aula com múltiplas URLs - criar sequência de todas as URLs
                            v.allUrls.forEach((url, index) => {
                                videoSequence.push({
                                    id: `${v.id}-${index}`,
                                    title: index === 0 ? v.title : `${v.title} (Parte ${index + 1})`,
                                    filePath: url,
                                    videoId: this.extractYouTubeId(url)
                                });
                            });
                        } else {
                            // Aula com URL única
                            videoSequence.push({
                                id: v.id,
                                title: v.title,
                                filePath: v.filePath,
                                videoId: this.extractYouTubeId(v.filePath)
                            });
                        }
                        
                        // Usar título da seção/subtítulo para criar título da aula
                        const displayTitle = `Aula - ${section.subtitle}`;
                        
                        // Armazenar sequência em cache
                        const sequenceId = `video-seq-${courseId}-${moduleIndex}-${sectionIndex}`;
                        if (!this.videoSequencesCache) {
                            this.videoSequencesCache = {};
                        }
                        this.videoSequencesCache[sequenceId] = {
                            videos: videoSequence,
                            courseId: courseId,
                            moduleId: moduleIndex,
                            subtitle: section.subtitle
                        };
                        
                        moduleHtml += `
                            <li>
                                <div class="lesson-info">
                                    <i class="fas fa-video"></i>
                                    <div>
                                        <p>${displayTitle}</p>
                                        <span>${videoSequence.length} ${videoSequence.length === 1 ? 'vídeo' : 'vídeos'} • YouTube</span>
                                    </div>
                                </div>
                                <button class="btn video-sequence-btn" data-sequence-id="${sequenceId}">
                                    <i class="fas fa-play" style="margin-right: 5px;"></i>Assistir
                                </button>
                            </li>
                        `;
                    } else if (youtubeVideos.length > 1) {
                        // Múltiplas aulas - renderizar cada uma separadamente
                        youtubeVideos.forEach((v, videoIndex) => {
                            let videoSequence = [];
                            
                            console.log(`🎥 Processando vídeo YouTube ${videoIndex + 1}/${youtubeVideos.length}:`, {
                                id: v.id,
                                title: v.title,
                                filePath: v.filePath,
                                allUrls: v.allUrls,
                                allUrlsCount: v.allUrls ? v.allUrls.length : 0
                            });
                            
                            if (v.allUrls && v.allUrls.length > 1) {
                                // Aula com múltiplas URLs - criar sequência de todas as URLs
                                v.allUrls.forEach((url, index) => {
                                    videoSequence.push({
                                        id: `${v.id}-${index}`,
                                        title: index === 0 ? v.title : `${v.title} (Parte ${index + 1})`,
                                        filePath: url,
                                        videoId: this.extractYouTubeId(url)
                                    });
                                });
                            } else {
                                // Aula com URL única
                                videoSequence.push({
                                    id: v.id,
                                    title: v.title,
                                    filePath: v.filePath,
                                    videoId: this.extractYouTubeId(v.filePath)
                                });
                            }
                            
                            // Usar título da aula individual
                            const displayTitle = v.title;
                            
                            // Armazenar sequência em cache (uma por aula)
                            const sequenceId = `video-seq-${courseId}-${moduleIndex}-${sectionIndex}-${videoIndex}`;
                            if (!this.videoSequencesCache) {
                                this.videoSequencesCache = {};
                            }
                            this.videoSequencesCache[sequenceId] = {
                                videos: videoSequence,
                                courseId: courseId,
                                moduleId: moduleIndex,
                                subtitle: section.subtitle
                            };
                            
                            moduleHtml += `
                                <li>
                                    <div class="lesson-info">
                                        <i class="fas fa-video"></i>
                                        <div>
                                            <p>${displayTitle}</p>
                                            <span>${videoSequence.length} ${videoSequence.length === 1 ? 'vídeo' : 'vídeos'} • YouTube</span>
                                        </div>
                                    </div>
                                    <button class="btn video-sequence-btn" data-sequence-id="${sequenceId}">
                                        <i class="fas fa-play" style="margin-right: 5px;"></i>Assistir
                                    </button>
                                </li>
                            `;
                        });
                    }

                    // Renderizar outros conteúdos (PDFs, áudios, documentos, vídeos Google Drive)
                    console.log(`📄 Renderizando ${otherLessons.length} outras aulas para "${section.subtitle}"`);
                    otherLessons.forEach((lesson, lessonIndex) => {
                        console.log(`📄 Renderizando aula "otherLessons" ${lessonIndex + 1}/${otherLessons.length}:`, {
                            title: lesson.title,
                            type: lesson.type,
                            filePath: lesson.filePath,
                            id: lesson.id
                        });

                        const isLinkValid = this.validateLink(lesson.filePath);

                        const isGoogleDrive = this.isGoogleDriveLink(lesson.filePath);
                        const isYouTube = this.isYouTubeLink(lesson.filePath);

                        const finalUrl = isGoogleDrive ? this.getGoogleDriveViewUrl(lesson.filePath) : lesson.filePath;

                        

                        console.log(`Aula ${lessonIndex + 1}:`, lesson.title);

                        console.log('Link original:', lesson.filePath);

                        console.log('Link final:', finalUrl);

                        console.log('É Google Drive:', isGoogleDrive);
                        console.log('É YouTube:', isYouTube);

                        console.log('Link válido:', isLinkValid);

                        

                        // Lógica específica para diferentes tipos de conteúdo

                        let linkClass, linkText, linkAction;
                        let slidesUrl = null; // Inicializar variável para uso posterior

                        

                        if (!isLinkValid) {

                            linkClass = 'btn disabled';

                            linkText = 'Link Indisponível';

                            linkAction = 'onclick="return false;"';

                        } else if (lesson.type === 'pdf') {

                            // Para PDFs, criar dois botões: "Aula" (slides) e "PDF" (modal)
                            // O botão "Aula" será renderizado separadamente antes do botão PDF

                            linkClass = 'btn';

                            linkText = 'PDF';

                            // Abrir PDF no modal ao invés de nova aba
                            const subtitleEscaped = section.subtitle.replace(/'/g, "\\'");
                            const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                            const courseIdEscaped = courseId.replace(/'/g, "\\'");
                            const moduleIndexEscaped = moduleIndex;
                            linkAction = `href="#" onclick="veloAcademyApp.openPDFModal('${finalUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}', '${courseIdEscaped}', ${moduleIndexEscaped}); return false;"`;
                            
                            // Verificar se há link de slides disponível (pode estar em lesson.slidesUrl ou ser o mesmo link)
                            slidesUrl = lesson.slidesUrl || (this.isGoogleSlidesLink(finalUrl) ? finalUrl : null);

                        } else if (lesson.type === 'slide') {

                            // Para slides, abrir modal de Aula

                            linkClass = 'btn';

                            linkText = 'Aula';

                            const subtitleEscaped = section.subtitle.replace(/'/g, "\\'");
                            const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                            const courseIdEscaped = courseId.replace(/'/g, "\\'");
                            const moduleIndexEscaped = moduleIndex;
                            linkAction = `href="#" onclick="veloAcademyApp.openAulaModal('${finalUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}', '${courseIdEscaped}', ${moduleIndexEscaped}); return false;"`;

                        } else if (lesson.type === 'audio') {

                            // Para áudios/podcasts, usar botão "Ouvir"

                            linkClass = 'btn';

                            linkText = 'Ouvir';

                            linkAction = `href="${finalUrl}" target="_blank"`;

                        } else if (isYouTube && lesson.type === 'video') {

                            // Para vídeos do YouTube, abrir modal

                            const videoId = this.extractYouTubeId(lesson.filePath);
                            linkClass = 'btn';
                            linkText = 'Assistir';
                            linkAction = `onclick="veloAcademyApp.openYouTubeModal('${videoId}', '${lesson.title.replace(/'/g, "\\'")}'); return false;"`;

                        } else if (lesson.type === 'video' && isGoogleDrive) {
                            // Para vídeos Google Drive, abrir em modal com botão finalizar
                            linkClass = 'btn';
                            linkText = 'Assistir';
                            const subtitleEscaped = section.subtitle.replace(/'/g, "\\'");
                            const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                            const courseIdEscaped = courseId.replace(/'/g, "\\'");
                            const moduleIndexEscaped = moduleIndex;
                            linkAction = `href="#" onclick="veloAcademyApp.openGoogleDriveVideoModal('${finalUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}', '${courseIdEscaped}', ${moduleIndexEscaped}); return false;"`;
                        } else {
                            // Para outros conteúdos, abrir em nova aba
                            linkClass = 'btn';
                            linkText = 'Assistir';
                            linkAction = `href="${finalUrl}" target="_blank"`;
                        }

                        

                        // Adicionar ícone especial para Google Drive ou YouTube

                        let sourceIcon = '';
                        // Se for vídeo (YouTube ou Google Drive), usar ícone de play
                        if (lesson.type === 'video' && (isYouTube || isGoogleDrive)) {
                            sourceIcon = '<i class="fas fa-play" style="margin-right: 5px;"></i>';
                        } else if (isGoogleDrive && lesson.type === 'pdf') {
                            // Para PDFs do Google Drive, usar ícone do drive branco
                            sourceIcon = '<i class="fab fa-google-drive" style="margin-right: 5px; color: white;"></i>';
                        } else if (isGoogleDrive) {
                            // Para outros tipos do Google Drive, usar ícone do drive
                            sourceIcon = '<i class="fab fa-google-drive" style="margin-right: 5px;"></i>';
                        }

                        const sourceLabel = isGoogleDrive ? '• Google Drive' : (isYouTube ? '• YouTube' : '');

                        

                        // Renderizar botões
                        let buttonsHtml = '';
                        
                        // Se for PDF, adicionar botão "Aula" primeiro (usar link do PDF como slides por enquanto)
                        if (lesson.type === 'pdf') {
                            const subtitleEscaped = section.subtitle.replace(/'/g, "\\'");
                            const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                            // Por enquanto, usar o mesmo link do PDF. Depois pode ser melhorado para detectar slides
                            const aulaUrl = slidesUrl || finalUrl;
                            
                            const courseIdEscaped = courseId.replace(/'/g, "\\'");
                            const moduleIndexEscaped = moduleIndex;
                            buttonsHtml += `
                                <a href="#" onclick="veloAcademyApp.openAulaModal('${aulaUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}', '${courseIdEscaped}', ${moduleIndexEscaped}); return false;" class="btn" style="margin-right: 8px;">
                                    <i class="fas fa-chalkboard-teacher" style="margin-right: 5px;"></i>Aula
                                </a>
                            `;
                        }
                        
                        // Adicionar botão principal (PDF, Assistir, etc)
                        buttonsHtml += `<a ${linkAction} class="${linkClass}">${sourceIcon}${linkText}</a>`;

                        moduleHtml += `

                            <li>

                                <div class="lesson-info">

                                    ${this.getLessonIcon(lesson.type)}

                                    <div>

                                        <p>${lesson.title}</p>

                                        <span>${lesson.duration} ${sourceLabel}</span>

                                    </div>

                                </div>

                                <div style="display: flex; align-items: center;">
                                    ${buttonsHtml}
                                </div>

                            </li>

                        `;

                    });
                    
                    // Adicionar botão de quiz se hasQuiz for true (usando dados do MongoDB)
                    if (section.hasQuiz && section.quizId) {
                        const quizCourseId = section.quizId; // Usar quizId do MongoDB
                        
                        // Verificar se há vídeos nesta seção que precisam ser completados
                        const sectionVideos = section.lessons.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath));
                        const hasVideos = sectionVideos.length > 0;
                        const quizButtonId = `quiz-btn-${courseId}-${moduleIndex}-${sectionIndex}`;
                        
                        console.log(`Adicionando quiz para seção: ${section.subtitle} com ID: ${quizCourseId}, tem vídeos: ${hasVideos}`);
                        
                        // Verificar progresso de forma assíncrona após renderizar
                        moduleHtml += `
                            <div class="quiz-section">
                                <button class="btn-quiz" 
                                        id="${quizButtonId}"
                                        data-course-id="${courseId}"
                                        data-subtitle="${section.subtitle}"
                                        onclick="veloAcademyApp.startQuiz('${quizCourseId}')">
                                    <i class="fas fa-question-circle"></i> Fazer Quiz
                                </button>
                            </div>
                        `;
                        
                        // Verificar progresso assincronamente após renderizar
                        if (typeof ProgressTracker !== 'undefined') {
                            setTimeout(async () => {
                                // Identificar todas as aulas do subtítulo
                                const allLessons = [];
                                
                                // SEMPRE adicionar cada título individualmente (nunca usar "Aula em vídeo")
                                sectionVideos.forEach(video => {
                                    allLessons.push(video.title);
                                });
                                
                                // Adicionar outras aulas (PDFs, documentos, vídeos Google Drive, etc)
                                section.lessons.forEach(lesson => {
                                    if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                                        lesson.type === 'slide' || (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                                        allLessons.push(lesson.title);
                                    }
                                });
                                
                                // Verificar se todas as aulas foram completadas
                                const allCompleted = await ProgressTracker.checkAllLessonsCompleted(
                                    section.subtitle,
                                    allLessons
                                );
                                
                                const quizBtn = document.getElementById(quizButtonId);
                                if (quizBtn) {
                                    if (!allCompleted) {
                                        quizBtn.classList.add('disabled');
                                        quizBtn.disabled = true;
                                        quizBtn.innerHTML = '<i class="fas fa-question-circle"></i> Fazer Quiz <span class="quiz-lock-hint">(Complete todas as aulas para desbloquear)</span>';
                                    } else {
                                        quizBtn.classList.remove('disabled');
                                        quizBtn.disabled = false;
                                    }
                                }
                            }, 500);
                        }
                    }
                    
                    moduleHtml += '</ul></div>';

                });
                
                // Adicionar event listeners para botões de sequência de vídeos após renderizar
                setTimeout(() => {
                    document.querySelectorAll('.video-sequence-btn').forEach(btn => {
                        const sequenceId = btn.getAttribute('data-sequence-id');
                        if (sequenceId && this.videoSequencesCache && this.videoSequencesCache[sequenceId]) {
                            const seqData = this.videoSequencesCache[sequenceId];
                            btn.addEventListener('click', (e) => {
                                e.preventDefault();
                                this.openVideoSequence(seqData.videos, seqData.courseId, seqData.moduleId, seqData.subtitle);
                            });
                        }
                    });
                }, 100);

            } else {

                // Estrutura antiga com lessons diretas

                console.log('Aulas encontradas:', module.lessons.length);

                

                if (module.subtitle) {

                    moduleHtml += `<h4 class="module-subtitle">${module.subtitle}</h4>`;

                }

                

                moduleHtml += '<ul class="modules-list">';

                

                module.lessons.forEach((lesson, lessonIndex) => {

                    const isLinkValid = this.validateLink(lesson.filePath);

                    const isGoogleDrive = this.isGoogleDriveLink(lesson.filePath);
                    const isYouTube = this.isYouTubeLink(lesson.filePath);

                    const finalUrl = isGoogleDrive ? this.getGoogleDriveViewUrl(lesson.filePath) : lesson.filePath;

                    

                    console.log(`Aula ${lessonIndex + 1}:`, lesson.title);

                    console.log('Link original:', lesson.filePath);

                    console.log('Link final:', finalUrl);

                    console.log('É Google Drive:', isGoogleDrive);
                    console.log('É YouTube:', isYouTube);

                    console.log('Link válido:', isLinkValid);

                    

                    // Lógica específica para diferentes tipos de conteúdo

                    let linkClass, linkText, linkAction;
                    let slidesUrl = null; // Inicializar variável para uso posterior

                    

                    if (!isLinkValid) {

                        linkClass = 'btn disabled';

                        linkText = 'Link Indisponível';

                        linkAction = 'onclick="return false;"';

                    } else if (lesson.type === 'pdf') {

                        // Para PDFs, criar dois botões: "Aula" (slides) e "PDF" (link direto)

                        linkClass = 'btn';

                        linkText = 'PDF';

                        linkAction = `href="${finalUrl}" target="_blank"`;
                        
                        // Verificar se há link de slides disponível
                        slidesUrl = lesson.slidesUrl || (this.isGoogleSlidesLink(finalUrl) ? finalUrl : null);

                    } else if (lesson.type === 'slide') {

                        // Para slides, abrir modal de Aula

                        linkClass = 'btn';

                        linkText = 'Aula';

                        const subtitleEscaped = module.title.replace(/'/g, "\\'");
                        const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                        linkAction = `href="#" onclick="veloAcademyApp.openAulaModal('${finalUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}'); return false;"`;

                    } else if (lesson.type === 'audio') {

                        // Para áudios/podcasts, usar botão "Ouvir"

                        linkClass = 'btn';

                        linkText = 'Ouvir';

                        linkAction = `href="${finalUrl}" target="_blank"`;

                    } else if (isYouTube && lesson.type === 'video') {

                        // Para vídeos do YouTube, abrir modal

                        const videoId = this.extractYouTubeId(lesson.filePath);
                        linkClass = 'btn';
                        linkText = 'Assistir';
                        linkAction = `onclick="veloAcademyApp.openYouTubeModal('${videoId}', '${lesson.title.replace(/'/g, "\\'")}'); return false;"`;

                    } else {

                        // Para vídeos Google Drive e outros conteúdos, abrir em nova aba

                        linkClass = 'btn';

                        linkText = 'Assistir';

                        linkAction = `href="${finalUrl}" target="_blank"`;

                    }

                    
                    // Adicionar ícone especial para Google Drive
                    // Se for vídeo (YouTube ou Google Drive), usar ícone de play
                    let driveIcon = '';
                    let playIcon = '';
                    
                    if (lesson.type === 'video' && (isYouTube || isGoogleDrive)) {
                        playIcon = '<i class="fas fa-play" style="margin-right: 5px;"></i>';
                    } else if (isGoogleDrive && lesson.type === 'pdf') {
                        // Para PDFs do Google Drive, usar ícone do drive branco
                        driveIcon = '<i class="fab fa-google-drive" style="margin-right: 5px; color: white;"></i>';
                    } else if (isGoogleDrive) {
                        // Para outros tipos do Google Drive, usar ícone do drive
                        driveIcon = '<i class="fab fa-google-drive" style="margin-right: 5px;"></i>';
                    }

                    // Renderizar botões
                    let buttonsHtml = '';
                    
                    // Se for PDF, adicionar botão "Aula" primeiro (usar link do PDF como slides por enquanto)
                    if (lesson.type === 'pdf') {
                        const subtitleEscaped = module.title.replace(/'/g, "\\'");
                        const lessonTitleEscaped = lesson.title.replace(/'/g, "\\'");
                        // Por enquanto, usar o mesmo link do PDF. Depois pode ser melhorado para detectar slides
                        const aulaUrl = slidesUrl || finalUrl;
                        
                        buttonsHtml += `
                            <a href="#" onclick="veloAcademyApp.openAulaModal('${aulaUrl}', '${subtitleEscaped}', '${lessonTitleEscaped}'); return false;" class="btn" style="margin-right: 8px;">
                                <i class="fas fa-chalkboard-teacher" style="margin-right: 5px;"></i>Aula
                            </a>
                        `;
                    }
                    
                    // Adicionar botão principal (PDF, Assistir, etc)
                    buttonsHtml += `<a ${linkAction} class="${linkClass}">${driveIcon}${playIcon}${linkText}</a>`;
                    
                    moduleHtml += `

                        <li>

                            <div class="lesson-info">

                                ${this.getLessonIcon(lesson.type)}

                                <div>

                                    <p>${lesson.title}</p>

                                    <span>${lesson.duration} ${isGoogleDrive ? '• Google Drive' : ''}</span>

                                </div>

                            </div>

                            <div style="display: flex; align-items: center;">
                                ${buttonsHtml}
                            </div>

                        </li>

                    `;

                });
                
                moduleHtml += '</ul>';

            }

            

            moduleHtml += '</div></div>';

            modulesHtml += moduleHtml;

        });

        // Verificar se é curso "produtos" para ocultar título e subtítulo
        const isProdutosCourse = courseId === 'produtos';
        const titleSectionHtml = isProdutosCourse ? '' : `
                <div class="course-title-section">
                    <h1>${course.title}</h1>
                    <p>${course.description}</p>
                </div>
        `;
        const headerClass = isProdutosCourse ? 'course-header-compact no-title' : 'course-header-compact';

        courseView.innerHTML = `

            <div class="${headerClass}">

                <button class="btn btn-secondary" id="back-to-courses">

                    <i class="fas fa-arrow-left"></i> Voltar

                </button>

                ${titleSectionHtml}

            </div>

            ${modulesHtml}

        `;

        // Expandir módulo específico se solicitado
        if (moduleIdToExpand !== null && moduleIdToExpand !== undefined) {
            // Aguardar renderização do DOM
            setTimeout(() => {
                const moduleIndex = parseInt(moduleIdToExpand);
                if (!isNaN(moduleIndex)) {
                    const moduleAccordionId = `module-accordion-${moduleIndex}`;
                    const accordion = document.getElementById(moduleAccordionId);
                    const header = document.querySelector(`[onclick*="${moduleAccordionId}"]`);
                    
                    if (accordion && header) {
                        accordion.classList.add('active');
                        header.classList.add('active');
                        console.log(`Módulo ${moduleIndex} expandido automaticamente`);
                    }
                }
            }, 100);
        }

        document.getElementById('back-to-courses').addEventListener('click', () => this.switchView('dashboard-view'));

        this.switchView('course-view');

    },

    validateLink(link) {

        if (!link) {

            return false;

        }

        
        // Verificar se é um link quebrado (placeholder)

        if (link.includes('YOUR_FILE_ID_HERE') || link === '#' || link === '') {

            return false;

        }

        
        // Verificar se é um link válido do Google Drive

        if (link.includes('drive.google.com')) {

            // Verificar se tem um ID válido (25+ caracteres alfanuméricos)

            const driveIdMatch = link.match(/[a-zA-Z0-9_-]{25,}/);

            if (driveIdMatch) {

                return true;

            }

        }

        
        // Verificar se é um link válido do YouTube

        if (this.isYouTubeLink(link)) {

            return true;

        }

        
        // Verificar se é um link HTTP/HTTPS válido

        if (link.startsWith('http://') || link.startsWith('https://')) {

            return true;

        }

        
        return false;

    },

    isGoogleDriveLink(link) {

        return link && link.includes('drive.google.com');

    },

    getGoogleDriveViewUrl(filePath) {

        if (!this.isGoogleDriveLink(filePath)) {

            return filePath;

        }

        
        // Extrair o ID do arquivo

        const driveIdMatch = filePath.match(/[a-zA-Z0-9_-]{25,}/);

        if (driveIdMatch) {

            const fileId = driveIdMatch[0];

            // Retornar URL de visualização direta

            return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;

        }

        
        return filePath;

    },

    // Função para detectar se é link do YouTube
    isYouTubeLink(link) {
        if (!link) {
            return false;
        }
        
        // Verificar diferentes formatos de URL do YouTube
        const youtubePatterns = [
            /youtube\.com\/watch\?v=/,      // Formato padrão: youtube.com/watch?v=VIDEO_ID
            /youtu\.be\//,                  // Formato curto: youtu.be/VIDEO_ID
            /youtube\.com\/embed\//,        // Formato embed: youtube.com/embed/VIDEO_ID
            /youtube\.com\/shorts\//        // Formato Shorts: youtube.com/shorts/VIDEO_ID
        ];
        
        return youtubePatterns.some(pattern => pattern.test(link));
    },

    // Função para detectar se é link do Google Slides
    isGoogleSlidesLink(link) {
        if (!link) {
            return false;
        }
        // Verificar padrões de URL do Google Slides
        const slidesPatterns = [
            /docs\.google\.com\/presentation/,
            /drive\.google\.com\/file\/d\/.*\/.*presentation/
        ];
        return slidesPatterns.some(pattern => pattern.test(link));
    },
    
    // Função para extrair ID do Google Slides
    extractGoogleSlidesId(filePath) {
        if (!this.isGoogleSlidesLink(filePath)) {
            return null;
        }
        
        // Formato: https://docs.google.com/presentation/d/{ID}/edit
        const slidesMatch = filePath.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
        if (slidesMatch) {
            return slidesMatch[1];
        }
        
        // Formato: https://drive.google.com/file/d/{ID}/view (pode ser slides)
        const driveMatch = filePath.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (driveMatch) {
            return driveMatch[1];
        }
        
        return null;
    },
    
    // Função para verificar se é YouTube Shorts
    isYouTubeShorts(filePath) {
        if (!filePath) return false;
        return /youtube\.com\/shorts\//.test(filePath);
    },
    
    // Função para extrair ID do vídeo do YouTube
    extractYouTubeId(filePath) {
        if (!this.isYouTubeLink(filePath)) {
            return null;
        }
        
        let videoId = null;
        
        // Formato: https://www.youtube.com/watch?v=VIDEO_ID
        const watchMatch = filePath.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        if (watchMatch) {
            videoId = watchMatch[1];
        }
        
        // Formato: https://youtu.be/VIDEO_ID
        if (!videoId) {
            const shortMatch = filePath.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
            if (shortMatch) {
                videoId = shortMatch[1];
            }
        }
        
        // Formato: https://www.youtube.com/embed/VIDEO_ID
        if (!videoId) {
            const embedMatch = filePath.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
            if (embedMatch) {
                videoId = embedMatch[1];
            }
        }
        
        // Formato: https://www.youtube.com/shorts/VIDEO_ID (YouTube Shorts)
        if (!videoId) {
            const shortsMatch = filePath.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (shortsMatch) {
                videoId = shortsMatch[1];
            }
        }
        
        return videoId;
    },

    // Função para abrir modal do YouTube
    // Abrir modal YouTube com vídeo único (compatibilidade)
    openYouTubeModal(videoId, title) {
        this.openYouTubeModalSequence([{ id: null, videoId, title }], null, null, null);
    },
    
    // Abrir modal YouTube com sequência de múltiplos vídeos
    openYouTubeModalSequence(videos, courseId, moduleId, subtitle) {
        const overlay = document.getElementById('youtube-modal-overlay');
        const titleElement = document.getElementById('youtube-modal-title');
        const iframe = document.getElementById('youtube-player');
        const counterElement = document.getElementById('youtube-video-counter');
        const prevBtn = document.getElementById('youtube-btn-prev');
        const nextBtn = document.getElementById('youtube-btn-next');
        const finishBtn = document.getElementById('youtube-btn-finish');
        
        if (!overlay || !titleElement || !iframe) {
            console.error('Elementos do modal YouTube não encontrados');
            return;
        }
        
        // Validar array de vídeos
        if (!videos || videos.length === 0) {
            console.error('Array de vídeos inválido ou vazio');
            return;
        }
        
        // Armazenar sequência atual
        this.currentVideoSequence = videos;
        this.currentVideoIndex = 0;
        this.videoSequenceMetadata = { courseId, moduleId, subtitle };
        
        // Extrair videoId do primeiro vídeo
        const firstVideo = videos[0];
        let videoId = firstVideo.videoId || firstVideo.id;
        
        // Se for um link completo, extrair o ID
        if (!videoId && firstVideo.filePath) {
            videoId = this.extractYouTubeId(firstVideo.filePath);
        }
        
        if (!videoId) {
            console.error('VideoId não encontrado no primeiro vídeo');
            return;
        }
        
        // Atualizar título
        titleElement.textContent = firstVideo.title || 'Vídeo do YouTube';
        
        // Atualizar contador
        if (counterElement) {
            counterElement.textContent = `1 / ${videos.length}`;
        }
        
        // Configurar controles de navegação
        if (prevBtn) {
            prevBtn.disabled = true; // Primeiro vídeo: botão visível mas desabilitado
        }
        
        if (nextBtn) {
            nextBtn.disabled = true; // Desabilitado até vídeo terminar
            if (videos.length === 1) {
                nextBtn.style.display = 'none';
                if (finishBtn) {
                    finishBtn.style.display = 'inline-flex';
                    finishBtn.disabled = true;
                }
            } else {
                nextBtn.style.display = 'inline-flex';
                if (finishBtn) {
                    finishBtn.style.display = 'none';
                }
            }
        }
        
        // Construir URL do embed do YouTube com eventos habilitados
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&origin=${window.location.origin}`;
        
        // Verificar se é Shorts e ajustar modal
        const isShorts = this.isYouTubeShorts(firstVideo.filePath || '');
        const modalBody = document.querySelector('.youtube-modal-body');
        const modalContainer = document.querySelector('.youtube-modal-container');
        
        if (isShorts) {
            // Adicionar classe para Shorts (formato vertical 9:16)
            if (modalBody) {
                modalBody.classList.add('youtube-shorts');
            }
            if (modalContainer) {
                modalContainer.classList.add('youtube-shorts-container');
            }
            console.log('📱 Vídeo detectado como YouTube Shorts - aplicando formato vertical 9:16');
            
            // Ajustar altura do body após renderização para garantir que o footer fique visível
            setTimeout(() => {
                if (modalContainer && modalBody) {
                    const containerHeight = modalContainer.offsetHeight;
                    const header = document.querySelector('.youtube-modal-header');
                    const footer = document.querySelector('.youtube-modal-footer');
                    const headerHeight = header ? header.offsetHeight : 60;
                    const footerHeight = footer ? footer.offsetHeight : 72;
                    const maxBodyHeight = containerHeight - headerHeight - footerHeight;
                    
                    // Limitar altura do body para não ultrapassar o espaço disponível
                    if (modalBody.offsetHeight > maxBodyHeight) {
                        modalBody.style.maxHeight = `${maxBodyHeight}px`;
                        modalBody.style.overflow = 'hidden';
                        console.log(`📏 Altura do body limitada para ${maxBodyHeight}px para garantir footer visível`);
                    }
                }
            }, 200);
        } else {
            // Remover classe de Shorts se existir
            if (modalBody) {
                modalBody.classList.remove('youtube-shorts');
                modalBody.style.maxHeight = '';
                modalBody.style.overflow = '';
            }
            if (modalContainer) {
                modalContainer.classList.remove('youtube-shorts-container');
            }
        }
        
        // Definir src do iframe
        iframe.src = embedUrl;
        
        // Criar player para detecção de eventos (se API disponível)
        setTimeout(() => {
            this.createYouTubePlayer(videoId);
        }, 500);
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevenir scroll do body
        
        console.log('Modal YouTube aberto com sequência:', { 
            totalVideos: videos.length, 
            currentIndex: 0,
            courseId,
            subtitle 
        });
    },
    
    // Navegar para próximo vídeo
    async nextVideo() {
        if (!this.currentVideoSequence || this.currentVideoIndex >= this.currentVideoSequence.length - 1) {
            return;
        }
        
        // Não marcar vídeo individual como completo
        // Apenas marcar "Aula em vídeo" quando finalizar toda a sequência
        
        this.currentVideoIndex++;
        this.loadVideoInModal(this.currentVideoIndex);
    },
    
    // Navegar para vídeo anterior
    previousVideo() {
        if (!this.currentVideoSequence || this.currentVideoIndex <= 0) {
            return;
        }
        
        this.currentVideoIndex--;
        this.loadVideoInModal(this.currentVideoIndex);
        this.updateYouTubeProgress();
    },
    
    // Carregar vídeo específico no modal
    loadVideoInModal(index) {
        if (!this.currentVideoSequence || index < 0 || index >= this.currentVideoSequence.length) {
            return;
        }
        
        const video = this.currentVideoSequence[index];
        const titleElement = document.getElementById('youtube-modal-title');
        const iframe = document.getElementById('youtube-player');
        const counterElement = document.getElementById('youtube-video-counter');
        const prevBtn = document.getElementById('youtube-btn-prev');
        const nextBtn = document.getElementById('youtube-btn-next');
        const finishBtn = document.getElementById('youtube-btn-finish');
        
        // Extrair videoId
        let videoId = video.videoId || video.id;
        if (!videoId && video.filePath) {
            videoId = this.extractYouTubeId(video.filePath);
        }
        
        if (!videoId) {
            console.error('VideoId não encontrado');
            return;
        }
        
        // Atualizar título
        if (titleElement) {
            titleElement.textContent = video.title || 'Vídeo do YouTube';
        }
        
        // Atualizar contador e barra de progresso
        if (counterElement) {
            counterElement.textContent = `${index + 1} / ${this.currentVideoSequence.length}`;
        }
        this.updateYouTubeProgress();
        
        // Configurar botão Voltar (sempre visível, habilitado apenas se não for o primeiro)
        if (prevBtn) {
            prevBtn.disabled = index === 0;
        }
        
        // Configurar botões Próximo/Finalizar
        const isLastVideo = index === this.currentVideoSequence.length - 1;
        if (isLastVideo) {
            if (nextBtn) {
                nextBtn.style.display = 'none';
            }
            if (finishBtn) {
                finishBtn.style.display = 'inline-flex';
                finishBtn.disabled = true; // Desabilitado até vídeo terminar
            }
        } else {
            if (nextBtn) {
                nextBtn.style.display = 'inline-flex';
                nextBtn.disabled = true; // Desabilitado até vídeo terminar
            }
            if (finishBtn) {
                finishBtn.style.display = 'none';
            }
        }
        
        // Verificar se é Shorts e ajustar modal
        const currentVideo = this.currentVideoSequence[index];
        const isShorts = currentVideo && this.isYouTubeShorts(currentVideo.filePath || '');
        const modalBody = document.querySelector('.youtube-modal-body');
        const modalContainer = document.querySelector('.youtube-modal-container');
        
        if (isShorts) {
            // Adicionar classe para Shorts (formato vertical 9:16)
            if (modalBody) {
                modalBody.classList.add('youtube-shorts');
            }
            if (modalContainer) {
                modalContainer.classList.add('youtube-shorts-container');
            }
            console.log('📱 Vídeo detectado como YouTube Shorts - aplicando formato vertical 9:16');
            
            // Ajustar altura do body após renderização para garantir que o footer fique visível
            setTimeout(() => {
                if (modalContainer && modalBody) {
                    const containerHeight = modalContainer.offsetHeight;
                    const header = document.querySelector('.youtube-modal-header');
                    const footer = document.querySelector('.youtube-modal-footer');
                    const headerHeight = header ? header.offsetHeight : 60;
                    const footerHeight = footer ? footer.offsetHeight : 72;
                    const maxBodyHeight = containerHeight - headerHeight - footerHeight;
                    
                    // Limitar altura do body para não ultrapassar o espaço disponível
                    if (modalBody.offsetHeight > maxBodyHeight) {
                        modalBody.style.maxHeight = `${maxBodyHeight}px`;
                        modalBody.style.overflow = 'hidden';
                        console.log(`📏 Altura do body limitada para ${maxBodyHeight}px para garantir footer visível`);
                    }
                }
            }, 200);
        } else {
            // Remover classe de Shorts se existir
            if (modalBody) {
                modalBody.classList.remove('youtube-shorts');
                modalBody.style.maxHeight = '';
                modalBody.style.overflow = '';
            }
            if (modalContainer) {
                modalContainer.classList.remove('youtube-shorts-container');
            }
        }
        
        // Carregar vídeo no iframe
        const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&origin=${window.location.origin}`;
        if (iframe) {
            iframe.src = embedUrl;
        }
        
        // Criar player para detecção de eventos
        setTimeout(() => {
            this.createYouTubePlayer(videoId);
        }, 500);
        
        console.log(`Carregado vídeo ${index + 1} de ${this.currentVideoSequence.length}`);
    },
    
    // Finalizar sequência de vídeos
    async finishVideoSequence() {
        if (!this.currentVideoSequence || !this.videoSequenceMetadata) {
            this.closeYouTubeModal();
            return;
        }
        
        const subtitle = this.videoSequenceMetadata.subtitle;
        const courseId = this.videoSequenceMetadata.courseId;
        const moduleId = this.videoSequenceMetadata.moduleId;
        
        // Obter lista completa de aulas do subtítulo para validação
        let allLessonTitles = null;
        let lessonTitleToSave = null;
        
        console.log('🔍 Buscando dados para salvar progresso:', { courseId, moduleId, subtitle });
        
        if (courseId && subtitle) {
            const course = this.courseDatabase[courseId];
            if (!course) {
                console.error('❌ Curso não encontrado no database:', courseId);
            } else {
                // Se moduleId é um número, usar como índice
                let module = null;
                if (typeof moduleId === 'number') {
                    module = course.modules?.[moduleId];
                } else {
                    module = course.modules?.find(m => m.id === moduleId || m.title === moduleId);
                }
                
                if (!module) {
                    console.error('❌ Módulo não encontrado:', moduleId, 'Módulos disponíveis:', course.modules?.map(m => ({ id: m.id, title: m.title })));
                } else {
                    const section = module.sections?.find(s => s.subtitle === subtitle);
                    if (!section) {
                        console.error('❌ Seção não encontrada:', subtitle, 'Seções disponíveis:', module.sections?.map(s => s.subtitle));
                    } else {
                        console.log('✅ Seção encontrada:', section.subtitle);
                        allLessonTitles = [];
                        // Obter todas as aulas de vídeo YouTube
                        const sectionVideos = section.lessons?.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath)) || [];
                        
                        // SEMPRE adicionar cada título individualmente (nunca usar "Aula em vídeo")
                        sectionVideos.forEach(video => {
                            allLessonTitles.push(video.title);
                        });
                        
                        // Determinar qual aula está sendo concluída agora
                        // Identificar pela sequência atual qual aula foi concluída
                        if (this.currentVideoSequence && this.currentVideoSequence.length > 0) {
                            const firstVideoInSequence = this.currentVideoSequence[0];
                            const firstVideoId = firstVideoInSequence.videoId || firstVideoInSequence.id;
                            const firstVideoFilePath = firstVideoInSequence.filePath;
                            
                            // Tentar encontrar a aula correspondente na seção pelo videoId ou filePath
                            let matchingVideo = null;
                            
                            // Buscar por videoId primeiro
                            if (firstVideoId) {
                                matchingVideo = sectionVideos.find(v => {
                                    const vId = this.extractYouTubeId(v.filePath);
                                    return vId === firstVideoId;
                                });
                            }
                            
                            // Se não encontrou, buscar por filePath
                            if (!matchingVideo && firstVideoFilePath) {
                                matchingVideo = sectionVideos.find(v => {
                                    // Comparar URLs normalizadas (sem parâmetros extras)
                                    const vId = this.extractYouTubeId(v.filePath);
                                    const seqId = this.extractYouTubeId(firstVideoFilePath);
                                    return vId === seqId;
                                });
                            }
                            
                            // Se ainda não encontrou, usar o título da sequência (removendo "Parte X" se houver)
                            if (!matchingVideo && firstVideoInSequence.title) {
                                const cleanTitle = firstVideoInSequence.title.replace(/\s*\(Parte\s+\d+\)\s*$/i, '');
                                matchingVideo = sectionVideos.find(v => v.title === cleanTitle);
                            }
                            
                            lessonTitleToSave = matchingVideo ? matchingVideo.title : (sectionVideos[0]?.title || null);
                            
                            console.log('🔍 Identificando aula concluída:', {
                                firstVideoInSequence: firstVideoInSequence.title,
                                firstVideoId,
                                matchingVideo: matchingVideo?.title,
                                lessonTitleToSave,
                                sectionVideos: sectionVideos.map(v => ({ title: v.title, filePath: v.filePath }))
                            });
                        } else {
                            lessonTitleToSave = sectionVideos[0]?.title || null;
                            console.log('⚠️ Sequência vazia, usando primeira aula:', lessonTitleToSave);
                        }
                        
                        // Adicionar outras aulas (PDFs, documentos, vídeos Google Drive, etc)
                        section.lessons?.forEach(lesson => {
                            if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                                lesson.type === 'slide' || (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                                allLessonTitles.push(lesson.title);
                            }
                        });
                        
                        console.log('📋 Lista completa de aulas esperadas:', allLessonTitles);
                    }
                }
            }
        } else {
            console.error('❌ Dados insuficientes para salvar progresso:', { courseId, subtitle });
        }
        
        console.log('💾 Salvando progresso:', { subtitle, lessonTitleToSave, allLessonTitles });
        
        // Marcar aula como completa usando o título individual
        if (subtitle && lessonTitleToSave) {
            await ProgressTracker.saveVideoProgress(
                subtitle,
                lessonTitleToSave,
                allLessonTitles
            );
        } else {
            console.error('❌ Não foi possível determinar o título da aula para salvar');
        }
        
        // Fechar modal
        this.closeYouTubeModal();
        
        // Atualizar botão do quiz sem recarregar o curso
        if (courseId && subtitle) {
            console.log('🔄 Tentando atualizar botão do quiz:', { courseId, moduleId, subtitle });
            const course = this.courseDatabase[courseId];
            if (course) {
                // Encontrar índices do módulo e seção
                let moduleIndex = -1;
                let sectionIndex = -1;
                
                // Se moduleId é um número (índice), usar diretamente
                if (typeof moduleId === 'number') {
                    moduleIndex = moduleId;
                    const module = course.modules?.[moduleIndex];
                    if (module) {
                        module.sections?.forEach((sec, secIdx) => {
                            if (sec.subtitle === subtitle) {
                                sectionIndex = secIdx;
                            }
                        });
                    }
                } else {
                    // Buscar pelo ID ou título
                    course.modules.forEach((mod, modIdx) => {
                        if (mod.id === moduleId || mod.title === moduleId) {
                            moduleIndex = modIdx;
                            mod.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    sectionIndex = secIdx;
                                }
                            });
                        }
                    });
                }
                
                // Se não encontrou pelo moduleId, buscar em todos os módulos
                if (moduleIndex === -1 || sectionIndex === -1) {
                    console.log('🔍 Buscando em todos os módulos...');
                    course.modules.forEach((mod, modIdx) => {
                        mod.sections?.forEach((sec, secIdx) => {
                            if (sec.subtitle === subtitle) {
                                moduleIndex = modIdx;
                                sectionIndex = secIdx;
                                console.log(`✅ Encontrado: módulo ${moduleIndex}, seção ${sectionIndex}`);
                            }
                        });
                    });
                }
                
                console.log('📊 Índices encontrados:', { moduleIndex, sectionIndex });
                
                if (moduleIndex !== -1 && sectionIndex !== -1) {
                    await this.updateQuizButton(subtitle, courseId, moduleIndex, sectionIndex);
                } else {
                    console.error('❌ Não foi possível encontrar índices do módulo/seção');
                }
            } else {
                console.error('❌ Curso não encontrado:', courseId);
            }
        } else {
            console.error('❌ Dados insuficientes para atualizar quiz:', { courseId, subtitle });
        }
    },

    // Função auxiliar para abrir sequência de vídeos (chamada do HTML)
    openVideoSequence(videos, courseId, moduleId, subtitle) {
        this.openYouTubeModalSequence(videos, courseId, moduleId, subtitle);
    },
    
    // Marcar aula como completa (para PDFs, documentos, etc)
    async markLessonComplete(subtitle, lessonTitle, allLessonTitles = null) {
        if (typeof ProgressTracker !== 'undefined') {
            await ProgressTracker.saveVideoProgress(subtitle, lessonTitle, allLessonTitles);
        }
    },
    
    // Atualizar estado do botão do quiz sem recarregar o curso
    async updateQuizButton(subtitle, courseId, moduleIndex, sectionIndex) {
        console.log('🔧 updateQuizButton chamado:', { subtitle, courseId, moduleIndex, sectionIndex });
        
        if (!courseId || subtitle === null || subtitle === undefined) {
            console.log('⚠️ Não é possível atualizar botão do quiz: dados insuficientes');
            return;
        }
        
        const quizButtonId = `quiz-btn-${courseId}-${moduleIndex}-${sectionIndex}`;
        console.log('🔍 Procurando botão:', quizButtonId);
        
        const quizBtn = document.getElementById(quizButtonId);
        
        if (!quizBtn) {
            console.log(`⚠️ Botão do quiz não encontrado: ${quizButtonId}`);
            // Tentar encontrar todos os botões de quiz para debug
            const allQuizButtons = document.querySelectorAll('[id^="quiz-btn-"]');
            console.log('📋 Botões de quiz encontrados:', Array.from(allQuizButtons).map(btn => btn.id));
            return;
        }
        
        console.log('✅ Botão encontrado:', quizButtonId);
        
        // Obter lista completa de aulas do subtítulo
        const course = this.courseDatabase[courseId];
        if (!course) {
            console.log(`⚠️ Curso não encontrado: ${courseId}`);
            return;
        }
        
        const module = course.modules?.[moduleIndex];
        if (!module) {
            console.log(`⚠️ Módulo não encontrado no índice: ${moduleIndex}`);
            return;
        }
        
        const section = module.sections?.[sectionIndex];
        if (!section || section.subtitle !== subtitle) {
            // Tentar encontrar por subtitle
            const foundSection = module.sections?.find(s => s.subtitle === subtitle);
            if (!foundSection) {
                console.log(`⚠️ Seção não encontrada: ${subtitle}`);
                return;
            }
        }
        
        const targetSection = section || module.sections?.find(s => s.subtitle === subtitle);
        if (!targetSection) {
            return;
        }
        
        // Identificar todas as aulas do subtítulo
        const allLessons = [];
        
        // Obter todas as aulas de vídeo YouTube
        const sectionVideos = targetSection.lessons?.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath)) || [];
        
        // SEMPRE adicionar cada título individualmente (nunca usar "Aula em vídeo")
        sectionVideos.forEach(video => {
            allLessons.push(video.title);
        });
        
        // Adicionar outras aulas (PDFs, documentos, áudios, slides, vídeos Google Drive)
        targetSection.lessons?.forEach(lesson => {
            if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                lesson.type === 'slide' || (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                allLessons.push(lesson.title);
            }
        });
        
        // Verificar se todas as aulas foram completadas
        console.log('📚 Lista de aulas para verificar:', allLessons);
        
        if (typeof ProgressTracker !== 'undefined' && allLessons.length > 0) {
            const allCompleted = await ProgressTracker.checkAllLessonsCompleted(
                subtitle,
                allLessons
            );
            
            console.log('✅ Todas as aulas completadas?', allCompleted);
            
            if (allCompleted) {
                quizBtn.classList.remove('disabled');
                quizBtn.disabled = false;
                quizBtn.innerHTML = '<i class="fas fa-question-circle"></i> Fazer Quiz';
                console.log('✅ Quiz desbloqueado para:', subtitle);
            } else {
                quizBtn.classList.add('disabled');
                quizBtn.disabled = true;
                quizBtn.innerHTML = '<i class="fas fa-question-circle"></i> Fazer Quiz <span class="quiz-lock-hint">(Complete todas as aulas para desbloquear)</span>';
                console.log('🔒 Quiz ainda bloqueado para:', subtitle);
            }
        } else {
            console.log('⚠️ ProgressTracker não disponível ou lista de aulas vazia');
        }
    },
    
    // Função para fechar modal do YouTube
    closeYouTubeModal() {
        const overlay = document.getElementById('youtube-modal-overlay');
        const iframe = document.getElementById('youtube-player');
        const modalBody = document.querySelector('.youtube-modal-body');
        const modalContainer = document.querySelector('.youtube-modal-container');
        
        if (!overlay || !iframe) {
            return;
        }
        
        // Pausar vídeo removendo src do iframe
        iframe.src = '';
        
        // Remover classes de Shorts ao fechar
        if (modalBody) {
            modalBody.classList.remove('youtube-shorts');
        }
        if (modalContainer) {
            modalContainer.classList.remove('youtube-shorts-container');
        }
        
        // Limpar sequência atual
        this.currentVideoSequence = null;
        this.currentVideoIndex = 0;
        this.videoSequenceMetadata = null;
        
        // Resetar controles
        const prevBtn = document.getElementById('youtube-btn-prev');
        const nextBtn = document.getElementById('youtube-btn-next');
        const finishBtn = document.getElementById('youtube-btn-finish');
        
        if (prevBtn) {
            prevBtn.disabled = true;
        }
        if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.disabled = true;
        }
        if (finishBtn) {
            finishBtn.style.display = 'none';
        }
        
        // Ocultar modal
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaurar scroll do body
        
        console.log('Modal YouTube fechado');
    },
    
    // ==================== FUNÇÕES DO MODAL PDF ====================
    
    // Função para criar estrutura HTML do modal PDF dinamicamente
    createPDFModal() {
        // Verificar se o modal já existe
        if (document.getElementById('pdf-modal-overlay')) {
            return;
        }
        
        const modalHTML = `
            <div class="pdf-modal-overlay" id="pdf-modal-overlay">
                <div class="pdf-modal-container">
                    <div class="pdf-modal-header">
                        <h3 id="pdf-modal-title">Visualizando PDF</h3>
                        <button class="pdf-modal-close" onclick="veloAcademyApp.closePDFModal()" aria-label="Fechar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="pdf-modal-body">
                        <canvas id="pdf-canvas"></canvas>
                    </div>
                    <div class="pdf-modal-footer">
                        <div class="pdf-modal-progress">
                            <div class="pdf-progress-bar">
                                <div class="pdf-progress-fill" id="pdf-progress-fill"></div>
                            </div>
                            <span id="pdf-page-info">Página 1 de 1</span>
                        </div>
                        <div class="pdf-modal-controls">
                            <button class="btn btn-secondary" id="pdf-btn-prev" onclick="veloAcademyApp.previousPDFPage()" disabled>
                                <i class="fas fa-arrow-left"></i> Anterior
                            </button>
                            <button class="btn btn-primary" id="pdf-btn-next" onclick="veloAcademyApp.nextPDFPage()">
                                Próxima <i class="fas fa-arrow-right"></i>
                            </button>
                            <button class="btn btn-success" id="pdf-btn-finish" onclick="veloAcademyApp.finishPDFViewing()" style="display: none;">
                                Finalizar <i class="fas fa-check"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners para fechar modal
        const overlay = document.getElementById('pdf-modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closePDFModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                this.closePDFModal();
            }
        });
    },
    
    // Abrir modal PDF
    async openPDFModal(pdfUrl, subtitle, lessonTitle, courseId = null, moduleId = null) {
        const overlay = document.getElementById('pdf-modal-overlay');
        const titleElement = document.getElementById('pdf-modal-title');
        const canvas = document.getElementById('pdf-canvas');
        
        if (!overlay || !titleElement || !canvas) {
            this.createPDFModal();
            // Aguardar criação e tentar novamente
            setTimeout(() => this.openPDFModal(pdfUrl, subtitle, lessonTitle, courseId, moduleId), 100);
            return;
        }
        
        // Converter URL do Google Drive para URL direta
        let directUrl = this.convertGoogleDriveToDirect(pdfUrl);
        
        // Tentar obter courseId e moduleId do contexto atual se não fornecidos
        if (!courseId) {
            const courseView = document.getElementById('course-view');
            if (courseView && courseView.dataset.courseId) {
                courseId = courseView.dataset.courseId;
            }
        }
        
        // Salvar metadata
        this.pdfMetadata = { subtitle, lessonTitle, pdfUrl: directUrl, courseId, moduleId };
        
        // Configurar PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        } else {
            console.error('PDF.js não carregado');
            alert('Erro ao carregar biblioteca PDF. Recarregue a página.');
            return;
        }
        
        try {
            // Tentar carregar PDF diretamente primeiro
            let pdfDocument;
            try {
                const loadingTask = pdfjsLib.getDocument({
                    url: directUrl,
                    httpHeaders: {},
                    withCredentials: false
                });
                pdfDocument = await loadingTask.promise;
            } catch (directError) {
                console.warn('Erro ao carregar PDF diretamente, tentando via blob:', directError);
                
                // Tentar carregar via blob (resolve problemas de CORS)
                const blobUrl = await this.loadPDFAsBlob(directUrl);
                if (blobUrl) {
                    const loadingTask = pdfjsLib.getDocument({
                        url: blobUrl,
                        httpHeaders: {},
                        withCredentials: false
                    });
                    pdfDocument = await loadingTask.promise;
                } else {
                    // Se blob também falhar, tentar URL alternativa do Google Drive
                    const fileId = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                    if (fileId) {
                        // Tentar URL alternativa de download (com confirmação)
                        const altUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
                        try {
                            const loadingTask = pdfjsLib.getDocument({
                                url: altUrl,
                                httpHeaders: {},
                                withCredentials: false
                            });
                            pdfDocument = await loadingTask.promise;
                        } catch (altError) {
                            console.warn('URL alternativa também falhou:', altError);
                            throw directError; // Re-throw erro original
                        }
                    } else {
                        throw directError;
                    }
                }
            }
            
            this.currentPDF = pdfDocument;
            this.totalPDFPages = this.currentPDF.numPages;
            this.currentPDFPage = 1;
            
            // Atualizar título
            titleElement.textContent = lessonTitle || 'Visualizando PDF';
            
            // Renderizar primeira página
            await this.renderPDFPage(1);
            
            // Prevenir scroll do body quando modal estiver aberto
            document.body.style.overflow = 'hidden';
            
            // Mostrar modal
            overlay.classList.add('active');
            
            // Atualizar controles
            this.updatePDFControls();
            
        } catch (error) {
            console.error('Erro ao carregar PDF:', error);
            
            // Se falhar, oferecer opção de abrir no Google Drive
            const fileId = pdfUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (fileId) {
                const shouldOpen = confirm(
                    'Não foi possível carregar o PDF diretamente devido a restrições de segurança.\n\n' +
                    'Deseja abrir o PDF no Google Drive para visualização?'
                );
                
                if (shouldOpen) {
                    window.open(`https://drive.google.com/file/d/${fileId}/view`, '_blank');
                }
            } else {
                alert('Erro ao carregar PDF. Verifique se o link está correto.');
            }
        }
    },
    
    // Converter URL do Google Drive para URL de download direto
    convertGoogleDriveToDirect(url) {
        // Extrair ID do arquivo do Google Drive
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match) {
            const fileId = match[1];
            // Usar URL de download direto que funciona melhor com PDF.js
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return url;
    },
    
    // Carregar PDF via fetch usando proxy CORS ou método alternativo
    async loadPDFAsBlob(url) {
        try {
            // Tentar múltiplas estratégias
            const strategies = [
                // Estratégia 1: Tentar diretamente
                async () => {
                    const response = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.blob();
                },
                // Estratégia 2: Usar proxy CORS público (se disponível)
                async () => {
                    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
                    const response = await fetch(proxyUrl, {
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'omit'
                    });
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return await response.blob();
                }
            ];
            
            for (const strategy of strategies) {
                try {
                    const blob = await strategy();
                    return URL.createObjectURL(blob);
                } catch (err) {
                    console.warn('Estratégia falhou, tentando próxima...', err);
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao carregar PDF como blob:', error);
            return null;
        }
    },
    
    // Renderizar página específica do PDF
    async renderPDFPage(pageNumber) {
        if (!this.currentPDF || pageNumber < 1 || pageNumber > this.totalPDFPages) {
            return;
        }
        
        try {
            const page = await this.currentPDF.getPage(pageNumber);
            const canvas = document.getElementById('pdf-canvas');
            const context = canvas.getContext('2d');
            
            // Calcular escala para caber no container
            const container = canvas.parentElement; // .pdf-modal-body
            const modalContainer = container.closest('.pdf-modal-container');
            
            // Aguardar múltiplos frames para garantir que as dimensões estejam totalmente atualizadas
            await new Promise(resolve => requestAnimationFrame(resolve));
            await new Promise(resolve => requestAnimationFrame(resolve));
            
            // Obter dimensões reais usando getBoundingClientRect para valores precisos
            const modalRect = modalContainer.getBoundingClientRect();
            const headerElement = modalContainer.querySelector('.pdf-modal-header');
            const footerElement = modalContainer.querySelector('.pdf-modal-footer');
            const headerRect = headerElement.getBoundingClientRect();
            const footerRect = footerElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            // Calcular espaço disponível real
            // Usar viewport como referência máxima para garantir que não ultrapasse
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Altura máxima do modal = viewport - padding do overlay (20px top + 20px bottom)
            const maxModalHeight = viewportHeight - 40;
            const actualModalHeight = Math.min(modalRect.height, maxModalHeight);
            
            const headerHeight = headerRect.height;
            const footerHeight = footerRect.height;
            const containerWidth = Math.min(containerRect.width - 32, viewportWidth - 40); // padding 16px de cada lado
            
            // Altura disponível = altura real do modal - header - footer - padding do body
            const maxAvailableHeight = actualModalHeight - headerHeight - footerHeight - 32; // 32px = padding do body (16px top + 16px bottom)
            const maxAvailableWidth = containerWidth;
            
            // Garantir valores válidos (mínimos razoáveis)
            const safeHeight = Math.max(maxAvailableHeight, 150);
            const safeWidth = Math.max(maxAvailableWidth, 250);
            
            const viewport = page.getViewport({ scale: 1.0 });
            
            // Calcular scale baseado no espaço disponível real
            const scaleX = safeWidth / viewport.width;
            const scaleY = safeHeight / viewport.height;
            const scale = Math.min(scaleX, scaleY, 0.8); // Limitar a 0.8x para garantir margem
            
            const scaledViewport = page.getViewport({ scale });
            
            // Definir dimensões do canvas respeitando os limites calculados
            canvas.width = Math.min(scaledViewport.width, safeWidth);
            canvas.height = Math.min(scaledViewport.height, safeHeight);
            
            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport
            };
            
            await page.render(renderContext).promise;
            
            // Atualizar informações
            this.currentPDFPage = pageNumber;
            this.updatePDFProgress();
            
        } catch (error) {
            console.error('Erro ao renderizar página:', error);
        }
    },
    
    // Atualizar barra de progresso do PDF
    updatePDFProgress() {
        const progressFill = document.getElementById('pdf-progress-fill');
        const pageInfo = document.getElementById('pdf-page-info');
        
        if (progressFill && this.totalPDFPages > 0) {
            const progress = (this.currentPDFPage / this.totalPDFPages) * 100;
            progressFill.style.width = `${progress}%`;
        }
        
        if (pageInfo) {
            pageInfo.textContent = `Página ${this.currentPDFPage} de ${this.totalPDFPages}`;
        }
    },
    
    // Atualizar controles do PDF
    updatePDFControls() {
        const prevBtn = document.getElementById('pdf-btn-prev');
        const nextBtn = document.getElementById('pdf-btn-next');
        const finishBtn = document.getElementById('pdf-btn-finish');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentPDFPage <= 1;
        }
        
        if (nextBtn && finishBtn) {
            const isLastPage = this.currentPDFPage >= this.totalPDFPages;
            nextBtn.style.display = isLastPage ? 'none' : 'inline-block';
            finishBtn.style.display = isLastPage ? 'inline-block' : 'none';
        }
    },
    
    // Navegar para página anterior do PDF
    async previousPDFPage() {
        if (this.currentPDFPage > 1) {
            await this.renderPDFPage(this.currentPDFPage - 1);
            this.updatePDFControls();
        }
    },
    
    // Navegar para próxima página do PDF
    async nextPDFPage() {
        if (this.currentPDFPage < this.totalPDFPages) {
            await this.renderPDFPage(this.currentPDFPage + 1);
            this.updatePDFControls();
        }
    },
    
    // Finalizar visualização do PDF (marca como completo apenas aqui)
    async finishPDFViewing() {
        if (this.pdfMetadata) {
            // Obter lista completa de aulas do subtítulo para validação
            let allLessonTitles = null;
            const subtitle = this.pdfMetadata.subtitle;
            
            // Tentar obter courseId e moduleId do contexto atual
            // Se não estiver disponível, buscar do curso aberto
            let courseId = this.pdfMetadata.courseId;
            let moduleId = this.pdfMetadata.moduleId;
            
            if (!courseId) {
                // Tentar obter do curso atual aberto
                const courseView = document.getElementById('course-view');
                if (courseView && courseView.dataset.courseId) {
                    courseId = courseView.dataset.courseId;
                }
            }
            
            if (courseId && subtitle) {
                const course = this.courseDatabase[courseId];
                if (course) {
                    // Buscar em todos os módulos
                    for (const module of course.modules || []) {
                        const section = module.sections?.find(s => s.subtitle === subtitle);
                        if (section) {
                            allLessonTitles = [];
                            // SEMPRE adicionar cada título individualmente (nunca usar "Aula em vídeo")
                            const sectionVideos = section.lessons?.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath)) || [];
                            sectionVideos.forEach(video => {
                                allLessonTitles.push(video.title);
                            });
                            // Adicionar outras aulas (PDFs, documentos, vídeos Google Drive, etc)
                            section.lessons?.forEach(lesson => {
                                if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                                    (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                                    allLessonTitles.push(lesson.title);
                                }
                            });
                            break;
                        }
                    }
                }
            }
            
            console.log('📚 Lista completa de aulas para validação:', allLessonTitles);
            
            // Marcar aula como completa APENAS quando clicar em Finalizar
            await this.markLessonComplete(
                subtitle,
                this.pdfMetadata.lessonTitle,
                allLessonTitles
            );
            
            // Atualizar botão do quiz sem recarregar o curso
            if (courseId && subtitle) {
                console.log('🔄 Tentando atualizar botão do quiz (PDF):', { courseId, moduleId, subtitle });
                const course = this.courseDatabase[courseId];
                if (course) {
                    // Encontrar índices do módulo e seção
                    let moduleIndex = -1;
                    let sectionIndex = -1;
                    
                    // Se moduleId é um número (índice), usar diretamente
                    if (typeof moduleId === 'number') {
                        moduleIndex = moduleId;
                        const module = course.modules?.[moduleIndex];
                        if (module) {
                            module.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    sectionIndex = secIdx;
                                }
                            });
                        }
                    } else {
                        // Buscar pelo ID ou título
                        course.modules.forEach((mod, modIdx) => {
                            if (mod.id === moduleId || mod.title === moduleId) {
                                moduleIndex = modIdx;
                                mod.sections?.forEach((sec, secIdx) => {
                                    if (sec.subtitle === subtitle) {
                                        sectionIndex = secIdx;
                                    }
                                });
                            }
                        });
                    }
                    
                    // Se não encontrou pelo moduleId, buscar em todos os módulos
                    if (moduleIndex === -1 || sectionIndex === -1) {
                        console.log('🔍 Buscando em todos os módulos (PDF)...');
                        course.modules.forEach((mod, modIdx) => {
                            mod.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    moduleIndex = modIdx;
                                    sectionIndex = secIdx;
                                    console.log(`✅ Encontrado: módulo ${moduleIndex}, seção ${sectionIndex}`);
                                }
                            });
                        });
                    }
                    
                    console.log('📊 Índices encontrados (PDF):', { moduleIndex, sectionIndex });
                    
                    if (moduleIndex !== -1 && sectionIndex !== -1) {
                        await this.updateQuizButton(subtitle, courseId, moduleIndex, sectionIndex);
                    } else {
                        console.error('❌ Não foi possível encontrar índices do módulo/seção (PDF)');
                    }
                } else {
                    console.error('❌ Curso não encontrado (PDF):', courseId);
                }
            } else {
                console.error('❌ Dados insuficientes para atualizar quiz (PDF):', { courseId, subtitle });
            }
        }
        
        this.closePDFModal();
    },
    
    // Fechar modal PDF
    closePDFModal() {
        const overlay = document.getElementById('pdf-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Restaurar scroll do body
        document.body.style.overflow = '';
        
        // Limpar PDF atual
        this.currentPDF = null;
        this.currentPDFPage = 1;
        this.totalPDFPages = 0;
        this.pdfMetadata = null;
        
        // Limpar canvas
        const canvas = document.getElementById('pdf-canvas');
        if (canvas) {
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    },
    
    // Função para abrir PDF no modal (substitui downloadFile para PDFs)
    openPDFInModal(pdfUrl, subtitle, lessonTitle, courseId = null, moduleId = null) {
        this.openPDFModal(pdfUrl, subtitle, lessonTitle, courseId, moduleId);
    },
    
    // ==================== MODAL DE AULA (GOOGLE SLIDES) ====================
    
    // Criar estrutura HTML do modal de Aula dinamicamente
    createAulaModal() {
        // Verificar se o modal já existe
        if (document.getElementById('aula-modal-overlay')) {
            return;
        }
        
        const modalHTML = `
            <div class="aula-modal-overlay" id="aula-modal-overlay">
                <div class="aula-modal-container">
                    <div class="aula-modal-header">
                        <h3 id="aula-modal-title">Aula</h3>
                        <button class="aula-modal-close" onclick="veloAcademyApp.closeAulaModal()" aria-label="Fechar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="aula-modal-body">
                        <iframe 
                            id="aula-slides-iframe" 
                            src="" 
                            frameborder="0" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="aula-modal-footer" id="aula-modal-footer">
                        <button class="btn btn-secondary" id="aula-btn-prev" onclick="veloAcademyApp.previousAulaSlide()" style="display: none;">
                            <i class="fas fa-arrow-left"></i> Anterior
                        </button>
                        <div class="aula-modal-progress">
                            <div class="aula-progress-bar">
                                <div class="aula-progress-fill" id="aula-progress-fill"></div>
                            </div>
                            <span id="aula-slide-counter">1 / 1</span>
                        </div>
                        <button class="btn btn-primary" id="aula-btn-next" onclick="veloAcademyApp.nextAulaSlide()" style="display: none;">
                            Próximo <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="btn btn-success" id="aula-btn-finish" onclick="veloAcademyApp.finishAulaViewing()" style="display: none;">
                            Finalizar <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Adicionar event listeners
        const overlay = document.getElementById('aula-modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeAulaModal();
                }
            });
        }
        
        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay && overlay.classList.contains('active')) {
                this.closeAulaModal();
            }
        });
    },
    
    // Abrir modal de Aula com Google Slides
    openAulaModal(slidesUrl, subtitle, lessonTitle, courseId = null, moduleId = null) {
        // Criar modal se não existir
        this.createAulaModal();
        
        const overlay = document.getElementById('aula-modal-overlay');
        const titleElement = document.getElementById('aula-modal-title');
        const iframe = document.getElementById('aula-slides-iframe');
        
        if (!overlay || !titleElement || !iframe) {
            setTimeout(() => this.openAulaModal(slidesUrl, subtitle, lessonTitle, courseId, moduleId), 100);
            return;
        }
        
        // Tentar obter courseId e moduleId do contexto atual se não fornecidos
        if (!courseId) {
            const courseView = document.getElementById('course-view');
            if (courseView && courseView.dataset.courseId) {
                courseId = courseView.dataset.courseId;
                moduleId = courseView.dataset.moduleId || moduleId;
            }
        }
        
        // Salvar metadata
        this.currentAulaMetadata = { subtitle, lessonTitle, slidesUrl, courseId, moduleId };
        
        // Verificar se já é URL de embed otimizada (/pub ou /pubembed)
        let embedUrl = slidesUrl;
        const isEmbedUrl = slidesUrl.includes('/pubembed') || slidesUrl.includes('/pub');
        
        if (!isEmbedUrl) {
            // Tentar extrair ID e converter para preview
            const slidesId = this.extractGoogleSlidesId(slidesUrl);
            
            if (slidesId) {
                // Se for Google Slides, usar URL de preview
                embedUrl = `https://docs.google.com/presentation/d/${slidesId}/preview`;
            } else if (this.isGoogleDriveLink(slidesUrl)) {
                // Se for Google Drive (pode ser PDF ou outro arquivo), usar visualização
                const driveId = slidesUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                if (driveId) {
                    embedUrl = `https://drive.google.com/file/d/${driveId}/preview`;
                }
            }
            // Se não conseguir converter, usar URL original
        }
        // Se já for embed URL (/pub ou /pubembed), usar diretamente
        
        // Configurar iframe
        iframe.src = embedUrl;
        
        // Atualizar título
        titleElement.textContent = lessonTitle || 'Aula';
        
        // Por enquanto, mostrar apenas botão Finalizar (slides não têm navegação página a página via API)
        // Em uma implementação futura, pode-se usar Google Slides API para navegação
        const prevBtn = document.getElementById('aula-btn-prev');
        const nextBtn = document.getElementById('aula-btn-next');
        const finishBtn = document.getElementById('aula-btn-finish');
        
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (finishBtn) finishBtn.style.display = 'inline-block';
        
        // Atualizar progresso (100% quando visualizando)
        this.updateAulaProgress(100);
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    },
    
    // Atualizar barra de progresso da Aula
    updateAulaProgress(percentage) {
        const progressFill = document.getElementById('aula-progress-fill');
        const slideCounter = document.getElementById('aula-slide-counter');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (slideCounter) {
            slideCounter.textContent = 'Visualizando';
        }
    },
    
    // Navegar para slide anterior (futuro - requer Google Slides API)
    previousAulaSlide() {
        // Implementação futura com Google Slides API
        console.log('Navegação anterior - requer Google Slides API');
    },
    
    // Navegar para próximo slide (futuro - requer Google Slides API)
    nextAulaSlide() {
        // Implementação futura com Google Slides API
        console.log('Navegação próximo - requer Google Slides API');
    },
    
    // Finalizar visualização da Aula
    async finishAulaViewing() {
        if (this.currentAulaMetadata) {
            // Obter lista completa de aulas do subtítulo para validação
            let allLessonTitles = null;
            const subtitle = this.currentAulaMetadata.subtitle;
            const courseId = this.currentAulaMetadata.courseId;
            const moduleId = this.currentAulaMetadata.moduleId;
            
            if (courseId && subtitle) {
                const course = this.courseDatabase[courseId];
                if (course) {
                    const module = course.modules?.find(m => m.id === moduleId || m.title === moduleId);
                    if (module) {
                        const section = module.sections?.find(s => s.subtitle === subtitle);
                        if (section) {
                            allLessonTitles = [];
                            // SEMPRE adicionar cada título individualmente (nunca usar "Aula em vídeo")
                            const sectionVideos = section.lessons?.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath)) || [];
                            sectionVideos.forEach(video => {
                                allLessonTitles.push(video.title);
                            });
                            // Adicionar outras aulas (PDFs, documentos, vídeos Google Drive, slides, etc)
                            section.lessons?.forEach(lesson => {
                                if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                                    lesson.type === 'slide' || (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                                    allLessonTitles.push(lesson.title);
                                }
                            });
                        }
                    }
                }
            }
            
            console.log('📚 Lista completa de aulas para validação:', allLessonTitles);
            
            // Marcar aula como completa
            await this.markLessonComplete(
                subtitle,
                this.currentAulaMetadata.lessonTitle,
                allLessonTitles
            );
            
            // Atualizar botão do quiz sem recarregar o curso
            if (courseId && subtitle) {
                console.log('🔄 Tentando atualizar botão do quiz (Aula):', { courseId, moduleId, subtitle });
                const course = this.courseDatabase[courseId];
                if (course) {
                    // Encontrar índices do módulo e seção
                    let moduleIndex = -1;
                    let sectionIndex = -1;
                    
                    // Se moduleId é um número (índice), usar diretamente
                    if (typeof moduleId === 'number') {
                        moduleIndex = moduleId;
                        const module = course.modules?.[moduleIndex];
                        if (module) {
                            module.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    sectionIndex = secIdx;
                                }
                            });
                        }
                    } else {
                        // Buscar pelo ID ou título
                        course.modules.forEach((mod, modIdx) => {
                            if (mod.id === moduleId || mod.title === moduleId) {
                                moduleIndex = modIdx;
                                mod.sections?.forEach((sec, secIdx) => {
                                    if (sec.subtitle === subtitle) {
                                        sectionIndex = secIdx;
                                    }
                                });
                            }
                        });
                    }
                    
                    // Se não encontrou pelo moduleId, buscar em todos os módulos
                    if (moduleIndex === -1 || sectionIndex === -1) {
                        console.log('🔍 Buscando em todos os módulos (Aula)...');
                        course.modules.forEach((mod, modIdx) => {
                            mod.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    moduleIndex = modIdx;
                                    sectionIndex = secIdx;
                                    console.log(`✅ Encontrado: módulo ${moduleIndex}, seção ${sectionIndex}`);
                                }
                            });
                        });
                    }
                    
                    console.log('📊 Índices encontrados (Aula):', { moduleIndex, sectionIndex });
                    
                    if (moduleIndex !== -1 && sectionIndex !== -1) {
                        await this.updateQuizButton(subtitle, courseId, moduleIndex, sectionIndex);
                    } else {
                        console.error('❌ Não foi possível encontrar índices do módulo/seção (Aula)');
                    }
                } else {
                    console.error('❌ Curso não encontrado (Aula):', courseId);
                }
            } else {
                console.error('❌ Dados insuficientes para atualizar quiz (Aula):', { courseId, subtitle });
            }
        }
        
        this.closeAulaModal();
    },
    
    // ==================== MODAL DE VÍDEO GOOGLE DRIVE ====================
    
    // Criar estrutura HTML do modal de vídeo Google Drive dinamicamente
    createGoogleDriveVideoModal() {
        // Verificar se o modal já existe
        if (document.getElementById('googledrive-video-modal-overlay')) {
            return;
        }
        
        const modalHTML = `
            <div class="googledrive-video-modal-overlay" id="googledrive-video-modal-overlay">
                <div class="googledrive-video-modal-container">
                    <div class="googledrive-video-modal-header">
                        <h3 id="googledrive-video-modal-title">Vídeo</h3>
                        <button class="googledrive-video-modal-close" onclick="veloAcademyApp.closeGoogleDriveVideoModal()" aria-label="Fechar modal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="googledrive-video-modal-body">
                        <iframe 
                            id="googledrive-video-iframe" 
                            src="" 
                            frameborder="0" 
                            allowfullscreen>
                        </iframe>
                    </div>
                    <div class="googledrive-video-modal-footer">
                        <button class="btn btn-success" id="googledrive-video-btn-finish" onclick="veloAcademyApp.finishGoogleDriveVideoViewing()">
                            Finalizar <i class="fas fa-check"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar ao body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners para fechar modal
        const overlay = document.getElementById('googledrive-video-modal-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.closeGoogleDriveVideoModal();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                this.closeGoogleDriveVideoModal();
            }
        });
    },
    
    // Abrir modal de vídeo Google Drive
    openGoogleDriveVideoModal(videoUrl, subtitle, lessonTitle, courseId = null, moduleId = null) {
        // Criar modal se não existir
        this.createGoogleDriveVideoModal();
        
        const overlay = document.getElementById('googledrive-video-modal-overlay');
        const titleElement = document.getElementById('googledrive-video-modal-title');
        const iframe = document.getElementById('googledrive-video-iframe');
        
        if (!overlay || !titleElement || !iframe) {
            setTimeout(() => this.openGoogleDriveVideoModal(videoUrl, subtitle, lessonTitle, courseId, moduleId), 100);
            return;
        }
        
        // Tentar obter courseId e moduleId do contexto atual se não fornecidos
        if (!courseId) {
            const courseView = document.getElementById('course-view');
            if (courseView && courseView.dataset.courseId) {
                courseId = courseView.dataset.courseId;
                moduleId = courseView.dataset.moduleId || moduleId;
            }
        }
        
        // Salvar metadata
        this.googleDriveVideoMetadata = { subtitle, lessonTitle, videoUrl, courseId, moduleId };
        
        // Converter URL do Google Drive para URL de visualização/preview
        let previewUrl = videoUrl;
        if (this.isGoogleDriveLink(videoUrl)) {
            // Tentar converter para URL de preview
            const driveId = videoUrl.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
            if (driveId) {
                previewUrl = `https://drive.google.com/file/d/${driveId}/preview`;
            }
        }
        
        // Configurar título e iframe
        titleElement.textContent = lessonTitle;
        iframe.src = previewUrl;
        
        // Mostrar modal
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        console.log('📹 Modal de vídeo Google Drive aberto:', { subtitle, lessonTitle, videoUrl: previewUrl });
    },
    
    // Finalizar visualização do vídeo Google Drive
    async finishGoogleDriveVideoViewing() {
        if (this.googleDriveVideoMetadata) {
            // Obter lista completa de aulas do subtítulo para validação
            let allLessonTitles = null;
            const subtitle = this.googleDriveVideoMetadata.subtitle;
            const courseId = this.googleDriveVideoMetadata.courseId;
            const moduleId = this.googleDriveVideoMetadata.moduleId;
            
            if (courseId && subtitle) {
                const course = this.courseDatabase[courseId];
                if (course) {
                    // Encontrar módulo
                    let module = null;
                    if (typeof moduleId === 'number') {
                        module = course.modules?.[moduleId];
                    } else {
                        module = course.modules?.find(m => m.id === moduleId || m.title === moduleId);
                    }
                    
                    if (module) {
                        const section = module.sections?.find(s => s.subtitle === subtitle);
                        if (section) {
                            allLessonTitles = [];
                            // Adicionar aulas de vídeo YouTube
                            const sectionVideos = section.lessons?.filter(l => l.type === 'video' && this.isYouTubeLink(l.filePath)) || [];
                            sectionVideos.forEach(video => {
                                allLessonTitles.push(video.title);
                            });
                            // Adicionar outras aulas (PDFs, documentos, vídeos Google Drive, slides, etc)
                            section.lessons?.forEach(lesson => {
                                if (lesson.type === 'pdf' || lesson.type === 'document' || lesson.type === 'audio' || 
                                    lesson.type === 'slide' || (lesson.type === 'video' && !this.isYouTubeLink(lesson.filePath))) {
                                    allLessonTitles.push(lesson.title);
                                }
                            });
                        }
                    }
                }
            }
            
            console.log('📚 Lista completa de aulas para validação:', allLessonTitles);
            
            // Marcar aula como completa
            await this.markLessonComplete(
                subtitle,
                this.googleDriveVideoMetadata.lessonTitle,
                allLessonTitles
            );
            
            // Atualizar botão do quiz sem recarregar o curso
            if (courseId && subtitle) {
                console.log('🔄 Tentando atualizar botão do quiz (Google Drive Video):', { courseId, moduleId, subtitle });
                const course = this.courseDatabase[courseId];
                if (course) {
                    // Encontrar índices do módulo e seção
                    let moduleIndex = -1;
                    let sectionIndex = -1;
                    
                    // Se moduleId é um número (índice), usar diretamente
                    if (typeof moduleId === 'number') {
                        moduleIndex = moduleId;
                        const module = course.modules?.[moduleIndex];
                        if (module) {
                            module.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    sectionIndex = secIdx;
                                }
                            });
                        }
                    } else {
                        // Buscar pelo ID ou título
                        course.modules.forEach((mod, modIdx) => {
                            if (mod.id === moduleId || mod.title === moduleId) {
                                moduleIndex = modIdx;
                                mod.sections?.forEach((sec, secIdx) => {
                                    if (sec.subtitle === subtitle) {
                                        sectionIndex = secIdx;
                                    }
                                });
                            }
                        });
                    }
                    
                    // Se não encontrou pelo moduleId, buscar em todos os módulos
                    if (moduleIndex === -1 || sectionIndex === -1) {
                        console.log('🔍 Buscando em todos os módulos (Google Drive Video)...');
                        course.modules.forEach((mod, modIdx) => {
                            mod.sections?.forEach((sec, secIdx) => {
                                if (sec.subtitle === subtitle) {
                                    moduleIndex = modIdx;
                                    sectionIndex = secIdx;
                                    console.log(`✅ Encontrado: módulo ${moduleIndex}, seção ${sectionIndex}`);
                                }
                            });
                        });
                    }
                    
                    console.log('📊 Índices encontrados (Google Drive Video):', { moduleIndex, sectionIndex });
                    
                    if (moduleIndex !== -1 && sectionIndex !== -1) {
                        await this.updateQuizButton(subtitle, courseId, moduleIndex, sectionIndex);
                    } else {
                        console.error('❌ Não foi possível encontrar índices do módulo/seção (Google Drive Video)');
                    }
                } else {
                    console.error('❌ Curso não encontrado (Google Drive Video):', courseId);
                }
            } else {
                console.error('❌ Dados insuficientes para atualizar quiz (Google Drive Video):', { courseId, subtitle });
            }
        }
        
        this.closeGoogleDriveVideoModal();
    },
    
    // Fechar modal de vídeo Google Drive
    closeGoogleDriveVideoModal() {
        const overlay = document.getElementById('googledrive-video-modal-overlay');
        const iframe = document.getElementById('googledrive-video-iframe');
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        if (iframe) {
            iframe.src = '';
        }
        
        // Limpar metadata
        this.googleDriveVideoMetadata = null;
        
        // Restaurar scroll do body
        document.body.style.overflow = '';
    },
    
    // Fechar modal de Aula
    closeAulaModal() {
        const overlay = document.getElementById('aula-modal-overlay');
        const iframe = document.getElementById('aula-slides-iframe');
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        if (iframe) {
            iframe.src = '';
        }
        
        document.body.style.overflow = '';
        
        // Limpar metadata
        this.currentAulaSlides = null;
        this.currentAulaMetadata = null;
    },
    
    // Atualizar barra de progresso do YouTube
    updateYouTubeProgress() {
        const progressFill = document.getElementById('youtube-progress-fill');
        const counterElement = document.getElementById('youtube-video-counter');
        
        if (!this.currentVideoSequence || this.currentVideoSequence.length === 0) {
            return;
        }
        
        const totalVideos = this.currentVideoSequence.length;
        const currentVideo = this.currentVideoIndex + 1;
        const progress = (currentVideo / totalVideos) * 100;
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (counterElement) {
            counterElement.textContent = `${currentVideo} / ${totalVideos}`;
        }
    },
    

    switchView(viewId) {

        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));

        // Pequeno delay para garantir que a classe foi removida antes de adicionar a nova, ajudando na transição

        setTimeout(() => {

            document.getElementById(viewId).classList.add('active');

        }, 50);

    },

    initTheme() {

        const themeToggle = document.getElementById('theme-toggle');

        console.log('Theme toggle found:', themeToggle);
        const sunIcon = themeToggle.querySelector('.bx-sun');

        const moonIcon = themeToggle.querySelector('.bx-moon');

        console.log('Sun icon:', sunIcon, 'Moon icon:', moonIcon);
        const docElement = document.documentElement;

        const savedTheme = localStorage.getItem('theme') || 'light';

        docElement.setAttribute('data-theme', savedTheme);

        const updateIcons = (theme) => {
            if (sunIcon && moonIcon) {
                if (theme === 'light') {
                    sunIcon.classList.add('active');
                    moonIcon.classList.remove('active');
                } else {
                    sunIcon.classList.remove('active');
                    moonIcon.classList.add('active');
                }
            }
        };

        updateIcons(savedTheme);

        themeToggle.addEventListener('click', () => {

            const currentTheme = docElement.getAttribute('data-theme');

            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            
            docElement.setAttribute('data-theme', newTheme);

            localStorage.setItem('theme', newTheme);

            updateIcons(newTheme);

        });

    },

    toggleAccordion(accordionId) {

        const accordion = document.getElementById(accordionId);

        const header = document.querySelector(`[onclick*="${accordionId}"]`);

        
        if (!accordion || !header) return;

        
        const isActive = accordion.classList.contains('active');

        
        if (isActive) {

            // Fecha o acordeão

            accordion.classList.remove('active');

            header.classList.remove('active');

        } else {

            // Abre o acordeão

            accordion.classList.add('active');

            header.classList.add('active');

        }

    },

    downloadFile(url, filename) {

        // Função para fazer download de arquivos

        try {

            // Criar um elemento <a> temporário

            const link = document.createElement('a');

            link.href = url;

            link.download = filename || 'documento.pdf';

            link.target = '_blank';

            
            // Adicionar ao DOM, clicar e remover

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            
            console.log('Download iniciado:', filename);

        } catch (error) {

            console.error('Erro ao fazer download:', error);

            // Fallback: abrir em nova aba

            window.open(url, '_blank');

        }

    },


    initUserInfo() {
        console.log('=== Inicializando informações do usuário ===');
        const userName = localStorage.getItem('userName');
        const userPicture = localStorage.getItem('userPicture');
        
        console.log('Dados do localStorage:', { userName, userPicture });
        
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        console.log('Elemento user-name encontrado:', !!userNameElement);
        if (userNameElement) {
            userNameElement.textContent = userName || 'Usuário';
            console.log('Nome do usuário atualizado:', userName);
            console.log('Texto atual do elemento:', userNameElement.textContent);
        } else {
            console.error('Elemento user-name não encontrado!');
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        console.log('Elemento user-avatar encontrado:', !!userAvatar);
        if (userAvatar) {
            if (userPicture) {
                userAvatar.src = userPicture;
                userAvatar.style.display = 'block';
                console.log('Avatar do usuário atualizado:', userPicture);
            } else {
                userAvatar.style.display = 'none';
                const userInfo = document.getElementById('user-info');
                if (userInfo) {
                    userInfo.classList.add('no-avatar');
                }
                console.log('Avatar oculto - sem foto');
            }
        } else {
            console.error('Elemento user-avatar não encontrado!');
        }
        
        // Garantir que o elemento user-info esteja visível
        const userInfo = document.getElementById('user-info');
        console.log('Elemento user-info encontrado:', !!userInfo);
        if (userInfo) {
            userInfo.style.display = 'flex';
            console.log('Display do user-info definido como flex');
        }
    },

    initLogout() {
        console.log('=== Inicializando logout ===');
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('Logout clicado');
                // Limpar dados do usuário
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
                localStorage.removeItem('userPicture');
                localStorage.removeItem('dadosAtendenteChatbot');
                
                // Redirecionar para página inicial
                window.location.href = './index.html';
            });
            console.log('Event listener de logout adicionado');
        }
    }

};

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando VeloAcademy...');
    // Pequeno delay para garantir que todos os elementos estejam prontos
    setTimeout(() => {
        veloAcademyApp.init();
    }, 100);
});












