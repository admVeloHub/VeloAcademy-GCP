// JavaScript para a página Home da VeloAcademy (Landing Page)
const homeApp = {
    // ================== CONFIGURAÇÕES GLOBAIS ==================
    DOMINIO_PERMITIDO: "@velotax.com.br",
    CLIENT_ID: '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com',

    // ================== ELEMENTOS DO DOM ==================
    identificacaoOverlay: null,
    errorMsg: null,
    tokenClient: null,

    init() {
        console.log('=== Inicializando homeApp ===');
        this.initElements();
        this.initAnimations();
        this.checkConnectivity();
        this.verificarIdentificacao();
        
        // Verificação adicional para botões que podem ser carregados depois
        setTimeout(() => {
            this.verifyButtonsLoaded();
        }, 500);
        
        console.log('=== homeApp inicializado com sucesso ===');
    },

    initElements() {
        console.log('=== Inicializando elementos ===');
        this.loginModal = document.getElementById('login-modal');
        this.errorMsg = document.getElementById('login-error');
        
        console.log('Modal encontrado:', !!this.loginModal);
        console.log('Error message encontrado:', !!this.errorMsg);
        
        // Botão Explorar Cursos do Hero
        const heroExplorarCursosBtn = document.getElementById('hero-explorar-cursos-btn');
        console.log('Botão Explorar Cursos encontrado:', !!heroExplorarCursosBtn);
        if (heroExplorarCursosBtn) {
            heroExplorarCursosBtn.addEventListener('click', (e) => {
                console.log('=== Botão Explorar Cursos clicado! ===');
                e.preventDefault();
                this.showModal();
            });
            heroExplorarCursosBtn.setAttribute('data-listener-added', 'true');
            console.log('Event listener adicionado ao botão hero');
        }
        
        // Botão Ver Cursos do Dashboard
        const dashboardVerCursosBtn = document.getElementById('dashboard-ver-cursos-btn');
        console.log('Botão Ver Cursos encontrado:', !!dashboardVerCursosBtn);
        console.log('Elemento do botão dashboard:', dashboardVerCursosBtn);
        if (dashboardVerCursosBtn) {
            console.log('Adicionando event listener ao botão dashboard...');
            dashboardVerCursosBtn.addEventListener('click', (e) => {
                console.log('=== Botão Ver Cursos clicado! ===');
                console.log('Event:', e);
                e.preventDefault();
                this.showModal();
            });
            dashboardVerCursosBtn.setAttribute('data-listener-added', 'true');
            console.log('Event listener adicionado com sucesso ao botão dashboard');
        } else {
            console.error('ERRO: Botão dashboard não encontrado!');
        }
    },

    verifyButtonsLoaded() {
        console.log('=== Verificando se botões foram carregados ===');
        
        // Verificar botão do dashboard novamente
        const dashboardBtn = document.getElementById('dashboard-ver-cursos-btn');
        console.log('Botão dashboard na verificação tardia:', !!dashboardBtn);
        
        if (dashboardBtn && !dashboardBtn.hasAttribute('data-listener-added')) {
            console.log('Adicionando event listener tardio ao botão dashboard...');
            dashboardBtn.addEventListener('click', (e) => {
                console.log('=== Botão Ver Cursos clicado (listener tardio)! ===');
                e.preventDefault();
                this.showModal();
            });
            dashboardBtn.setAttribute('data-listener-added', 'true');
            console.log('Event listener tardio adicionado com sucesso');
        }
        
        // Verificar botão do hero também
        const heroBtn = document.getElementById('hero-explorar-cursos-btn');
        console.log('Botão hero na verificação tardia:', !!heroBtn);
        
        if (heroBtn && !heroBtn.hasAttribute('data-listener-added')) {
            console.log('Adicionando event listener tardio ao botão hero...');
            heroBtn.addEventListener('click', (e) => {
                console.log('=== Botão Explorar Cursos clicado (listener tardio)! ===');
                e.preventDefault();
                this.showModal();
            });
            heroBtn.setAttribute('data-listener-added', 'true');
            console.log('Event listener tardio adicionado com sucesso');
        }
    },

    // ================== VERIFICAÇÃO DE CONECTIVIDADE ==================
    checkConnectivity() {
        // USAR A MESMA LÓGICA DO CHAT INTERNO (QUE FUNCIONA)
        console.log('=== Verificando conectividade ===');
        console.log('Inicializando Google Sign-In como no chat interno');
        this.initGoogleSignIn();
    },

    updateConnectivityStatus(isOnline, isVercel = false) {
        const statusIcon = document.getElementById('status-icon');
        const statusText = document.getElementById('status-text');
        const connectivityStatus = document.getElementById('connectivity-status');
        
        if (isOnline) {
            statusIcon.textContent = '🌐';
            statusText.textContent = 'Conectado';
            connectivityStatus.classList.remove('offline');
        } else {
            statusIcon.textContent = '🔧';
            statusText.textContent = 'Modo Desenvolvimento';
            connectivityStatus.classList.add('offline');
        }
    },

    // ================== FUNÇÕES DE CONTROLE DE UI ==================
    showModal() {
        console.log('=== Tentando mostrar modal ===');
        console.log('Modal element:', this.loginModal);
        if (this.loginModal) {
            this.loginModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            console.log('Modal mostrado com sucesso');
            console.log('Classes do modal:', this.loginModal.className);
        } else {
            console.error('Modal element não encontrado!');
        }
    },

    hideModal() {
        console.log('=== Ocultando modal ===');
        if (this.loginModal) {
            this.loginModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            console.log('Modal ocultado com sucesso');
        } else {
            console.error('Modal element não encontrado para ocultar!');
        }
    },

    showHeaderButtons() {
        // Mostrar botões do header após login
        console.log('=== Mostrando botões do header ===');
        const hiddenNavs = document.querySelectorAll('.hidden-nav');
        console.log('Elementos hidden-nav encontrados:', hiddenNavs.length);
        hiddenNavs.forEach(nav => {
            nav.classList.remove('hidden-nav');
            console.log('Removida classe hidden-nav de:', nav.textContent);
            console.log('Classes após remoção:', nav.className);
        });
    },

    // ================== LÓGICA DE AUTENTICAÇÃO ==================
    waitForGoogleScript() {
        return new Promise((resolve, reject) => {
            console.log('=== Aguardando script do Google ===');
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (!script) {
                console.error('Script Google Identity Services não encontrado no HTML');
                return reject(new Error('Script Google Identity Services não encontrado no HTML.'));
            }
            if (window.google && window.google.accounts) {
                console.log('Google script já carregado');
                return resolve(window.google.accounts);
            }
            script.onload = () => {
                console.log('Script Google carregado via onload');
                if (window.google && window.google.accounts) {
                    resolve(window.google.accounts);
                } else {
                    reject(new Error('Falha ao carregar Google Identity Services.'));
                }
            };
            script.onerror = () => {
                console.warn('Google Sign-In não carregou - usando modo offline');
                reject(new Error('Erro ao carregar o script Google Identity Services.'));
            };
        });
    },

    initGoogleSignIn() {
        console.log('=== Inicializando Google Sign-In ===');
        this.waitForGoogleScript().then(accounts => {
            console.log('Google Script carregado com sucesso');
            this.tokenClient = accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: 'profile email',
                callback: (response) => this.handleGoogleSignIn(response)
            });
            
            // O Google Sign-In é inicializado automaticamente pelo script
            // Não precisamos adicionar event listeners manualmente
            console.log('Google Sign-In configurado com sucesso');
        }).catch(error => {
            console.error('Erro ao inicializar Google Sign-In:', error);
            if (this.errorMsg) {
                this.errorMsg.textContent = 'Erro ao carregar autenticação do Google. Verifique sua conexão ou tente novamente mais tarde.';
                this.errorMsg.classList.remove('hidden');
            }
        });
    },

    handleGoogleSignIn(response) {
        console.log('=== handleGoogleSignIn chamada ===');
        console.log('Response:', response);
        
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
        })
        .then(res => res.json())
        .then(user => {
            console.log('Dados do usuário recebidos:', user);
            if (user.email && user.email.endsWith(this.DOMINIO_PERMITIDO)) {
                // Login bem-sucedido - usar mesma lógica do chat interno
                const dadosUsuario = { 
                    nome: user.name, 
                    email: user.email, 
                    picture: user.picture,
                    timestamp: Date.now() 
                };
                
                // Salvar dados do usuário (mesmo formato do chat interno)
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userPicture', user.picture);
                localStorage.setItem('dadosAtendenteChatbot', JSON.stringify(dadosUsuario));
                
                this.hideModal();
                
                // Mostrar mensagem de sucesso
                console.log('Login realizado com sucesso:', user.name);
                
                // Mostrar botões do header após login
                this.showHeaderButtons();
                
                // Redirecionar para cursos após login
                setTimeout(() => {
                    window.location.href = './cursos.html';
                }, 1000);
                
            } else {
                // Email não autorizado - mesma mensagem do chat interno
                console.log('Email não autorizado:', user.email);
                if (this.errorMsg) {
                    this.errorMsg.textContent = 'Acesso permitido apenas para e-mails @velotax.com.br!';
                    this.errorMsg.classList.remove('hidden');
                }
            }
        })
        .catch(error => {
            // Mesmo tratamento de erro do chat interno
            console.error('Erro ao verificar login:', error);
            if (this.errorMsg) {
                this.errorMsg.textContent = 'Erro ao verificar login. Tente novamente.';
                this.errorMsg.classList.remove('hidden');
            }
        });
    },

    verificarIdentificacao() {
        console.log('=== Verificando identificação ===');
        const umDiaEmMs = 24 * 60 * 60 * 1000;
        let dadosSalvos = null;
        
        try {
            const dadosSalvosString = localStorage.getItem('dadosAtendenteChatbot');
            if (dadosSalvosString) dadosSalvos = JSON.parse(dadosSalvosString);
        } catch (e) {
            console.log('Erro ao parsear dados salvos:', e);
            localStorage.removeItem('dadosAtendenteChatbot');
        }

        console.log('Dados salvos encontrados:', dadosSalvos);

        if (dadosSalvos && 
            dadosSalvos.email && 
            dadosSalvos.email.endsWith(this.DOMINIO_PERMITIDO) && 
            (Date.now() - dadosSalvos.timestamp < umDiaEmMs)) {
            
            console.log('Usuário já está logado, mostrando botões do header');
            // Usuário já está logado, ocultar modal e mostrar botões do header
            this.hideModal();
            this.showHeaderButtons();
        } else {
            console.log('Usuário não está logado, limpando dados e ocultando modal');
            // Limpar dados inválidos
            localStorage.removeItem('dadosAtendenteChatbot');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPicture');
            
            // Garantir que o modal está oculto inicialmente
            this.hideModal();
        }
    },

    initAnimations() {
        console.log('=== Inicializando animações ===');
        // Animação de entrada dos elementos
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        const animatedElements = document.querySelectorAll('.hero-content, .hero-image');
        console.log('Elementos para animação encontrados:', animatedElements.length);
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
};

// Função global para o Google Sign-In
function handleCredentialResponse(response) {
    console.log('=== handleCredentialResponse chamada ===');
    console.log('Resposta do Google Sign-In:', response);
    if (homeApp && homeApp.handleGoogleSignIn) {
        homeApp.handleGoogleSignIn(response);
    } else {
        console.error('homeApp não está disponível ou handleGoogleSignIn não existe');
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando homeApp...');
    // Pequeno delay para garantir que todos os elementos estejam prontos
    setTimeout(() => {
        homeApp.init();
    }, 100);
});
