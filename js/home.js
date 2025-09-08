// JavaScript para a página Home da VeloAcademy (Landing Page)
const homeApp = {
    // ================== CONFIGURAÇÕES GLOBAIS ==================
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
        this.initLogout();
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
        
        // Decodificar o JWT token do Google Identity Services
        try {
            // O response.credential é um JWT token que contém os dados do usuário
            const payload = this.decodeJWT(response.credential);
            console.log('Payload do JWT:', payload);
            
            if (payload && payload.email && isAuthorizedDomain(payload.email)) {
                // Login bem-sucedido
                const dadosUsuario = { 
                    nome: payload.name, 
                    email: payload.email, 
                    picture: payload.picture,
                    timestamp: Date.now() 
                };
                
                // Usar função centralizada para salvar sessão
                const userData = {
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture
                };
                saveUserSession(userData);
                
                // Salvar dados do usuário (mesmo formato do chat interno)
                localStorage.setItem('userEmail', payload.email);
                localStorage.setItem('userName', payload.name);
                localStorage.setItem('userPicture', payload.picture);
                localStorage.setItem('dadosAtendenteChatbot', JSON.stringify(dadosUsuario));
                
                this.hideModal();
                
                // Mostrar mensagem de sucesso
                console.log('Login realizado com sucesso:', payload.name);
                
                // Mostrar botões do header após login
                this.showHeaderButtons();
                
                // Inicializar informações do usuário
                this.initUserInfo();
                
                // Redirecionar para cursos após login
                setTimeout(() => {
                    window.location.href = './cursos.html';
                }, 1000);
                
            } else {
                // Email não autorizado
                console.log('Email não autorizado:', payload?.email);
                if (this.errorMsg) {
                    this.errorMsg.textContent = 'Acesso permitido apenas para e-mails @velotax.com.br!';
                    this.errorMsg.classList.remove('hidden');
                }
            }
        } catch (error) {
            console.error('Erro ao decodificar JWT:', error);
            if (this.errorMsg) {
                this.errorMsg.textContent = 'Erro ao processar login. Tente novamente.';
                this.errorMsg.classList.remove('hidden');
            }
        }
    },

    // Função para decodificar JWT token
    decodeJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            console.error('Erro ao decodificar JWT:', error);
            return null;
        }
    },

    initUserInfo() {
        console.log('=== Inicializando informações do usuário ===');
        const userName = localStorage.getItem('userName');
        const userPicture = localStorage.getItem('userPicture');
        
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName || 'Usuário';
            console.log('Nome do usuário atualizado:', userName);
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
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
            }
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
    },

    verificarIdentificacao() {
        console.log('=== Verificando identificação (home) ===');
        
        // Aguardar um pouco para garantir que auth.js foi carregado
        setTimeout(() => {
            if (typeof isSessionValid === 'function' && typeof getUserSession === 'function') {
                if (isSessionValid()) {
                    const session = getUserSession();
                    console.log('Usuário já está logado, mostrando botões do header');
                    // Usuário já está logado, mostrar botões do header e informações do usuário
                    this.hideModal();
                    this.showHeaderButtons();
                    this.initUserInfo();
                } else {
                    console.log('Usuário não está logado, mostrando modal de login');
                    // Garantir que o modal está oculto inicialmente
                    this.hideModal();
                }
            } else {
                console.log('auth.js não carregado, usando lógica de fallback');
                // Fallback: verificar dados antigos
                const userEmail = localStorage.getItem('userEmail');
                const userName = localStorage.getItem('userName');
                
                if (userEmail && userName) {
                    console.log('Dados antigos encontrados, mostrando botões do header');
                    this.hideModal();
                    this.showHeaderButtons();
                    this.initUserInfo();
                } else {
                    console.log('Nenhum dado encontrado, mostrando modal de login');
                    this.hideModal();
                }
            }
        }, 100);
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
