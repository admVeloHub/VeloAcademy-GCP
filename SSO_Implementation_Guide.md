# Guia de Implementação - Sistema de SSO com Google Identity Services

## Visão Geral
Este guia fornece instruções completas para implementar um sistema de autenticação com Google Sign-In, incluindo botão de usuário com foto e nome, persistência de sessão e navegação entre páginas.

## Estrutura de Arquivos Necessários

```
projeto/
├── index.html (página de login)
├── outras-paginas.html (páginas internas)
├── js/
│   ├── auth.js (sistema centralizado)
│   ├── home.js (funcionalidades da home)
│   └── outras-funcionalidades.js
├── css/
│   └── styles.css
└── config/
    └── google-config.js (opcional)
```

## 1. Configuração do Google Cloud Console

### Passo 1: Criar Projeto
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione existente
3. Ative a API "Google Identity Services"

### Passo 2: Configurar OAuth 2.0
1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure:
   - **Application type**: Web application
   - **Name**: Nome do seu projeto
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://seudominio.com` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (desenvolvimento)
     - `https://seudominio.com` (produção)

### Passo 3: Obter Client ID
Copie o Client ID gerado (formato: `123456789-abcdefg.apps.googleusercontent.com`)

## 2. Estrutura HTML Base

### index.html (Página de Login)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Seu Projeto</title>
    <link rel="stylesheet" href="./css/styles.css">
    <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <h1>Seu Projeto</h1>
            </div>
            
            <nav class="nav-menu">
                <a href="./index.html" class="nav-link active hidden-nav">Home</a>
                <a href="./pagina1.html" class="nav-link hidden-nav">Página 1</a>
                <a href="./pagina2.html" class="nav-link hidden-nav">Página 2</a>
            </nav>

            <!-- Botão de usuário (inicialmente oculto) -->
            <div class="user-info hidden-nav" id="user-info">
                <img id="user-avatar" class="user-avatar" src="" alt="Avatar" style="display: none;">
                <span id="user-name" class="user-name"></span>
                <button id="logout-btn" class="logout-btn" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </header>

    <main>
        <div class="login-container">
            <h2>Faça login para continuar</h2>
            
            <!-- Container para o botão do Google -->
            <div id="g_id_onload"
                 data-client_id="SEU_CLIENT_ID_AQUI"
                 data-callback="handleCredentialResponse"
                 data-auto_prompt="false">
            </div>
            <div class="g_id_signin" data-type="standard"></div>
        </div>
    </main>

    <!-- Scripts -->
    <script src="./js/auth.js" defer></script>
    <script src="./js/home.js"></script>
</body>
</html>
```

### outras-paginas.html (Páginas Internas)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Página Interna - Seu Projeto</title>
    <link rel="stylesheet" href="./css/styles.css">
</head>
<body>
    <header>
        <div class="header-container">
            <div class="logo">
                <h1>Seu Projeto</h1>
            </div>
            
            <nav class="nav-menu">
                <a href="./index.html" class="nav-link">Home</a>
                <a href="./pagina1.html" class="nav-link active">Página 1</a>
                <a href="./pagina2.html" class="nav-link">Página 2</a>
            </nav>

            <!-- Botão de usuário (sempre visível nas páginas internas) -->
            <div class="user-info" id="user-info">
                <img id="user-avatar" class="user-avatar" src="" alt="Avatar" style="display: none;">
                <span id="user-name" class="user-name"></span>
                <button id="logout-btn" class="logout-btn" title="Logout">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        </div>
    </header>

    <main>
        <h2>Conteúdo da Página Interna</h2>
        <p>Esta página só é acessível após login.</p>
    </main>

    <!-- Scripts -->
    <script src="./js/auth.js" defer></script>
    <script src="./js/outras-funcionalidades.js"></script>
</body>
</html>
```

## 3. Sistema de Autenticação Centralizado (auth.js)

```javascript
// js/auth.js - Sistema de Autenticação Centralizado
console.log('=== auth.js carregado ===');

// Configurações
const USER_SESSION_KEY = 'projeto_user_session';
const DOMINIO_PERMITIDO = '@seudominio.com'; // Altere para seu domínio
const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 horas em milissegundos

/**
 * Salva os dados do usuário e o timestamp da sessão no localStorage.
 * @param {object} userData - Objeto com dados do usuário (name, email, picture).
 */
function saveUserSession(userData) {
    const sessionData = {
        user: userData,
        loginTimestamp: new Date().getTime()
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
 * @returns {boolean}
 */
function isSessionValid() {
    const session = getUserSession();
    if (!session || !session.loginTimestamp) {
        return false;
    }

    const now = new Date().getTime();
    const elapsedTime = now - session.loginTimestamp;

    return elapsedTime < SESSION_DURATION;
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
    
    // Redireciona para a home
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
```

## 4. Funcionalidades da Home (home.js)

```javascript
// js/home.js - Funcionalidades da página de login
const homeApp = {
    CLIENT_ID: 'SEU_CLIENT_ID_AQUI', // Substitua pelo seu Client ID

    init() {
        console.log('=== Inicializando Home ===');
        this.verificarIdentificacao();
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

    showHeaderButtons() {
        // Mostrar botões do header após login
        console.log('=== Mostrando botões do header ===');
        const hiddenNavs = document.querySelectorAll('.hidden-nav');
        console.log('Elementos hidden-nav encontrados:', hiddenNavs.length);
        hiddenNavs.forEach(nav => {
            nav.classList.remove('hidden-nav');
            console.log('Removida classe hidden-nav de:', nav.textContent);
        });
    },

    hideModal() {
        // Ocultar modal de login se existir
        const modal = document.querySelector('.login-container');
        if (modal) {
            modal.style.display = 'none';
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
            }
        }
    },

    handleGoogleSignIn(response) {
        console.log('=== handleGoogleSignIn chamada ===');
        console.log('Response:', response);
        
        try {
            // Decodificar o JWT para obter dados do usuário
            const payload = decodeJWT(response.credential);
            console.log('Payload decodificado:', payload);
            
            if (payload && payload.email && isAuthorizedDomain(payload.email)) {
                console.log('Email autorizado:', payload.email);
                
                // Usar função centralizada para salvar sessão
                const userData = {
                    name: payload.name,
                    email: payload.email,
                    picture: payload.picture
                };
                saveUserSession(userData);
                
                // Salvar dados do usuário (compatibilidade)
                localStorage.setItem('userEmail', payload.email);
                localStorage.setItem('userName', payload.name);
                localStorage.setItem('userPicture', payload.picture);
                
                console.log('Dados do usuário salvos no localStorage');
                
                // Mostrar botões do header após login
                this.showHeaderButtons();
                
                // Inicializar informações do usuário
                this.initUserInfo();
                
                // Redirecionar para página principal após login
                setTimeout(() => {
                    window.location.href = './pagina1.html'; // Altere para sua página principal
                }, 1000);
                
            } else {
                console.log('Email não autorizado:', payload?.email);
                alert('Apenas emails do domínio autorizado são permitidos.');
            }
        } catch (error) {
            console.error('Erro no handleGoogleSignIn:', error);
            alert('Erro ao processar login. Tente novamente.');
        }
    }
};

// Função global para o callback do Google Sign-In
function handleCredentialResponse(response) {
    homeApp.handleGoogleSignIn(response);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    homeApp.init();
});
```

## 5. Funcionalidades das Outras Páginas (outras-funcionalidades.js)

```javascript
// js/outras-funcionalidades.js - Funcionalidades das páginas internas
const outrasFuncionalidades = {
    init() {
        console.log('=== Inicializando outras funcionalidades ===');
        
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
    }
};

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    outrasFuncionalidades.init();
});
```

## 6. Estilos CSS (styles.css)

```css
/* Estilos para o botão de usuário */
.user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    background: #f5f5f5;
    border-radius: 25px;
    border: 1px solid #ddd;
    position: absolute;
    right: 70px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.user-name {
    font-weight: 500;
    color: #333;
    font-size: 14px;
}

.logout-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.logout-btn:hover {
    background-color: #e0e0e0;
    color: #333;
}

/* Classe para ocultar elementos até o login */
.hidden-nav {
    visibility: hidden !important;
    opacity: 0 !important;
}

/* Responsividade */
@media (max-width: 768px) {
    .user-info {
        right: 50px;
        font-size: 12px;
    }
    
    .user-avatar {
        width: 28px;
        height: 28px;
    }
}

@media (max-width: 480px) {
    .user-info {
        position: relative;
        right: auto;
        top: auto;
        transform: none;
        margin: 10px auto;
        justify-content: center;
    }
}
```

## 7. Configurações Importantes

### Variáveis a Personalizar:

1. **DOMINIO_PERMITIDO**: Altere para seu domínio de email
2. **CLIENT_ID**: Substitua pelo seu Client ID do Google
3. **SESSION_DURATION**: Ajuste a duração da sessão (padrão: 6 horas)
4. **USER_SESSION_KEY**: Nome único para o localStorage
5. **URLs de redirecionamento**: Ajuste conforme suas páginas

### Ordem de Carregamento dos Scripts:

```html
<!-- IMPORTANTE: auth.js deve ser carregado ANTES dos outros scripts -->
<script src="./js/auth.js" defer></script>
<script src="./js/home.js"></script>
<script src="./js/outras-funcionalidades.js"></script>
```

## 8. Checklist de Implementação

- [ ] Configurar Google Cloud Console
- [ ] Obter Client ID
- [ ] Criar estrutura HTML base
- [ ] Implementar auth.js
- [ ] Implementar home.js
- [ ] Implementar outras-funcionalidades.js
- [ ] Adicionar estilos CSS
- [ ] Personalizar variáveis de configuração
- [ ] Testar login/logout
- [ ] Testar navegação entre páginas
- [ ] Testar expiração de sessão
- [ ] Testar responsividade

## 9. Troubleshooting

### Problemas Comuns:

1. **"Origin mismatch"**: Verificar URLs autorizadas no Google Cloud Console
2. **Botão não aparece**: Verificar se auth.js está carregando antes dos outros scripts
3. **Dados não persistem**: Verificar se localStorage está funcionando
4. **Redirecionamento infinito**: Verificar lógica de verificação de sessão

### Logs de Debug:

O sistema inclui logs detalhados no console. Use F12 > Console para debug.

## 10. Segurança

- Sempre valide o domínio do email
- Use HTTPS em produção
- Configure CORS adequadamente
- Monitore tentativas de login
- Implemente rate limiting se necessário

---

**Este guia fornece uma implementação completa e funcional do sistema de SSO. Adapte conforme necessário para seu projeto específico.**
