// VERSION: v1.0.1 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
// Página de Perfil do Usuário - VeloAcademy
// Mudanças v1.0.1: Removida funcionalidade de upload de foto - apenas visualização

(function() {
    'use strict';

    // Estado da aplicação
    const state = {
        userData: {
            colaboradorNome: '',
            telefone: '',
            userMail: '',
            profile_pic: '',
            ssoPicture: ''
        },
        loading: true,
        saving: false,
        passwordData: {
            novaSenha: '',
            confirmarSenha: ''
        }
    };

    // Referências aos elementos DOM
    let elements = {};

    // Avatar padrão SVG
    const defaultAvatar = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjY0IiBjeT0iNjQiIHI9IjY0IiBmaWxsPSIjMDA3YmZmIi8+CjxzdmcgeD0iMzIiIHk9IjMyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMzIgMTZDNDAuODM2IDE2IDQ4IDIzLjE2NCA0OCAzMkM0OCA0MC44MzYgNDAuODM2IDQ4IDMyIDQ4QzIzLjE2NCA0OCAxNiA0MC44MzYgMTYgMzJDMTYgMjMuMTY0IDIzLjE2NCAxNiAzMiAxNlpNMzIgNDhDNDAuODM2IDQ4IDQ4IDUwLjE2NCA0OCA1OEM0OCA2Ni44MzYgNDAuODM2IDc0IDMyIDc0QzIzLjE2NCA3NCAxNiA2Ni44MzYgMTYgNThDMTYgNTAuMTY0IDIzLjE2NCA0OCAzMiA0OFoiLz4KPC9zdmc+Cjwvc3ZnPgo=';

    /**
     * Inicializa a página de perfil
     */
    function init() {
        // Verificar se usuário está logado
        if (!isSessionValid()) {
            window.location.href = './index.html';
            return;
        }

        // Obter referências aos elementos DOM
        getElements();

        // Configurar event listeners
        setupEventListeners();

        // Carregar dados do usuário
        loadUserData();

        // Carregar header
        loadHeader();
    }

    /**
     * Obtém referências aos elementos DOM
     */
    function getElements() {
        elements = {
            loading: document.getElementById('loading'),
            perfilContent: document.getElementById('perfil-content'),
            messageContainer: document.getElementById('message-container'),
            fotoPerfil: document.getElementById('foto-perfil'),
            perfilForm: document.getElementById('perfil-form'),
            colaboradorNome: document.getElementById('colaboradorNome'),
            userMail: document.getElementById('userMail'),
            telefone: document.getElementById('telefone'),
            btnSalvar: document.getElementById('btn-salvar'),
            btnAlterarSenha: document.getElementById('btn-alterar-senha'),
            passwordModal: document.getElementById('password-modal'),
            novaSenha: document.getElementById('novaSenha'),
            confirmarSenha: document.getElementById('confirmarSenha'),
            senhaError: document.getElementById('senha-error'),
            btnSalvarSenha: document.getElementById('btn-salvar-senha'),
            btnCancelarSenha: document.getElementById('btn-cancelar-senha')
        };
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // Formulário de perfil
        if (elements.perfilForm) {
            elements.perfilForm.addEventListener('submit', handleSave);
        }

        // Botão alterar senha
        if (elements.btnAlterarSenha) {
            elements.btnAlterarSenha.addEventListener('click', () => {
                showPasswordModal();
            });
        }

        // Modal de senha
        if (elements.novaSenha && elements.confirmarSenha) {
            elements.novaSenha.addEventListener('input', validatePassword);
            elements.confirmarSenha.addEventListener('input', validatePassword);
        }

        if (elements.btnSalvarSenha) {
            elements.btnSalvarSenha.addEventListener('click', handleChangePassword);
        }

        if (elements.btnCancelarSenha) {
            elements.btnCancelarSenha.addEventListener('click', hidePasswordModal);
        }
    }

    /**
     * Carrega o header da página
     */
    function loadHeader() {
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder && typeof window.loadHeader === 'function') {
            window.loadHeader();
        }
    }

    /**
     * Verifica se a sessão é válida
     */
    function isSessionValid() {
        if (typeof window.isSessionValid === 'function') {
            return window.isSessionValid();
        }
        return false;
    }

    /**
     * Obtém a sessão do usuário
     */
    function getUserSession() {
        if (typeof window.getUserSession === 'function') {
            return window.getUserSession();
        }
        return null;
    }

    /**
     * Carrega dados do usuário
     */
    async function loadUserData() {
        try {
            state.loading = true;
            updateLoadingState();

            const session = getUserSession();
            if (!session || !session.user) {
                showMessage('error', 'Sessão inválida. Faça login novamente.');
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 2000);
                return;
            }

            const email = session.user.email;
            const ssoPicture = session.user.picture || '';

            // Inicializar com dados da sessão
            state.userData = {
                colaboradorNome: session.user.name || '',
                telefone: '',
                userMail: email,
                profile_pic: '',
                ssoPicture: ssoPicture
            };

            // Buscar dados do MongoDB via endpoint
            try {
                const apiBaseUrl = window.getApiBaseUrl ? window.getApiBaseUrl() : '/api';
                const response = await fetch(`${apiBaseUrl}/auth/profile?email=${encodeURIComponent(email)}`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.profile) {
                        state.userData = {
                            colaboradorNome: data.profile.colaboradorNome || session.user.name || '',
                            telefone: data.profile.telefone || '',
                            userMail: data.profile.userMail || email,
                            profile_pic: data.profile.profile_pic || '',
                            ssoPicture: ssoPicture
                        };
                    }
                }
            } catch (error) {
                console.log('Dados adicionais não disponíveis:', error);
            }

            // Atualizar UI
            updateUI();
        } catch (error) {
            console.error('Erro ao carregar dados do usuário:', error);
            showMessage('error', 'Erro ao carregar dados do perfil');
        } finally {
            state.loading = false;
            updateLoadingState();
        }
    }

    /**
     * Atualiza o estado de loading
     */
    function updateLoadingState() {
        if (elements.loading) {
            elements.loading.classList.toggle('hidden', !state.loading);
        }
        if (elements.perfilContent) {
            elements.perfilContent.classList.toggle('hidden', state.loading);
        }
    }

    /**
     * Atualiza a UI com os dados do usuário
     */
    function updateUI() {
        // Foto de perfil (apenas visualização)
        if (elements.fotoPerfil) {
            const fotoSrc = state.userData.ssoPicture || state.userData.profile_pic || defaultAvatar;
            elements.fotoPerfil.src = fotoSrc;
            elements.fotoPerfil.onerror = function() {
                this.src = defaultAvatar;
            };
        }

        // Campos do formulário
        if (elements.colaboradorNome) {
            elements.colaboradorNome.value = state.userData.colaboradorNome;
        }
        if (elements.userMail) {
            elements.userMail.value = state.userData.userMail;
        }
        if (elements.telefone) {
            elements.telefone.value = state.userData.telefone;
        }

        // Botão salvar
        if (elements.btnSalvar) {
            elements.btnSalvar.disabled = state.saving;
            elements.btnSalvar.textContent = state.saving ? 'Salvando...' : 'Salvar Alterações';
        }
    }

    /**
     * Salva alterações do perfil
     */
    async function handleSave(e) {
        e.preventDefault();

        try {
            state.saving = true;
            updateUI();
            showMessage('', '');

            const session = getUserSession();
            if (!session || !session.user) {
                showMessage('error', 'Sessão inválida. Faça login novamente.');
                return;
            }

            const apiBaseUrl = window.getApiBaseUrl ? window.getApiBaseUrl() : '/api';
            const response = await fetch(`${apiBaseUrl}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: session.user.email,
                    colaboradorNome: elements.colaboradorNome.value,
                    telefone: elements.telefone.value
                })
            });

            const data = await response.json();
            if (data.success) {
                state.userData.colaboradorNome = elements.colaboradorNome.value;
                state.userData.telefone = elements.telefone.value;

                // Atualizar sessão local
                const updatedSession = {
                    ...session,
                    user: {
                        ...session.user,
                        name: state.userData.colaboradorNome,
                        picture: state.userData.profile_pic || state.userData.ssoPicture || session.user.picture
                    }
                };
                localStorage.setItem('veloacademy_user_session', JSON.stringify(updatedSession));

                // Atualizar header se função disponível
                if (typeof window.showHeaderButtons === 'function') {
                    window.showHeaderButtons(updatedSession.user);
                }

                showMessage('success', 'Perfil atualizado com sucesso!');
            } else {
                showMessage('error', data.error || 'Erro ao atualizar perfil');
            }
        } catch (error) {
            console.error('Erro ao salvar perfil:', error);
            showMessage('error', 'Erro ao salvar perfil. Tente novamente.');
        } finally {
            state.saving = false;
            updateUI();
        }
    }

    /**
     * Mostra modal de alterar senha
     */
    function showPasswordModal() {
        if (elements.passwordModal) {
            elements.passwordModal.classList.remove('hidden');
        }
        state.passwordData = { novaSenha: '', confirmarSenha: '' };
        if (elements.novaSenha) elements.novaSenha.value = '';
        if (elements.confirmarSenha) elements.confirmarSenha.value = '';
        validatePassword();
    }

    /**
     * Esconde modal de alterar senha
     */
    function hidePasswordModal() {
        if (elements.passwordModal) {
            elements.passwordModal.classList.add('hidden');
        }
        state.passwordData = { novaSenha: '', confirmarSenha: '' };
        if (elements.novaSenha) elements.novaSenha.value = '';
        if (elements.confirmarSenha) elements.confirmarSenha.value = '';
    }

    /**
     * Valida senha
     */
    function validatePassword() {
        const novaSenha = elements.novaSenha ? elements.novaSenha.value : '';
        const confirmarSenha = elements.confirmarSenha ? elements.confirmarSenha.value : '';

        state.passwordData.novaSenha = novaSenha;
        state.passwordData.confirmarSenha = confirmarSenha;

        const passwordsMatch = novaSenha === confirmarSenha && novaSenha.length > 0;
        const minLength = novaSenha.length >= 6;

        if (elements.senhaError) {
            if (confirmarSenha.length > 0 && novaSenha !== confirmarSenha) {
                elements.senhaError.classList.remove('hidden');
            } else {
                elements.senhaError.classList.add('hidden');
            }
        }

        if (elements.btnSalvarSenha) {
            elements.btnSalvarSenha.disabled = !passwordsMatch || !minLength;
        }
    }

    /**
     * Altera senha
     */
    async function handleChangePassword() {
        if (state.passwordData.novaSenha !== state.passwordData.confirmarSenha) {
            showMessage('error', 'As senhas não coincidem');
            return;
        }

        if (state.passwordData.novaSenha.length < 6) {
            showMessage('error', 'A senha deve ter no mínimo 6 caracteres');
            return;
        }

        try {
            state.saving = true;
            if (elements.btnSalvarSenha) {
                elements.btnSalvarSenha.disabled = true;
                elements.btnSalvarSenha.textContent = 'Alterando...';
            }
            showMessage('', '');

            const session = getUserSession();
            if (!session || !session.user) {
                showMessage('error', 'Sessão inválida. Faça login novamente.');
                return;
            }

            const apiBaseUrl = window.getApiBaseUrl ? window.getApiBaseUrl() : '/api';
            const response = await fetch(`${apiBaseUrl}/auth/profile/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: session.user.email,
                    novaSenha: state.passwordData.novaSenha
                })
            });

            const data = await response.json();
            if (data.success) {
                showMessage('success', 'Senha alterada com sucesso!');
                hidePasswordModal();
            } else {
                showMessage('error', data.error || 'Erro ao alterar senha');
            }
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            showMessage('error', 'Erro ao alterar senha. Tente novamente.');
        } finally {
            state.saving = false;
            if (elements.btnSalvarSenha) {
                elements.btnSalvarSenha.disabled = false;
                elements.btnSalvarSenha.textContent = 'Salvar';
            }
        }
    }

    /**
     * Mostra mensagem de feedback
     */
    function showMessage(type, text) {
        if (!elements.messageContainer) return;

        elements.messageContainer.innerHTML = '';
        
        if (text) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type === 'success' ? 'message-success' : type === 'error' ? 'message-error' : ''}`;
            messageDiv.textContent = text;
            elements.messageContainer.appendChild(messageDiv);

            // Remover mensagem após 5 segundos
            if (type !== '') {
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 5000);
            }
        }
    }

    // Inicializar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
