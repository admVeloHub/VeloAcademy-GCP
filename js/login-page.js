// VERSION: v1.2.2 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Componente de Login adaptado do React para JavaScript Vanilla

(function() {
    'use strict';

    // Estado do componente (similar ao useState do React)
    const state = {
        isLoading: false,
        error: '',
        email: '',
        password: '',
        showPassword: false,
        capsLockOn: false,
        googleSignInStarted: false
    };

    // Referências aos elementos DOM
    let loginContainer = null;
    let emailInput = null;
    let passwordInput = null;
    let showPasswordBtn = null;
    let errorMessage = null;
    let capsLockAlert = null;
    let googleSignInButton = null;

    /**
     * Inicializa o componente de login
     * @param {string} containerId - ID do container onde o login será renderizado
     * @param {function} onLoginSuccess - Callback chamado quando login é bem-sucedido
     */
    function initLoginPage(containerId, onLoginSuccess) {
        // Criar estrutura HTML do login
        createLoginHTML(containerId);

        // Obter referências aos elementos
        loginContainer = document.getElementById(containerId);
        emailInput = document.getElementById('login-email');
        passwordInput = document.getElementById('login-password');
        showPasswordBtn = document.getElementById('login-show-password');
        errorMessage = document.getElementById('login-error');
        capsLockAlert = document.getElementById('login-caps-lock');
        
        // Aguardar um pouco para garantir que o DOM está pronto
        setTimeout(() => {
            googleSignInButton = document.getElementById('google-signin-button');
            console.log('Container do botão Google encontrado:', !!googleSignInButton);
        }, 100);

        // Configurar event listeners
        setupEventListeners(onLoginSuccess);

        // Configurar detecção de CAPS LOCK
        setupCapsLockDetection();

        // Splash: Google Sign-In só após abrir o painel (iframe precisa de layout visível)
        setupOpenLoginPanel(onLoginSuccess);
    }

    /**
     * Cria a estrutura HTML do componente de login
     */
    function createLoginHTML(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container não encontrado:', containerId);
            return;
        }

        container.innerHTML = `
            <div class="login-page-container" style="background-image: url('/Public/NOVO LOGIN BG.png'); background-size: cover; background-position: center; background-repeat: no-repeat;">
                <div class="login-entry-stage" id="login-entry-stage">
                    <button type="button" id="login-open-btn" class="btn btn-primary" aria-expanded="false" aria-controls="login-panel">
                        ENTRAR
                    </button>
                </div>
                <div class="login-panel" id="login-panel" role="dialog" aria-modal="true" aria-labelledby="login-heading" hidden>
                <div class="login-card-wrapper" style="max-width: 19.25rem; width: 100%; margin-left: auto;">
                    <div class="login-card" style="background: white; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); padding: 1rem;">
                        <div class="login-header" style="text-align: center; margin-bottom: 0.75rem;">
                            <h2 id="login-heading" style="font-size: 0.9375rem; font-weight: 600; color: #1f2937; margin-bottom: 0.3125rem;">
                                Bem-vindo de volta!
                            </h2>
                            <p style="color: #6b7280; font-size: 0.78125rem;">
                                Entre para acessar o VeloHub
                            </p>
                        </div>

                        <form id="login-form" class="login-form" style="margin-bottom: 0.75rem;">
                            <div style="margin-bottom: 0.5rem;">
                                <label for="login-email" style="display: block; font-size: 0.546875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
                                    Email
                                </label>
                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    autocomplete="username"
                                    required
                                    style="width: 100%; padding: 0.46875rem 0.625rem; border: 1px solid #d1d5db; border-radius: 0.46875rem; font-size: 0.625rem; outline: none; transition: all 0.2s;"
                                    placeholder="seu.email@velotax.com.br"
                                    onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
                                    onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'"
                                />
                            </div>

                            <div style="margin-bottom: 0.75rem;">
                                <label for="login-password" style="display: block; font-size: 0.546875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">
                                    Senha
                                </label>
                                <div style="position: relative;">
                                    <input
                                        id="login-password"
                                        type="password"
                                        name="password"
                                        autocomplete="current-password"
                                        required
                                        style="width: 100%; padding: 0.46875rem 1.875rem 0.46875rem 0.625rem; border: 1px solid #d1d5db; border-radius: 0.46875rem; font-size: 0.625rem; outline: none; transition: all 0.2s;"
                                        placeholder="Digite sua senha"
                                        onfocus="this.style.borderColor='#3b82f6'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
                                        onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'"
                                    />
                                    <button
                                        id="login-show-password"
                                        type="button"
                                        style="position: absolute; right: 0.46875rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6b7280; cursor: pointer; padding: 0.15625rem;"
                                        aria-label="Mostrar senha"
                                    >
                                        <svg style="width: 0.78125rem; height: 0.78125rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                id="login-submit-btn"
                                style="width: 100%; padding: 0.46875rem 0.9375rem; background: #2563eb; color: white; font-weight: 600; border-radius: 0.46875rem; border: none; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-size: 0.625rem;"
                                onmouseover="this.style.background='#1d4ed8'; this.style.boxShadow='0 6px 8px rgba(0, 0, 0, 0.15)'"
                                onmouseout="this.style.background='#2563eb'; this.style.boxShadow='0 4px 6px rgba(0, 0, 0, 0.1)'"
                            >
                                <span id="login-submit-text">Entrar</span>
                            </button>
                        </form>

                        <div style="position: relative; margin-bottom: 0.75rem;">
                            <div style="position: absolute; inset: 0; display: flex; align-items: center;">
                                <div style="width: 100%; border-top: 1px solid #d1d5db;"></div>
                            </div>
                            <div style="position: relative; display: flex; justify-content: center; font-size: 0.546875rem;">
                                <span style="padding: 0 0.3125rem; background: white; color: #6b7280;">ou</span>
                            </div>
                        </div>

                        <div id="google-signin-button" style="width: 100%; display: flex; justify-content: center; align-items: center; margin-bottom: 0.25rem; min-height: 2.5rem; padding: 0;">
                            <button 
                                id="google-signin-manual-btn"
                                type="button"
                                style="width: 100%; padding: 0.625rem 1.25rem; background: white; border: 1px solid #dadce0; border-radius: 0.46875rem; cursor: pointer; font-size: 0.75rem; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.625rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-height: 2.5rem;"
                                onmouseover="this.style.boxShadow='0 2px 4px rgba(0,0,0,0.15)'; this.style.borderColor='#c4c7c5'"
                                onmouseout="this.style.boxShadow='0 1px 3px rgba(0,0,0,0.1)'; this.style.borderColor='#dadce0'"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" style="flex-shrink: 0;">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Continuar com Google</span>
                            </button>
                        </div>
                        <div id="google-signin-loading" style="text-align: center; color: #6b7280; font-size: 0.5rem; margin-bottom: 0.25rem; display: none;">
                            Carregando Google Sign-In...
                        </div>

                        <div id="login-error" style="margin-top: 0.25rem; margin-bottom: 0.25rem; padding: 0.46875rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 0.3125rem; display: none;">
                            <p style="color: #dc2626; font-size: 0.546875rem; text-align: center; margin: 0;" id="login-error-text"></p>
                        </div>

                        <div id="login-caps-lock" style="margin-top: 0.25rem; margin-bottom: 0.25rem; padding: 0.46875rem; background: #fffbeb; border: 1px solid #fde68a; border-radius: 0.3125rem; display: none;">
                            <p style="color: #d97706; font-size: 0.546875rem; text-align: center; margin: 0; display: flex; align-items: center; justify-content: center; gap: 0.3125rem;">
                                <svg style="width: 0.625rem; height: 0.625rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>CAPS LOCK está ativado</span>
                            </p>
                        </div>

                        <div style="text-align: center; margin-top: 0.25rem;">
                            <p style="font-size: 0.546875rem; color: #6b7280; margin-bottom: 0.25rem;">
                                © 2025 VeloHub. Todos os direitos reservados.
                            </p>
                            <div style="display: flex; justify-content: center; gap: 0.625rem; font-size: 0.46875rem; color: #9ca3af;">
                                <a href="/termos" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#6b7280'" onmouseout="this.style.color='#9ca3af'">Termos de Uso</a>
                                <span>•</span>
                                <a href="/privacidade" style="color: #9ca3af; text-decoration: none; transition: color 0.2s;" onmouseover="this.style.color='#6b7280'" onmouseout="this.style.color='#9ca3af'">Política de Privacidade</a>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        `;
    }

    /**
     * Abre o painel de login (mesmo card) ao clicar em ENTRAR no splash
     */
    function setupOpenLoginPanel(onLoginSuccess) {
        const openBtn = document.getElementById('login-open-btn');
        const entryStage = document.getElementById('login-entry-stage');
        const panel = document.getElementById('login-panel');
        if (!openBtn || !entryStage || !panel) {
            return;
        }

        openBtn.addEventListener('click', () => {
            entryStage.setAttribute('hidden', '');
            panel.removeAttribute('hidden');
            panel.classList.add('login-panel--visible');
            openBtn.setAttribute('aria-expanded', 'true');

            if (!state.googleSignInStarted) {
                state.googleSignInStarted = true;
                setTimeout(() => {
                    initializeGoogleSignIn(onLoginSuccess);
                }, 300);
            }

            setTimeout(() => {
                const email = document.getElementById('login-email');
                if (email) {
                    email.focus();
                }
            }, 0);
        });
    }

    /**
     * Configura os event listeners
     */
    function setupEventListeners(onLoginSuccess) {
        // Formulário de login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                handleEmailPasswordLogin(onLoginSuccess);
            });
        }

        // Botão mostrar/ocultar senha
        if (showPasswordBtn) {
            showPasswordBtn.addEventListener('click', () => {
                state.showPassword = !state.showPassword;
                passwordInput.type = state.showPassword ? 'text' : 'password';
                
                // Atualizar ícone
                if (state.showPassword) {
                    showPasswordBtn.innerHTML = `
                        <svg style="width: 0.78125rem; height: 0.78125rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.07 3.07L12 12m-3.81-3.81L3 3m9 9l3.81 3.81M12 12l3.29 3.29M21 21l-3.29-3.29m0 0a9.97 9.97 0 01-2.12-2.12m-3.07-3.07L12 12m3.81 3.81L21 21" />
                        </svg>
                    `;
                } else {
                    showPasswordBtn.innerHTML = `
                        <svg style="width: 0.78125rem; height: 0.78125rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    `;
                }
            });
        }

        // Atualizar estado quando campos mudam
        if (emailInput) {
            emailInput.addEventListener('input', (e) => {
                state.email = e.target.value;
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                state.password = e.target.value;
            });
        }
    }

    /**
     * Configura detecção de CAPS LOCK
     */
    function setupCapsLockDetection() {
        const handleKeyDown = (e) => {
            if (e.key === 'CapsLock' || e.code === 'CapsLock') {
                requestAnimationFrame(() => {
                    const activeElement = document.activeElement;
                    if (activeElement && activeElement.getModifierState) {
                        const isCapsLockOn = activeElement.getModifierState('CapsLock');
                        state.capsLockOn = isCapsLockOn;
                        updateCapsLockAlert();
                    }
                });
                return;
            }

            if (e.getModifierState && e.getModifierState('CapsLock')) {
                state.capsLockOn = true;
                updateCapsLockAlert();
            } else {
                const key = e.key;
                if (key && typeof key === 'string' && key.length === 1) {
                    if (key >= 'A' && key <= 'Z' && !e.shiftKey) {
                        state.capsLockOn = true;
                        updateCapsLockAlert();
                    } else if (key >= 'a' && key <= 'z' && !e.shiftKey) {
                        state.capsLockOn = false;
                        updateCapsLockAlert();
                    }
                }
            }
        };

        const handleKeyUp = (e) => {
            if (e.key === 'CapsLock' || e.code === 'CapsLock') {
                requestAnimationFrame(() => {
                    const activeElement = document.activeElement;
                    if (activeElement && activeElement.getModifierState) {
                        const isCapsLockOn = activeElement.getModifierState('CapsLock');
                        state.capsLockOn = isCapsLockOn;
                        updateCapsLockAlert();
                    }
                });
                return;
            }

            const activeElement = document.activeElement;
            if (activeElement && activeElement.getModifierState) {
                const isCapsLockOn = activeElement.getModifierState('CapsLock');
                state.capsLockOn = isCapsLockOn;
                updateCapsLockAlert();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }

    /**
     * Atualiza o alerta de CAPS LOCK
     */
    function updateCapsLockAlert() {
        if (capsLockAlert) {
            capsLockAlert.style.display = state.capsLockOn ? 'block' : 'none';
        }
    }

    /**
     * Inicializa Google Sign-In
     */
    function initializeGoogleSignIn(onLoginSuccess) {
        console.log('Inicializando Google Sign-In...');
        
        // Mostrar indicador de carregamento
        const loadingIndicator = document.getElementById('google-signin-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        // Verificar se o script do Google já está carregado
        const checkGoogleScript = (attempts = 0) => {
            if (window.google && window.google.accounts && window.google.accounts.id) {
                console.log('Google Identity Services carregado, configurando...');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                setupGoogleSignIn(onLoginSuccess);
            } else if (attempts < 30) {
                // Tentar novamente até 30 vezes (3 segundos)
                console.log(`Aguardando Google Identity Services... tentativa ${attempts + 1}/30`);
                setTimeout(() => checkGoogleScript(attempts + 1), 100);
            } else {
                console.error('Google Identity Services não carregou após múltiplas tentativas');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'none';
                }
                // O botão manual já está visível, apenas garantir que está funcional
                const manualBtn = document.getElementById('google-signin-manual-btn');
                if (manualBtn) {
                    manualBtn.style.display = 'flex';
                }
            }
        };

        // Iniciar verificação
        checkGoogleScript();
    }

    function resolveApiBaseUrl() {
        if (typeof window !== 'undefined' && typeof window.getApiBaseUrl === 'function') {
            return window.getApiBaseUrl();
        }
        return '/api';
    }

    /**
     * Valida email no backend e conclui sessão (fluxo comum JWT One Tap e OAuth2 token).
     */
    async function completeGoogleLoginWithEmailPicture(profile, onLoginSuccess) {
        var email = profile.email;
        var picture = profile.picture || null;
        var nameFallback = profile.name || '';

        if (!email) {
            setError('Conta Google sem email público. Use outro método de login.');
            return;
        }

        var apiBaseUrl = resolveApiBaseUrl();
        var validateResponse = await fetch(apiBaseUrl + '/auth/validate-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, picture: picture })
        });

        var validateResult;
        try {
            validateResult = await validateResponse.json();
        } catch (jsonError) {
            console.error('Erro ao parsear resposta JSON:', jsonError);
            setError('Erro ao processar resposta do servidor. Verifique sua conexão.');
            return;
        }

        if (!validateResult.success) {
            var msg = validateResult.error || 'Erro ao validar acesso';
            if (validateResponse.status === 503) {
                msg = 'Servidor indisponível (MongoDB). Verifique a variável MONGO_ENV na FONTE DA VERDADE (arquivo .env) e se a API está rodando (npm run api).';
            }
            setError(msg);
            return;
        }

        var userData = {
            name: (validateResult.user && validateResult.user.name) || nameFallback || '',
            email: (validateResult.user && validateResult.user.email) || email,
            picture: (validateResult.user && validateResult.user.picture) || picture || null
        };

        if (window.saveUserSession) {
            window.saveUserSession(userData);
        }
        if (window.registerLoginSession) {
            await window.registerLoginSession(userData);
        }
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('userName', userData.name);
        if (userData.picture) {
            localStorage.setItem('userPicture', userData.picture);
        }
        console.log('Login Google realizado com sucesso');
        if (onLoginSuccess) {
            onLoginSuccess(userData);
        }
    }

    /**
     * OAuth2 token (popup) — evita One Tap / FedCM e o pedido a accounts.google.com/gsi/status que falha com 403 em vários browsers.
     */
    async function handleGoogleOAuthTokenResponse(tokenResponse, onLoginSuccess) {
        setError('');
        try {
            if (tokenResponse.error) {
                var desc = tokenResponse.error_description || tokenResponse.error;
                if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
                    setError('');
                } else {
                    setError('Google: ' + String(desc));
                }
                return;
            }
            if (!tokenResponse.access_token) {
                setError('Resposta Google incompleta. Tente novamente.');
                return;
            }
            var ur = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: 'Bearer ' + tokenResponse.access_token }
            });
            if (!ur.ok) {
                setError('Não foi possível ler o perfil Google (HTTP ' + ur.status + ').');
                return;
            }
            var p = await ur.json();
            await completeGoogleLoginWithEmailPicture(
                { email: p.email, picture: p.picture || null, name: p.name || '' },
                onLoginSuccess
            );
        } catch (err) {
            console.error('OAuth Google:', err);
            setError('Erro ao concluir login Google. Tente outro navegador ou desative bloqueadores para este site.');
        }
    }

    /**
     * Configura o Google Sign-In
     */
    function setupGoogleSignIn(onLoginSuccess) {
        if (!window.google || !window.google.accounts || !window.google.accounts.id) {
            console.error('Google Identity Services não está disponível');
            // Tentar novamente após delay
            setTimeout(() => initializeGoogleSignIn(onLoginSuccess), 500);
            return;
        }

        let clientId = '';
        if (typeof window !== 'undefined' && window.getClientId) {
            try {
                clientId = window.getClientId();
            } catch (error) {
                console.warn('Erro ao obter Client ID, usando padrão:', error);
            }
        }
        if (!clientId || !String(clientId).trim()) {
            clientId = '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com';
        }
        
        // Garantir que temos um Client ID válido
        if (!clientId || clientId.trim() === '') {
            console.error('Client ID do Google não está definido!');
            return;
        }

        if (!clientId) {
            console.error('Client ID do Google não está definido!');
            return;
        }

        console.log('Configurando Google Sign-In (OAuth2 token + popup) com Client ID:', clientId);

        try {
            if (!window.google.accounts.oauth2 || typeof window.google.accounts.oauth2.initTokenClient !== 'function') {
                console.error('Google OAuth2 (accounts.oauth2) não disponível no script gsi/client');
                setError('Biblioteca Google incompleta. Recarregue a página.');
                return;
            }

            var tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
                callback: function (tokenResponse) {
                    void (async function () {
                        setLoading(true);
                        try {
                            await handleGoogleOAuthTokenResponse(tokenResponse, onLoginSuccess);
                        } finally {
                            setLoading(false);
                        }
                    })();
                }
            });

            var manualButton = document.getElementById('google-signin-manual-btn');
            if (manualButton) {
                manualButton.removeAttribute('onclick');
                manualButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    setError('');
                    try {
                        tokenClient.requestAccessToken({ prompt: 'select_account' });
                    } catch (err) {
                        console.error(err);
                        setError('Não foi possível iniciar o login Google.');
                    }
                });
            }

            console.log('Google Sign-In: cliente OAuth2 de token pronto (popup; sem One Tap / gsi/status).');
        } catch (error) {
            console.error('Erro ao configurar Google Sign-In:', error);
            setError('Erro ao configurar login Google.');
        }
    }

    /**
     * Handler para resposta de credenciais do Google
     */
    async function handleGoogleCredentialResponse(response, onLoginSuccess) {
        setLoading(true);
        setError('');
        try {
            var payload = window.decodeJWT ? window.decodeJWT(response.credential) : decodeJWT(response.credential);
            if (!payload || !payload.email) {
                setError('Erro ao processar dados do Google. Tente novamente.');
                return;
            }
            console.log('Usando API Base URL para validação:', resolveApiBaseUrl());
            await completeGoogleLoginWithEmailPicture(
                { email: payload.email, picture: payload.picture || null, name: payload.name || '' },
                onLoginSuccess
            );
        } catch (error) {
            console.error('Erro no login:', error);
            setError('Erro ao processar login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Handler para login por email/senha
     */
    async function handleEmailPasswordLogin(onLoginSuccess) {
        setLoading(true);
        setError('');

        try {
            const apiBaseUrl = resolveApiBaseUrl();
            console.log('Usando API Base URL para login:', apiBaseUrl);
            
            const response = await fetch(`${apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: state.email,
                    password: state.password
                })
            });

            const result = await response.json();

            if (!result.success) {
                let msg = result.error || 'Email ou senha incorretos';
                if (response.status === 503) {
                    msg = 'Servidor indisponível (MongoDB). Verifique a variável MONGO_ENV na FONTE DA VERDADE (arquivo .env) e se a API está rodando (npm run api).';
                }
                setError(msg);
                setLoading(false);
                return;
            }

            // Login bem-sucedido
            const userData = result.user;

            // Salvar sessão
            if (window.saveUserSession) {
                window.saveUserSession(userData);
            }

            // Registrar login no backend (cria sessão em academy_registros.sessions)
            if (window.registerLoginSession) {
                await window.registerLoginSession(userData);
            }

            // Salvar sessionId e userEmail para progresso/quiz (compatibilidade)
            if (result.sessionId) {
                localStorage.setItem('academy_session_id', result.sessionId);
            }
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('userName', userData.name);
            if (userData.picture) {
                localStorage.setItem('userPicture', userData.picture);
            }

            console.log('Login realizado com sucesso');
            if (onLoginSuccess) {
                onLoginSuccess(userData);
            }
        } catch (error) {
            console.error('Erro no login:', error);
            setError('Erro ao processar login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    /**
     * Decodifica JWT (fallback se não estiver disponível globalmente)
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
     * Atualiza estado de loading
     */
    function setLoading(loading) {
        state.isLoading = loading;
        const submitBtn = document.getElementById('login-submit-btn');
        const submitText = document.getElementById('login-submit-text');
        
        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.style.opacity = loading ? '0.5' : '1';
            submitBtn.style.cursor = loading ? 'not-allowed' : 'pointer';
        }

        if (submitText) {
            submitText.textContent = loading ? 'Entrando...' : 'Entrar';
        }

        if (emailInput) emailInput.disabled = loading;
        if (passwordInput) passwordInput.disabled = loading;
        if (showPasswordBtn) showPasswordBtn.disabled = loading;
    }

    /**
     * Atualiza mensagem de erro
     */
    function setError(error) {
        state.error = error;
        if (errorMessage) {
            const errorText = document.getElementById('login-error-text');
            if (errorText) {
                errorText.textContent = error;
            }
            errorMessage.style.display = error ? 'block' : 'none';
        }
    }

    // Exportar função principal
    window.initLoginPage = initLoginPage;

})();
