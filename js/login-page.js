// VERSION: v1.0.4 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
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
        capsLockOn: false
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

        // Inicializar Google Sign-In após um pequeno delay para garantir que o DOM está pronto
        setTimeout(() => {
            initializeGoogleSignIn(onLoginSuccess);
        }, 500);
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
            <div class="login-page-container" style="min-height: 100vh; display: flex; align-items: center; position: relative; background-image: url(./Public/loginpage.jpg); background-size: cover; background-position: center; background-repeat: no-repeat;">
                <div class="login-card-wrapper" style="max-width: 19.25rem; width: 100%; margin-left: auto; padding-right: 2rem;">
                    <div class="login-card" style="background: white; border-radius: 1rem; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); padding: 1rem;">
                        <div class="login-header" style="text-align: center; margin-bottom: 0.75rem;">
                            <h2 style="font-size: 0.9375rem; font-weight: 600; color: #1f2937; margin-bottom: 0.3125rem;">
                                Bem-vindo de volta!
                            </h2>
                            <p style="color: #6b7280; font-size: 0.78125rem;">
                                Faça login para acessar o VeloHub
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
        `;
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

        let clientId = '278491073220-eb4ogvn3aifu0ut9mq3rvu5r9r9l3137.apps.googleusercontent.com';
        
        // Tentar obter Client ID da função getClientId se disponível
        if (typeof window !== 'undefined' && window.getClientId) {
            try {
                clientId = window.getClientId();
            } catch (error) {
                console.warn('Erro ao obter Client ID, usando padrão:', error);
            }
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

        console.log('Configurando Google Sign-In com Client ID:', clientId);
        
        // Verificar se estamos em localhost e avisar sobre configuração (apenas se necessário)
        const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
        // Não mostrar aviso se já estiver configurado (verificado pelos erros anteriores)
        // O aviso só aparecerá se houver problemas de configuração

        // Configurar callback global
        window.handleCredentialResponse = async (response) => {
            await handleGoogleCredentialResponse(response, onLoginSuccess);
        };

        try {
            // Inicializar Google Sign-In
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: window.handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true
            });

            console.log('Google Sign-In inicializado');

            // Configurar o botão manual para usar o prompt do Google
            const manualButton = document.getElementById('google-signin-manual-btn');
            if (manualButton) {
                // Remover onclick inline e adicionar event listener
                manualButton.removeAttribute('onclick');
                manualButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (window.google && window.google.accounts && window.google.accounts.id) {
                        window.google.accounts.id.prompt();
                    } else {
                        alert('Google Sign-In ainda está carregando. Aguarde um momento e tente novamente.');
                    }
                });
            }

            // Tentar substituir pelo botão oficial do Google se disponível
            const renderGoogleButton = (attempts = 0) => {
                googleSignInButton = document.getElementById('google-signin-button');
                
                if (!googleSignInButton) {
                    if (attempts < 5) {
                        setTimeout(() => renderGoogleButton(attempts + 1), 200);
                    }
                    return;
                }

                if (!window.google.accounts.id) {
                    if (attempts < 5) {
                        setTimeout(() => renderGoogleButton(attempts + 1), 200);
                    }
                    return;
                }

                try {
                    // Tentar renderizar o botão oficial do Google
                    window.google.accounts.id.renderButton(googleSignInButton, {
                        theme: 'outline',
                        size: 'large',
                        width: googleSignInButton.offsetWidth || 280, // Usar largura do container
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'center'
                    });
                    
                    console.log('Botão oficial do Google renderizado');
                    
                    // Se o botão oficial foi renderizado, ocultar o botão manual e ajustar tamanho do iframe
                    setTimeout(() => {
                        const iframe = googleSignInButton.querySelector('iframe');
                        if (iframe) {
                            // Ajustar tamanho do iframe para ocupar toda a largura e altura adequada
                            iframe.style.width = '100%';
                            iframe.style.minHeight = '40px';
                            iframe.style.height = 'auto';
                            
                            const manualBtn = document.getElementById('google-signin-manual-btn');
                            if (manualBtn) {
                                manualBtn.style.display = 'none';
                            }
                        }
                    }, 500);
                } catch (error) {
                    console.error('Erro ao renderizar botão oficial do Google:', error);
                    // Manter o botão manual visível
                }
            };

            // Tentar renderizar o botão oficial após um delay
            setTimeout(() => renderGoogleButton(), 500);
        } catch (error) {
            console.error('Erro ao configurar Google Sign-In:', error);
        }
    }

    /**
     * Handler para resposta de credenciais do Google
     */
    async function handleGoogleCredentialResponse(response, onLoginSuccess) {
        setLoading(true);
        setError('');

        try {
            // Decodificar JWT
            const payload = window.decodeJWT ? window.decodeJWT(response.credential) : decodeJWT(response.credential);
            
            if (!payload || !payload.email) {
                setError('Erro ao processar dados do Google. Tente novamente.');
                setLoading(false);
                return;
            }

            // Validar acesso no backend
            let apiBaseUrl = '/api';
            
            // Tentar obter URL da API da função getApiBaseUrl se disponível
            if (typeof window !== 'undefined' && window.getApiBaseUrl) {
                try {
                    apiBaseUrl = window.getApiBaseUrl();
                } catch (error) {
                    console.warn('Erro ao obter API base URL, usando padrão:', error);
                }
            }
            
            // Fallback: se estiver em localhost, sempre usar localhost:3001
            if (typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (apiBaseUrl === '/api') {
                    apiBaseUrl = 'http://localhost:3001/api';
                }
            }
            
            console.log('Usando API Base URL para validação:', apiBaseUrl);
            
            const validateResponse = await fetch(`${apiBaseUrl}/auth/validate-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: payload.email,
                    picture: payload.picture || null
                })
            });

            let validateResult;
            try {
                validateResult = await validateResponse.json();
            } catch (jsonError) {
                console.error('Erro ao parsear resposta JSON:', jsonError);
                setError('Erro ao processar resposta do servidor. Verifique sua conexão.');
                setLoading(false);
                return;
            }

            if (!validateResult.success) {
                setError(validateResult.error || 'Erro ao validar acesso');
                setLoading(false);
                return;
            }

            // Usar dados validados do backend
            const userData = {
                name: validateResult.user?.name || payload.name,
                email: validateResult.user?.email || payload.email,
                picture: validateResult.user?.picture || null
            };

            // Salvar sessão
            if (window.saveUserSession) {
                window.saveUserSession(userData);
            }

            // Registrar login no backend
            if (window.registerLoginSession) {
                await window.registerLoginSession(userData);
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
     * Handler para login por email/senha
     */
    async function handleEmailPasswordLogin(onLoginSuccess) {
        setLoading(true);
        setError('');

        try {
            let apiBaseUrl = '/api';
            
            // Tentar obter URL da API da função getApiBaseUrl se disponível
            if (typeof window !== 'undefined' && window.getApiBaseUrl) {
                try {
                    apiBaseUrl = window.getApiBaseUrl();
                } catch (error) {
                    console.warn('Erro ao obter API base URL, usando padrão:', error);
                }
            }
            
            // Fallback: se estiver em localhost, sempre usar localhost:3001
            if (typeof window !== 'undefined' && 
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                if (apiBaseUrl === '/api') {
                    apiBaseUrl = 'http://localhost:3001/api';
                }
            }
            
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
                setError(result.error || 'Email ou senha incorretos');
                setLoading(false);
                return;
            }

            // Login bem-sucedido
            const userData = result.user;

            // Salvar sessão
            if (window.saveUserSession) {
                window.saveUserSession(userData);
            }

            // Registrar login no backend
            if (window.registerLoginSession) {
                await window.registerLoginSession(userData);
            }

            // Salvar sessionId
            if (result.sessionId) {
                localStorage.setItem('academy_session_id', result.sessionId);
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
