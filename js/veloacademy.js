const veloAcademyApp = {

    courseDatabase: {},

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

        this.renderCourses();
        console.log('Courses rendered');

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
        
        console.log('=== VeloAcademy app inicializado com sucesso ===');
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

    async loadCourses() {

        try {

            console.log('Loading courses from cursos.json...');
            const response = await fetch('./cursos.json');

            if (!response.ok) {

                throw new Error(`HTTP error! status: ${response.status}`);

            }

            const data = await response.json();
            console.log('Courses loaded successfully:', data);
            
            // Verificar se os dados foram carregados corretamente
            if (data && Object.keys(data).length > 0) {
                this.courseDatabase = data;
                console.log('Using cursos.json data');
            } else {
                throw new Error('Empty or invalid data from cursos.json');
            }

        } catch (error) {

            console.error('Erro ao carregar cursos:', error);

            console.log('Loading fallback courses...');
            this.loadFallbackCourses();

        }

    },

    loadFallbackCourses() {

        // Dados de fallback caso o fetch falhe

        this.courseDatabase = {

            'cs004': {

                title: 'Segurança da Informação para Colaboradores',

                description: 'Aprenda a proteger os dados da empresa e dos clientes contra ameaças digitais.',

                modules: [

                    {

                        title: 'Módulo 1: Conceitos Fundamentais',

                        lessons: [

                            { id: 'l7-1', title: 'O que é Segurança da Informação?', type: 'video', duration: '10 min', filePath: 'https://drive.google.com/file/d/1Svw_vrH7zKOKfZgxzJo8VUbdX-4P8yMq/view?usp=drive_link' },

                            { id: 'l7-2', title: 'Tipos de Ameaças (Phishing, Malware)', type: 'audio', duration: '15 min', filePath: 'https://drive.google.com/file/d/1muXEPK8hd-HxrftBL2nBoAagHxJuXd_D/view?usp=sharing' },

                            { id: 'l7-3', title: 'Política de Senhas Seguras', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/file/d/1JaTpyGK4FA_J-xoAv7YJ3m5ux-aIGIaL/view?usp=drive_link' },

                        ]

                    },

                    {

                        title: 'Módulo 2: Boas Práticas no Dia a Dia',

                        lessons: [

                            { id: 'l8-1', title: 'Navegação Segura e E-mails Confiáveis', type: 'video', duration: '12 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l8-2', title: 'Protegendo seu Ambiente de Trabalho', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l8-3', title: 'O que fazer em caso de incidente?', type: 'audio', duration: '10 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                        ]

                    }

                ]

            },

            'cs003': {

                title: 'Excelência no Atendimento ao Cliente',

                description: 'Transforme cada interação em uma oportunidade de encantar e fidelizar clientes.',

                modules: [

                    {

                        title: 'Módulo 1: A Mentalidade do Atendimento de Elite',

                        lessons: [

                            { id: 'l4-1', title: 'Comunicação Empática', type: 'audio', duration: '18 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l4-2', title: 'Linguagem Positiva e Eficaz', type: 'video', duration: '12 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l4-3', title: 'Guia Rápido de Tom de Voz', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                        ]

                    },

                    {

                        title: 'Módulo 2: Lidando com Situações Desafiadoras',

                        lessons: [

                            { id: 'l5-1', title: 'Técnicas de Resolução de Conflitos', type: 'video', duration: '22 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l5-2', title: 'Como Lidar com Clientes Irritados', type: 'audio', duration: '20 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                            { id: 'l5-3', title: 'Dizendo "Não" com Profissionalismo', type: 'video', duration: '10 min', filePath: 'https://drive.google.com/uc?export=view&id=YOUR_FILE_ID_HERE' },

                        ]

                    }

                ]

            },

            'onboarding': {

                title: 'Onboarding de Atendimento VeloTax',

                description: 'Aprenda os processos essenciais para um atendimento de excelência.',

                modules: [

                    {

                        title: 'Módulo 1: Treinamentos Essenciais',

                        sections: [

                            {

                                subtitle: 'Seja Bem Vindo',

                                lessons: [

                                    { id: 'l1-1', title: 'Bem vindo ao VeloAcademy', type: 'video', duration: '5 min', filePath: 'https://drive.google.com/file/d/1ZsiIxvii07xahTVTZURDENX4C3FVTEqf/view?usp=drive_link' },

                                    { id: 'l1-2', title: 'Sobre o Velotax', type: 'video', duration: '10 min', filePath: '#' },

                                    { id: 'l1-3', title: 'O Escritório', type: 'video', duration: '8 min', filePath: '#' }

                                ]

                            }

                        ]

                    },

                    {

                        title: 'Módulo 2: Atendimento Velotax',

                        sections: [

                            {

                                subtitle: 'CRM e Tabulação de Chamados',

                                lessons: [

                                    { id: 'l2-1', title: 'Aula - Conhecendo o CRM', type: 'video', duration: '15 min', filePath: 'https://drive.google.com/file/d/1etdywa9hD3pfZI9qH8QxMgmMCzO5IEG2/view?usp=drive_link' },

                                    { id: 'l2-2', title: 'Ebook - Tabulação', type: 'pdf', duration: 'Download', filePath: 'https://drive.google.com/file/d/1O4PCASfH6LmtjwCuLBZHMKdqGcsin7ja/view?usp=drive_link' }

                                ]

                            }

                        ]

                    }

                ]

            },

            'produtos': {

                title: 'Produtos Velotax',

                description: 'Conheça todos os produtos e serviços oferecidos pela Velotax.',

                modules: [

                    {

                        title: 'Módulo 1: Produtos de Crédito',

                        sections: [

                            {

                                subtitle: 'Crédito do Trabalhador',

                                lessons: [

                                    { id: 'p1-1', title: 'Aula - Crédito do Trabalhador', type: 'video', duration: '12 min', filePath: 'https://drive.google.com/file/d/1oyCZhnat7UAK8xACBwFJtILAIGaQJZsC/view?usp=drive_link' },

                                    { id: 'p1-2', title: 'Possíveis ocorrências - Crédito do Trabalhador', type: 'video', duration: '15 min', filePath: 'https://drive.google.com/file/d/1Rj-l_uSXo3GNMyLlb4Ypu35oZzCpIzRQ/view?usp=drive_link' },

                                    { id: 'p1-3', title: 'Ebook Crédito do Trabalhador', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/file/d/1uH8XemtAyqWDMc98kwneLNMNo6MoUWum/view?usp=drive_link' },

                                    { id: 'p1-4', title: 'Ebook - Pontos de atenção', type: 'pdf', duration: 'Download', filePath: 'https://drive.google.com/file/d/1YHyhpyaks91L6pcxbA7eo5Tnya27-SRR/view?usp=drive_link' }

                                ]

                            },

                            {

                                subtitle: 'Crédito Pessoal',

                                lessons: [

                                    { id: 'p2-1', title: 'Aula - Crédito Pessoal', type: 'video', duration: '12 min', filePath: 'https://drive.google.com/file/d/1vqNbxQ6kVe-ZpXC2Q2qbPYuWwVtai5N0/view?usp=drive_link' },

                                    { id: 'p2-2', title: 'Ebook Crédito Pessoal', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/file/d/1yjDZP8IoE5BM6gW1Ii4gvthdj9-4jCk0/view?usp=drive_link' }

                                ]

                            },

                            {

                                subtitle: 'Antecipação de Restituição',

                                lessons: [

                                    { id: 'p3-1', title: 'Em breve - Conteúdo sobre Antecipação da Restituição', type: 'document', duration: 'Em desenvolvimento', filePath: '#' }

                                ]

                            },

                            {

                                subtitle: 'Chaves PIX',

                                lessons: [

                                    { id: 'p4-1', title: 'Aula - Portabilidade PIX', type: 'video', duration: '15 min', filePath: 'https://drive.google.com/file/d/1cPKTzmdMqZAV2HfuoaaNNzNVCZyKM0y7/view?usp=drive_link' },

                                    { id: 'p4-2', title: 'Ebook Chave Pix', type: 'pdf', duration: 'Leitura', filePath: 'https://drive.google.com/file/d/1w_79ApBDP7Y_6gZjw3vQqeWhAbV9bV5B/view?usp=drive_link' }

                                ]

                            }

                        ]

                    },

                    {

                        title: 'Módulo 2: Produtos para Investidores',

                        sections: [

                            {

                                subtitle: 'VeloPrime',

                                lessons: [

                                    { id: 'p5-1', title: 'Em breve - Conteúdo sobre VeloPrime', type: 'document', duration: 'Em desenvolvimento', filePath: '#' }

                                ]

                            },

                            {

                                subtitle: 'Concierge',

                                lessons: [

                                    { id: 'p6-1', title: 'Em breve - Conteúdo sobre Concierge', type: 'document', duration: 'Em desenvolvimento', filePath: '#' }

                                ]

                            },

                            {

                                subtitle: 'VeloPay',

                                lessons: [

                                    { id: 'p7-1', title: 'Em breve - Conteúdo sobre VeloPay', type: 'document', duration: 'Em desenvolvimento', filePath: '#' }

                                ]

                            }

                        ]

                    }

                ]

            },

        };

    },

    renderCourses() {

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

            // Mostrar apenas onboarding e produtos
            if (courseId !== 'onboarding' && courseId !== 'produtos') {
                continue;
            }

            const course = this.courseDatabase[courseId];

            const card = document.createElement('div');

            card.className = 'course-card';

            card.setAttribute('data-course', courseId);

            card.style.animationDelay = `${index * 100}ms`;

            

            // Calcular estatísticas do curso

            const totalModules = course.modules.length;

            const totalLessons = this.countTotalLessons(course);

            const courseType = this.getCourseType(courseId);

            

            card.innerHTML = `

                <h3>${course.title}</h3>

                <p>${course.description}</p>

                <div class="course-meta">

                    <div class="course-stats">

                        <div class="course-stat">

                            <i class="fas fa-layer-group"></i>

                            <span>${totalModules} módulos</span>

                        </div>

                        <div class="course-stat">

                            <i class="fas fa-play-circle"></i>

                            <span>${totalLessons} aulas</span>

                        </div>

                    </div>

                    <div class="course-badge">${courseType}</div>

                </div>

            `;

            card.addEventListener('click', () => this.openCourse(courseId));

            coursesGrid.appendChild(card);

            index++;

        }

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

            case 'audio': return '<i class="fas fa-headphones-alt"></i>';

            case 'document': return '<i class="fas fa-file-alt"></i>';

            default: return '<i class="fas fa-book"></i>';

        }

    },

    openCourse(courseId) {

        const course = this.courseDatabase[courseId];

        if (!course) {

            console.error('Curso não encontrado:', courseId);

            return;

        }

        console.log('=== ABRINDO CURSO ===');
        console.log('Course ID:', courseId);
        console.log('Course:', course);

        console.log('Carregando curso:', course.title);

        console.log('Módulos encontrados:', course.modules.length);

        const courseView = document.getElementById('course-view');

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

                    

                    const accordionId = `accordion-${moduleIndex}-${sectionIndex}`;

                    

                    moduleHtml += `

                        <h4 class="module-subtitle" onclick="veloAcademyApp.toggleAccordion('${accordionId}')">

                            ${section.subtitle}

                            <i class="fas fa-chevron-down accordion-icon"></i>

                        </h4>

                    `;

                    

                    moduleHtml += `<div class="accordion-content" id="${accordionId}">`;

                    moduleHtml += '<ul class="modules-list">';

                    

                    section.lessons.forEach((lesson, lessonIndex) => {

                        const isLinkValid = this.validateLink(lesson.filePath);

                        const isGoogleDrive = this.isGoogleDriveLink(lesson.filePath);

                        const finalUrl = isGoogleDrive ? this.getGoogleDriveViewUrl(lesson.filePath) : lesson.filePath;

                        

                        console.log(`Aula ${lessonIndex + 1}:`, lesson.title);

                        console.log('Link original:', lesson.filePath);

                        console.log('Link final:', finalUrl);

                        console.log('É Google Drive:', isGoogleDrive);

                        console.log('Link válido:', isLinkValid);

                        

                        // Lógica específica para diferentes tipos de conteúdo

                        let linkClass, linkText, linkAction;

                        

                        if (!isLinkValid) {

                            linkClass = 'btn disabled';

                            linkText = 'Link Indisponível';

                            linkAction = 'onclick="return false;"';

                        } else if (lesson.type === 'pdf') {

                            // Para PDFs, usar download automático

                            linkClass = 'btn';

                            linkText = 'Baixar PDF';

                            linkAction = `href="${finalUrl}" download onclick="veloAcademyApp.downloadFile('${finalUrl}', '${lesson.title}')"`;

                        } else if (lesson.type === 'audio') {

                            // Para áudios/podcasts, usar botão "Ouvir"

                            linkClass = 'btn';

                            linkText = 'Ouvir';

                            linkAction = `href="${finalUrl}" target="_blank"`;

                        } else {

                            // Para vídeos e outros conteúdos

                            linkClass = 'btn';

                            linkText = 'Assistir';

                            linkAction = `href="${finalUrl}" target="_blank"`;

                        }

                        

                        // Adicionar ícone especial para Google Drive

                        const driveIcon = isGoogleDrive ? '<i class="fab fa-google-drive" style="margin-right: 5px;"></i>' : '';

                        

                        moduleHtml += `

                            <li>

                                <div class="lesson-info">

                                    ${this.getLessonIcon(lesson.type)}

                                    <div>

                                        <p>${lesson.title}</p>

                                        <span>${lesson.duration} ${isGoogleDrive ? '• Google Drive' : ''}</span>

                                    </div>

                                </div>

                                <a ${linkAction} class="${linkClass}">${driveIcon}${linkText}</a>

                            </li>

                        `;

                    });
                    
                    // Adicionar botão de quiz para seções específicas
                    if (section.subtitle === 'Crédito do Trabalhador' || section.subtitle === 'Chaves PIX' || section.subtitle === 'Crédito Pessoal' || section.subtitle === 'CRM e Tabulação de Chamados' || section.subtitle === 'Seguro Prestamista' || section.subtitle === 'Comunicação que Conecta') {
                        let quizCourseId;
                        if (section.subtitle === 'Crédito do Trabalhador') {
                            quizCourseId = 'credito';
                        } else if (section.subtitle === 'Chaves PIX') {
                            quizCourseId = 'pix';
                        } else if (section.subtitle === 'Crédito Pessoal') {
                            quizCourseId = 'creditoPessoal';
                        } else if (section.subtitle === 'CRM e Tabulação de Chamados') {
                            quizCourseId = 'tabulacao';
                        } else if (section.subtitle === 'Seguro Prestamista') {
                            quizCourseId = 'seguroPrestaCt';
                        } else if (section.subtitle === 'Comunicação que Conecta') {
                            quizCourseId = 'Exc Atendimento';
                        }
                        
                        console.log(`Adicionando quiz para seção: ${section.subtitle} com ID: ${quizCourseId}`);
                        
                        moduleHtml += `
                            <div class="quiz-section">
                                <button class="btn-quiz" onclick="veloAcademyApp.startQuiz('${quizCourseId}')">
                                    <i class="fas fa-question-circle"></i> Fazer Quiz
                                </button>
                            </div>
                        `;
                    }
                    
                    moduleHtml += '</ul></div>';

                });

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

                    const finalUrl = isGoogleDrive ? this.getGoogleDriveViewUrl(lesson.filePath) : lesson.filePath;

                    

                    console.log(`Aula ${lessonIndex + 1}:`, lesson.title);

                    console.log('Link original:', lesson.filePath);

                    console.log('Link final:', finalUrl);

                    console.log('É Google Drive:', isGoogleDrive);

                    console.log('Link válido:', isLinkValid);

                    

                    // Lógica específica para diferentes tipos de conteúdo

                    let linkClass, linkText, linkAction;

                    

                    if (!isLinkValid) {

                        linkClass = 'btn disabled';

                        linkText = 'Link Indisponível';

                        linkAction = 'onclick="return false;"';

                    } else if (lesson.type === 'pdf') {

                        // Para PDFs, usar download automático

                        linkClass = 'btn';

                        linkText = 'Baixar PDF';

                        linkAction = `href="${finalUrl}" download onclick="veloAcademyApp.downloadFile('${finalUrl}', '${lesson.title}')"`;

                    } else if (lesson.type === 'audio') {

                        // Para áudios/podcasts, usar botão "Ouvir"

                        linkClass = 'btn';

                        linkText = 'Ouvir';

                        linkAction = `href="${finalUrl}" target="_blank"`;

                    } else {

                        // Para vídeos e outros conteúdos

                        linkClass = 'btn';

                        linkText = 'Assistir';

                        linkAction = `href="${finalUrl}" target="_blank"`;

                    }

                    
                    // Adicionar ícone especial para Google Drive

                    const driveIcon = isGoogleDrive ? '<i class="fab fa-google-drive" style="margin-right: 5px;"></i>' : '';

                    
                    moduleHtml += `

                        <li>

                            <div class="lesson-info">

                                ${this.getLessonIcon(lesson.type)}

                                <div>

                                    <p>${lesson.title}</p>

                                    <span>${lesson.duration} ${isGoogleDrive ? '• Google Drive' : ''}</span>

                                </div>

                            </div>

                            <a ${linkAction} class="${linkClass}">${driveIcon}${linkText}</a>

                        </li>

                    `;

                });
                
                moduleHtml += '</ul>';

            }

            

            moduleHtml += '</div></div>';

            modulesHtml += moduleHtml;

        });

        courseView.innerHTML = `

            <div class="course-header-compact">

                <button class="btn btn-secondary" id="back-to-courses">

                    <i class="fas fa-arrow-left"></i> Voltar para Cursos

                </button>

                <div class="course-title-section">

                    <h1>${course.title}</h1>

                    <p>${course.description}</p>

                </div>

            </div>

            ${modulesHtml}

        `;

        

        document.getElementById('back-to-courses').addEventListener('click', () => this.switchView('dashboard-view'));

        this.switchView('course-view');

    },

    validateLink(link) {

        if (!link) {

            return false;

        }

        
        // Verificar se é um link quebrado (placeholder)

        if (link.includes('YOUR_FILE_ID_HERE')) {

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






