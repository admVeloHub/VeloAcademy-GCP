// js/auth.js - Sistema de Autenticação Centralizado para VeloAcademy

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
 * A sessão dura 6 horas (6 * 60 * 60 * 1000 milissegundos).
 * @returns {boolean}
 */
function isSessionValid() {
    const session = getUserSession();
    if (!session || !session.loginTimestamp) {
        return false;
    }

    const sixHoursInMillis = 6 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const elapsedTime = now - session.loginTimestamp;

    return elapsedTime < sixHoursInMillis;
}

/**
 * Realiza o logout do usuário.
 */
function logout() {
    console.log('Logout realizado');
    localStorage.removeItem(USER_SESSION_KEY);
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
    
    // Esconde elementos de login se existirem
    const loginButtonContainer = document.getElementById('g_id_onload');
    if (loginButtonContainer) {
        loginButtonContainer.style.display = 'none';
    }

    // Atualiza o botão do usuário existente
    const userInfoContainer = document.getElementById('user-info');
    if (userInfoContainer) {
        // Remove classe hidden-nav se existir
        userInfoContainer.classList.remove('hidden-nav');
        
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
        userInfoContainer.style.display = 'flex';
        
        // Adiciona listener para logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            // Remove listeners existentes
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            
            newLogoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                logout();
            });
        }
        
        console.log('Botão do usuário atualizado com sucesso');
    } else {
        console.error('Container user-info não encontrado');
    }
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
    } else if (userEmail && userName) {
        // Fallback: usar dados antigos do localStorage se existirem
        console.log('Usando dados antigos do localStorage como fallback');
        const userData = {
            name: userName,
            email: userEmail,
            picture: userPicture
        };
        showHeaderButtons(userData);
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

// Exportar funções para uso global
window.saveUserSession = saveUserSession;
window.getUserSession = getUserSession;
window.isSessionValid = isSessionValid;
window.logout = logout;
window.showHeaderButtons = showHeaderButtons;
window.checkAuthenticationState = checkAuthenticationState;
window.isAuthorizedDomain = isAuthorizedDomain;
window.decodeJWT = decodeJWT;
