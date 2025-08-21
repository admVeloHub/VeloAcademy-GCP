// JavaScript para a página Home da VeloAcademy (Landing Page)
const homeApp = {
    // ================== CONFIGURAÇÕES GLOBAIS ==================
    DOMINIO_PERMITIDO: "@velotax.com.br",
    CLIENT_ID: '827325386401-ahi2f9ume9i7lc28lau7j4qlviv5d22k.apps.googleusercontent.com',

    // ================== ELEMENTOS DO DOM ==================
    identificacaoOverlay: null,
    errorMsg: null,
    tokenClient: null,

    init() {
        this.initElements();
        this.initAnimations();
        this.checkConnectivity();
        this.verificarIdentificacao();
    },

    initElements() {
        this.identificacaoOverlay = document.getElementById('identificacao-overlay');
        this.errorMsg = document.getElementById('identificacao-error');
        
        // Botão de login
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showOverlay());
        }
    },

    // ================== VERIFICAÇÃO DE CONECTIVIDADE ==================
    checkConnectivity() {
        // USAR A MESMA LÓGICA DO CHAT INTERNO (QUE FUNCIONA)
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
    showOverlay() {
        this.identificacaoOverlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },

    hideOverlay() {
        this.identificacaoOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
    },

    // ================== LÓGICA DE AUTENTICAÇÃO ==================
    waitForGoogleScript() {
        return new Promise((resolve, reject) => {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (!script) {
                return reject(new Error('Script Google Identity Services não encontrado no HTML.'));
            }
            if (window.google && window.google.accounts) {
                return resolve(window.google.accounts);
            }
            script.onload = () => {
                if (window.google && window.google.accounts) {
                    resolve(window.google.accounts);
                } else {
                    reject(new Error('Falha ao carregar Google Identity Services.'));
                }
            };
            script.onerror = () => {
                console.warn('Google Sign-In não carregou - usando modo offline');
                this.setupOfflineLogin();
                reject(new Error('Erro ao carregar o script Google Identity Services.'));
            };
        });
    },

    initGoogleSignIn() {
        this.waitForGoogleScript().then(accounts => {
            this.tokenClient = accounts.oauth2.initTokenClient({
                client_id: this.CLIENT_ID,
                scope: 'profile email',
                callback: (response) => this.handleGoogleSignIn(response)
            });
            
            const googleSigninButton = document.getElementById('google-signin-button');
            if (googleSigninButton) {
                // Usar exatamente a mesma lógica do chat interno
                googleSigninButton.addEventListener('click', () => this.tokenClient.requestAccessToken());
            }
        }).catch(error => {
            console.error('Erro ao inicializar Google Sign-In:', error);
            this.errorMsg.textContent = 'Erro ao carregar autenticação do Google. Verifique sua conexão ou tente novamente mais tarde.';
            this.errorMsg.classList.remove('hidden');
        });
    },

    handleGoogleSignIn(response) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
        })
        .then(res => res.json())
        .then(user => {
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
                
                this.hideOverlay();
                
                // Redirecionar para home após 1 segundo
                setTimeout(() => {
                    window.location.href = './home.html';
                }, 1000);
                
            } else {
                // Email não autorizado - mesma mensagem do chat interno
                this.errorMsg.textContent = 'Acesso permitido apenas para e-mails @velotax.com.br!';
                this.errorMsg.classList.remove('hidden');
            }
        })
        .catch(() => {
            // Mesmo tratamento de erro do chat interno
            this.errorMsg.textContent = 'Erro ao verificar login. Tente novamente.';
            this.errorMsg.classList.remove('hidden');
        });
    },

    verificarIdentificacao() {
        const umDiaEmMs = 24 * 60 * 60 * 1000;
        let dadosSalvos = null;
        
        try {
            const dadosSalvosString = localStorage.getItem('dadosAtendenteChatbot');
            if (dadosSalvosString) dadosSalvos = JSON.parse(dadosSalvosString);
        } catch (e) {
            localStorage.removeItem('dadosAtendenteChatbot');
        }

        if (dadosSalvos && 
            dadosSalvos.email && 
            dadosSalvos.email.endsWith(this.DOMINIO_PERMITIDO) && 
            (Date.now() - dadosSalvos.timestamp < umDiaEmMs)) {
            
            // Usuário já está logado, redirecionar para home
            window.location.href = './home.html';
        } else {
            // Limpar dados inválidos
            localStorage.removeItem('dadosAtendenteChatbot');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPicture');
        }
    },

    initAnimations() {
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
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    homeApp.init();
});
