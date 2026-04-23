// VERSION: v1.0.9 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
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
        this.fetchHomeRecentTemas();
        this.fetchHomeQuickTips();
        
        // Verificação adicional para botões que podem ser carregados depois
        setTimeout(() => {
            this.verifyButtonsLoaded();
        }, 500);
        
        console.log('=== homeApp inicializado com sucesso ===');
    },

    initElements() {
        console.log('=== Inicializando elementos ===');
        this.loginModal = document.getElementById('login-modal');
        
        console.log('Modal encontrado:', !!this.loginModal);
        
        // Card “Cursos” (link com id legado dashboard-ver-cursos-btn)
        const dashboardVerCursosBtn = document.getElementById('dashboard-ver-cursos-btn');
        console.log('Card Cursos encontrado:', !!dashboardVerCursosBtn);
        if (dashboardVerCursosBtn) {
            dashboardVerCursosBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleExplorarCursosClick();
            });
            dashboardVerCursosBtn.setAttribute('data-listener-added', 'true');
        } else {
            console.error('ERRO: Card dashboard cursos não encontrado!');
        }
    },

    formatRecentCourseDate(iso) {
        if (!iso) return 'Atualização sem data';
        try {
            const d = new Date(iso);
            if (Number.isNaN(d.getTime())) return 'Atualização sem data';
            return d.toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Atualização sem data';
        }
    },

    fetchHomeRecentTemas() {
        const ul = document.getElementById('home-recent-courses-list');
        if (!ul) return;

        const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '/api';
        const root = String(base).replace(/\/$/, '');
        const url = `${root}/temas/recent?limit=4`;

        ul.classList.remove('home-recent-courses-list--error', 'home-recent-courses-list--empty');
        ul.innerHTML = '';

        fetch(url, { method: 'GET', credentials: 'omit' })
            .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if (!ok || !body || body.success !== true || !Array.isArray(body.temas)) {
                    throw new Error((body && body.error) || 'Resposta inválida');
                }
                const temas = body.temas;
                if (temas.length === 0) {
                    ul.classList.add('home-recent-courses-list--empty');
                    const li = document.createElement('li');
                    li.className = 'home-recent-courses-list__item';
                    li.textContent = 'Nenhum tema ativo encontrado.';
                    ul.appendChild(li);
                    return;
                }
                temas.forEach((tema) => {
                    const li = document.createElement('li');
                    li.className = 'home-recent-courses-list__item';
                    const a = document.createElement('a');
                    a.className = 'home-recent-course-card';
                    a.href = './cursos.html';

                    const title = document.createElement('div');
                    title.className = 'home-recent-course-card__title';
                    title.textContent = tema.temaNome || 'Tema';

                    const meta = document.createElement('div');
                    meta.className = 'home-recent-course-card__meta';
                    const cursoPart = tema.cursoNome ? `Curso: ${tema.cursoNome} · ` : '';
                    meta.textContent = `${cursoPart}Atualizado em ${this.formatRecentCourseDate(tema.updatedAt)}`;

                    a.appendChild(title);
                    a.appendChild(meta);

                    const modText = typeof tema.moduleNome === 'string' ? tema.moduleNome.trim() : '';
                    if (modText) {
                        const desc = document.createElement('div');
                        desc.className = 'home-recent-course-card__desc';
                        desc.textContent = modText.length > 120 ? `${modText.slice(0, 120)}…` : modText;
                        a.appendChild(desc);
                    }

                    li.appendChild(a);
                    ul.appendChild(li);
                });
            })
            .catch(() => {
                ul.classList.add('home-recent-courses-list--error');
                ul.innerHTML = '';
                const li = document.createElement('li');
                li.className = 'home-recent-courses-list__item';
                li.textContent = 'Não foi possível carregar os temas recentes.';
                ul.appendChild(li);
            });
    },

    fetchHomeQuickTips() {
        const ul = document.getElementById('home-quick-tips-list');
        if (!ul) return;

        const base = typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '/api';
        const root = String(base).replace(/\/$/, '');
        const url = `${root}/youtube/tutorias?limit=6`;

        ul.classList.remove('home-quick-tips-list--error', 'home-quick-tips-list--empty');
        ul.innerHTML = '';

        fetch(url, { method: 'GET', credentials: 'omit' })
            .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if (!body || body.success !== true || !Array.isArray(body.videos)) {
                    throw new Error((body && body.error) || 'Resposta inválida');
                }
                const videos = body.videos;
                if (videos.length === 0) {
                    ul.classList.add('home-quick-tips-list--empty');
                    const li = document.createElement('li');
                    li.className = 'home-quick-tips-list__item';
                    li.textContent =
                        'Nenhum vídeo disponível. Verifique YOUTUBE_DATA_API_KEY e YOUTUBE_TUTORIAS_PLAYLIST_ID no ambiente da API.';
                    ul.appendChild(li);
                    return;
                }
                videos.forEach((v) => {
                    if (!v || !v.videoId) return;
                    const li = document.createElement('li');
                    li.className = 'home-quick-tips-list__item';
                    const a = document.createElement('a');
                    a.className = 'home-quick-tip-card';
                    a.href = `https://www.youtube.com/watch?v=${encodeURIComponent(v.videoId)}`;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';

                    const thumbWrap = document.createElement('div');
                    thumbWrap.className = 'home-quick-tip-card__thumb';
                    if (v.thumbnailUrl) {
                        const img = document.createElement('img');
                        img.src = v.thumbnailUrl;
                        img.alt = '';
                        img.loading = 'lazy';
                        thumbWrap.appendChild(img);
                    }
                    a.appendChild(thumbWrap);

                    const bodyEl = document.createElement('div');
                    bodyEl.className = 'home-quick-tip-card__body';
                    const title = document.createElement('p');
                    title.className = 'home-quick-tip-card__title';
                    title.textContent = v.title || 'Vídeo';
                    bodyEl.appendChild(title);
                    const cta = document.createElement('p');
                    cta.className = 'home-quick-tip-card__cta';
                    cta.textContent = 'Assistir no YouTube';
                    bodyEl.appendChild(cta);
                    a.appendChild(bodyEl);

                    li.appendChild(a);
                    ul.appendChild(li);
                });
            })
            .catch(() => {
                ul.classList.add('home-quick-tips-list--error');
                ul.innerHTML = '';
                const li = document.createElement('li');
                li.className = 'home-quick-tips-list__item';
                li.textContent = 'Não foi possível carregar as dicas rápidas.';
                ul.appendChild(li);
            });
    },

    handleExplorarCursosClick() {
        console.log('=== Verificando sessão antes de mostrar modal ===');
        
        // Verificar se há uma sessão válida
        if (typeof isSessionValid === 'function' && isSessionValid()) {
            console.log('Sessão válida encontrada, redirecionando para cursos');
            window.location.href = './cursos.html';
        } else {
            console.log('Sessão inválida ou não encontrada, mostrando modal de login');
            this.showModal();
        }
    },

    verifyButtonsLoaded() {
        console.log('=== Verificando se botões foram carregados ===');
        
        const dashboardBtn = document.getElementById('dashboard-ver-cursos-btn');
        if (dashboardBtn && !dashboardBtn.hasAttribute('data-listener-added')) {
            dashboardBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleExplorarCursosClick();
            });
            dashboardBtn.setAttribute('data-listener-added', 'true');
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
        if (!this.loginModal) {
            return;
        }
        console.log('=== Tentando mostrar modal ===');
        this.loginModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        console.log('Modal mostrado com sucesso');
    },

    hideModal() {
        if (!this.loginModal) {
            return;
        }
        console.log('=== Ocultando modal ===');
        this.loginModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        console.log('Modal ocultado com sucesso');
    },

    showHeaderButtons() {
        // Mostrar botões do header após login
        console.log('=== Mostrando botões do header ===');
        
        // Obter dados do usuário para verificar se é Lucas Gravina
        let isLucasGravina = false;
        try {
            const getUserSessionFunc = typeof window !== 'undefined' && window.getUserSession ? window.getUserSession : getUserSession;
            const session = getUserSessionFunc();
            if (session && session.user) {
                const userData = session.user;
                // APENAS lucas.gravina@velotax.com.br tem acesso
                isLucasGravina = userData.email === 'lucas.gravina@velotax.com.br';
            }
        } catch (error) {
            console.error('Erro ao verificar usuário:', error);
        }
        
        // Mostrar itens de navegação (Conquistas e Feedback ficam visíveis mas inacessíveis se não for Lucas Gravina)
        const hiddenNavItems = document.querySelectorAll('.hidden-nav-item');
        console.log('Elementos hidden-nav-item encontrados:', hiddenNavItems.length);
        hiddenNavItems.forEach(nav => {
            const navId = nav.id;
            nav.classList.remove('hidden-nav-item');
            nav.style.display = '';
            
            // Se não for Lucas Gravina, tornar Conquistas e Feedback inacessíveis mas visíveis
            if (!isLucasGravina && (navId === 'nav-conquistas' || navId === 'nav-feedback')) {
                nav.style.pointerEvents = 'none';
                nav.style.opacity = '0.5';
                nav.style.cursor = 'not-allowed';
                nav.setAttribute('disabled', 'true');
                nav.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                };
                console.log('Botão restrito tornado inacessível:', nav.textContent);
            } else {
                nav.style.pointerEvents = '';
                nav.style.opacity = '1';
                nav.style.cursor = 'pointer';
                nav.removeAttribute('disabled');
                nav.onclick = null;
                console.log('Removida classe hidden-nav-item de:', nav.textContent);
            }
        });
        
        // Mostrar container do usuário
        const hiddenNavs = document.querySelectorAll('.hidden-nav');
        console.log('Elementos hidden-nav encontrados:', hiddenNavs.length);
        hiddenNavs.forEach(nav => {
            nav.classList.remove('hidden-nav');
            console.log('Removida classe hidden-nav de:', nav.textContent);
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
                client_id: (typeof window.getClientId === 'function' ? window.getClientId() : this.CLIENT_ID),
                scope: 'profile email',
                callback: (response) => this.handleGoogleSignIn(response)
            });
            
            // O Google Sign-In é inicializado automaticamente pelo script
            // Não precisamos adicionar event listeners manualmente
            console.log('Google Sign-In configurado com sucesso');
        }).catch(error => {
            console.error('Erro ao inicializar Google Sign-In:', error);
            this.showErrorMessage('Erro ao carregar autenticação do Google. Verifique sua conexão ou tente novamente mais tarde.');
        });
    },

    async handleGoogleSignIn(response) {
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
                
                // Registrar sessão no backend (necessário para progresso e quiz)
                if (typeof window.registerLoginSession === 'function') {
                    await window.registerLoginSession(userData);
                }
                
                this.hideModal();
                
                // Mostrar mensagem de sucesso
                console.log('Login realizado com sucesso:', payload.name);
                if (typeof showToast !== 'undefined' && showToast.success) {
                    showToast.success('Login Concluído', `Bem-vindo, ${payload.name}!`);
                }
                
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
                this.showErrorMessage('Acesso negado. Apenas e-mails @velotax.com.br são autorizados.');
            }
        } catch (error) {
            console.error('Erro ao decodificar JWT:', error);
            this.showErrorMessage('Erro ao processar login. Tente novamente.');
        }
    },

    showErrorMessage(message) {
        // Usar sistema de toast notifications em vez de elemento fixo
        if (typeof showToast !== 'undefined' && showToast.error) {
            showToast.error('Erro de Login', message);
        } else {
            console.error('Sistema de toast não disponível:', message);
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
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Logout clicado');
                // Usar logout centralizado do auth.js (limpa veloacademy_user_session e redireciona)
                if (typeof logout === 'function') {
                    logout();
                } else {
                    // Fallback se auth.js não carregou
                    localStorage.removeItem('veloacademy_user_session');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userPicture');
                    localStorage.removeItem('academy_session_id');
                    localStorage.removeItem('dadosAtendenteChatbot');
                    window.location.href = './index.html';
                }
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
        const animatedElements = document.querySelectorAll('.hero-content');
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
