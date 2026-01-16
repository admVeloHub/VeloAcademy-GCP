// VERSION: v2.4.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// js/auth.js - Sistema de Autenticação Centralizado para VeloAcademy
// Mudanças v2.4.0: Botões Conquistas e Feedback agora ficam visíveis mas inacessíveis para usuários não autorizados
// Mudanças v2.3.0: Melhorado controle de acesso à página de Conquistas - bloqueia acesso direto pela URL
// Mudanças v2.2.0: Botão de usuário agora abre página de perfil ao clicar (exceto no ícone de logout)
// Mudanças v2.1.0: Adicionado controle de acesso restrito para botões Conquistas e Feedback (apenas Lucas Gravina)
console.log('=== auth.js carregado ===');

// Chave padrão para o localStorage
const USER_SESSION_KEY = 'veloacademy_user_session';
const DOMINIO_PERMITIDO = '@velotax.com.br';

/**
 * Salva os dados do usuário e o timestamp da sessão no localStorage.
 * @param {object} userData - Objeto com dados do usuário (name, email, picture).
 */
function saveUserSession(userData) {
    const sessionData = {
        user: userData,
        loginTimestamp: new Date().getTime() // Salva o tempo em milissegundos
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(sessionData));
    console.log('Sessão salva:', sessionData);
}

/**
 * Recupera os dados da sessão do localStorage.
 * @returns {object | null} - Objeto com os dados da sessão ou null se não houver.
 */
function getUserSession() {
    const sessionData = localStorage.getItem(USER_SESSION_KEY);
    return sessionData ? JSON.parse(sessionData) : null;
}

/**
 * Verifica se a sessão do usuário é válida (existe e não expirou).
 * A sessão dura 4 horas (4 * 60 * 60 * 1000 milissegundos).
 * @returns {boolean}
 */
function isSessionValid() {
    const session = getUserSession();
    if (!session || !session.loginTimestamp) {
        return false;
    }

    const fourHoursInMillis = 4 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const elapsedTime = now - session.loginTimestamp;

    return elapsedTime < fourHoursInMillis;
}

/**
 * Realiza o logout do usuário.
 */
async function logout() {
    console.log('Logout realizado');
    
    // Registrar logout no backend se a função estiver disponível
    if (typeof window !== 'undefined' && window.registerLogoutSession) {
        try {
            await window.registerLogoutSession();
        } catch (error) {
            console.error('Erro ao registrar logout no backend:', error);
        }
    }
    
    localStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem('academy_session_id');
    // Limpar também os dados antigos para compatibilidade
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPicture');
    localStorage.removeItem('dadosAtendenteChatbot');
    
    // Redireciona para a home para garantir que o estado seja limpo
    window.location.href = './index.html';
}

/**
 * Atualiza o cabeçalho da página para mostrar as informações do usuário logado.
 * @param {object} userData - Objeto com os dados do usuário (name, picture).
 */
function showHeaderButtons(userData) {
    console.log('Mostrando botões do header para:', userData);
    
    // Verificar se é Lucas Gravina - APENAS lucas.gravina@velotax.com.br
    const isLucasGravina = userData.email === 'lucas.gravina@velotax.com.br';
    
    // Esconde elementos de login se existirem
    const loginButtonContainer = document.getElementById('g_id_onload');
    if (loginButtonContainer) {
        loginButtonContainer.style.display = 'none';
    }

    // Controlar acessibilidade dos botões Conquistas e Feedback (mantém visíveis mas inacessíveis)
    const conquistasBtn = document.getElementById('nav-conquistas');
    const feedbackBtn = document.getElementById('nav-feedback');
    
    if (conquistasBtn) {
        conquistasBtn.classList.remove('hidden-nav-item');
        conquistasBtn.style.display = '';
        conquistasBtn.style.visibility = '';
        
        if (isLucasGravina) {
            // Habilitar acesso
            conquistasBtn.style.pointerEvents = '';
            conquistasBtn.style.opacity = '1';
            conquistasBtn.style.cursor = 'pointer';
            conquistasBtn.removeAttribute('disabled');
            // Remover listener de bloqueio se existir
            conquistasBtn.onclick = null;
        } else {
            // Tornar inacessível mas visível
            conquistasBtn.style.pointerEvents = 'none';
            conquistasBtn.style.opacity = '0.5';
            conquistasBtn.style.cursor = 'not-allowed';
            conquistasBtn.setAttribute('disabled', 'true');
            // Bloquear clique
            conquistasBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
        }
    }
    
    if (feedbackBtn) {
        feedbackBtn.classList.remove('hidden-nav-item');
        feedbackBtn.style.display = '';
        feedbackBtn.style.visibility = '';
        
        if (isLucasGravina) {
            // Habilitar acesso
            feedbackBtn.style.pointerEvents = '';
            feedbackBtn.style.opacity = '1';
            feedbackBtn.style.cursor = 'pointer';
            feedbackBtn.removeAttribute('disabled');
            // Remover listener de bloqueio se existir
            feedbackBtn.onclick = null;
        } else {
            // Tornar inacessível mas visível
            feedbackBtn.style.pointerEvents = 'none';
            feedbackBtn.style.opacity = '0.5';
            feedbackBtn.style.cursor = 'not-allowed';
            feedbackBtn.setAttribute('disabled', 'true');
            // Bloquear clique
            feedbackBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
        }
    }

    // Atualiza o botão do usuário existente
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        // Remove classe hidden-nav se existir
        userInfoContainer.classList.remove('hidden-nav');
        
        // Tornar o container clicável (cursor pointer)
        userInfoContainer.style.cursor = 'pointer';
        
        // Adicionar listener para abrir perfil ao clicar no container (exceto no botão de logout)
        // Remover listeners existentes clonando o elemento
        const newUserInfoContainer = userInfoContainer.cloneNode(true);
        userInfoContainer.parentNode.replaceChild(newUserInfoContainer, userInfoContainer);
        
        // Atualizar referências após clonar
        const updatedUserInfoContainer = document.getElementById('user-info');
        
        // Adicionar listener para abrir perfil
        updatedUserInfoContainer.addEventListener('click', (e) => {
            // Se o clique foi no botão de logout, não fazer nada (o logout-btn terá seu próprio handler)
            if (e.target.closest('#logout-btn')) {
                return;
            }
            // Verificar se já está na página de perfil para evitar redirecionamento desnecessário
            const currentPath = window.location.pathname;
            if (!currentPath.includes('perfil.html')) {
                // Redirecionar para página de perfil
                window.location.href = './perfil.html';
            }
        });
        
        // Atualiza nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userData.name || 'Usuário';
        }
        
        // Atualiza avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar) {
            if (userData.picture) {
                userAvatar.src = userData.picture;
                userAvatar.style.display = 'block';
            } else {
                userAvatar.style.display = 'none';
            }
        }
        
        // Garante que o container esteja visível
        updatedUserInfoContainer.style.display = 'flex';
        
        // Adiciona listener para logout (com stopPropagation para não acionar o clique do container)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            // Remove listeners existentes
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation(); // Impede que o clique propague para o container
                logout();
            });
        }
        
        console.log('Botão do usuário atualizado com sucesso');
    } else {
        console.error('Container user-info não encontrado');
    }
    
    // Garantir que botões restritos sejam controlados após atualizar header
    setTimeout(() => {
        controlRestrictedButtons();
    }, 100);
}

/**
 * Função principal a ser executada em todas as páginas (exceto a home, que tem um fluxo diferente).
 * Verifica o estado de autenticação e atualiza a UI.
 * Se o usuário não estiver logado, redireciona para a home.
 */
function checkAuthenticationState() {
    console.log('=== Verificando estado de autenticação ===');
    console.log('URL atual:', window.location.pathname);
    
    // Verificar se há dados no localStorage (compatibilidade)
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');
    console.log('Dados do localStorage:', { userEmail, userName, userPicture });
    
    if (isSessionValid()) {
        const session = getUserSession();
        console.log('Sessão válida encontrada:', session);
        showHeaderButtons(session.user);
        controlRestrictedButtons(); // Controlar visibilidade dos botões restritos
        checkConquistasAccess(); // Verificar acesso à página de conquistas
    } else if (userEmail && userName) {
        // Fallback: usar dados antigos do localStorage se existirem
        console.log('Usando dados antigos do localStorage como fallback');
        const userData = {
            name: userName,
            email: userEmail,
            picture: userPicture
        };
        showHeaderButtons(userData);
        controlRestrictedButtons(); // Controlar visibilidade dos botões restritos
        checkConquistasAccess(); // Verificar acesso à página de conquistas
    } else {
        console.log('Sessão inválida ou expirada');
        // Se a sessão for inválida ou não existir, limpa qualquer resquício
        localStorage.removeItem(USER_SESSION_KEY);
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('userPicture');
        localStorage.removeItem('dadosAtendenteChatbot');
        
        // Não redirecione se já estiver na página de login para evitar loops
        if (!window.location.pathname.endsWith('index.html') && !window.location.pathname.endsWith('/')) {
            console.log('Redirecionando para index.html');
            window.location.href = './index.html';
        }
    }
}

/**
 * Verifica se o domínio do email é autorizado
 * @param {string} email - Email do usuário
 * @returns {boolean}
 */
function isAuthorizedDomain(email) {
    if (!email) return false;
    return email.endsWith(DOMINIO_PERMITIDO);
}

/**
 * Função para decodificar JWT (compatibilidade com código existente)
 * @param {string} token - JWT token
 * @returns {object|null} - Payload decodificado ou null se erro
 */
function decodeJWT(token) {
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
}

/**
 * Verifica se o usuário é Lucas Gravina
 * @returns {boolean}
 */
function isLucasGravinaUser() {
    try {
        const session = getUserSession();
        if (session && session.user) {
            const userData = session.user;
            // APENAS lucas.gravina@velotax.com.br tem acesso
            return userData.email === 'lucas.gravina@velotax.com.br';
        }
    } catch (error) {
        console.error('Erro ao verificar usuário:', error);
    }
    return false;
}

/**
 * Controla acessibilidade dos botões restritos (Conquistas e Feedback)
 * Mantém os botões visíveis mas inacessíveis para usuários não autorizados
 */
function controlRestrictedButtons() {
    const isLucasGravina = isLucasGravinaUser();
    console.log('Controlando botões restritos. É Lucas Gravina?', isLucasGravina);
    
    // Controlar acessibilidade dos botões Conquistas e Feedback
    const conquistasBtn = document.getElementById('nav-conquistas');
    const feedbackBtn = document.getElementById('nav-feedback');
    
    console.log('Botão Conquistas encontrado:', !!conquistasBtn);
    console.log('Botão Feedback encontrado:', !!feedbackBtn);
    
    if (conquistasBtn) {
        conquistasBtn.classList.remove('hidden-nav-item');
        conquistasBtn.style.display = '';
        conquistasBtn.style.visibility = '';
        
        if (isLucasGravina) {
            // Habilitar acesso
            conquistasBtn.style.pointerEvents = '';
            conquistasBtn.style.opacity = '1';
            conquistasBtn.style.cursor = 'pointer';
            conquistasBtn.removeAttribute('disabled');
            conquistasBtn.onclick = null;
            console.log('Botão Conquistas: ACESSÍVEL');
        } else {
            // Tornar inacessível mas visível
            conquistasBtn.style.pointerEvents = 'none';
            conquistasBtn.style.opacity = '0.5';
            conquistasBtn.style.cursor = 'not-allowed';
            conquistasBtn.setAttribute('disabled', 'true');
            conquistasBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            console.log('Botão Conquistas: INACESSÍVEL');
        }
    }
    
    if (feedbackBtn) {
        feedbackBtn.classList.remove('hidden-nav-item');
        feedbackBtn.style.display = '';
        feedbackBtn.style.visibility = '';
        
        if (isLucasGravina) {
            // Habilitar acesso
            feedbackBtn.style.pointerEvents = '';
            feedbackBtn.style.opacity = '1';
            feedbackBtn.style.cursor = 'pointer';
            feedbackBtn.removeAttribute('disabled');
            feedbackBtn.onclick = null;
            console.log('Botão Feedback: ACESSÍVEL');
        } else {
            // Tornar inacessível mas visível
            feedbackBtn.style.pointerEvents = 'none';
            feedbackBtn.style.opacity = '0.5';
            feedbackBtn.style.cursor = 'not-allowed';
            feedbackBtn.setAttribute('disabled', 'true');
            feedbackBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            };
            console.log('Botão Feedback: INACESSÍVEL');
        }
    }
}

/**
 * Verifica acesso à página de conquistas e redireciona se não autorizado
 */
function checkConquistasAccess() {
    // Verificar se está na página de conquistas
    if (window.location.pathname.includes('conquistas.html')) {
        const isLucasGravina = isLucasGravinaUser();
        
        if (!isLucasGravina) {
            console.log('Acesso negado à página de Conquistas. Redirecionando...');
            window.location.href = './index.html';
        }
    }
}

// Exportar funções para uso global
window.saveUserSession = saveUserSession;
window.getUserSession = getUserSession;
window.isSessionValid = isSessionValid;
window.logout = logout;
window.showHeaderButtons = showHeaderButtons;
window.checkAuthenticationState = checkAuthenticationState;
window.isAuthorizedDomain = isAuthorizedDomain;
window.decodeJWT = decodeJWT;
window.controlRestrictedButtons = controlRestrictedButtons;
window.isLucasGravinaUser = isLucasGravinaUser;
window.checkConquistasAccess = checkConquistasAccess;

// Executar controle de botões restritos quando DOM estiver pronto
function initRestrictedAccess() {
    controlRestrictedButtons();
    checkConquistasAccess();
    
    // Executar novamente após um pequeno delay para garantir que elementos estejam disponíveis
    setTimeout(() => {
        controlRestrictedButtons();
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRestrictedAccess);
} else {
    initRestrictedAccess();
}
