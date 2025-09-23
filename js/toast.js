/**
 * Sistema de Toast Notifications - VeloAcademy
 * Versão: v1.0.0
 * Data: 2024-12-19
 * Autor: VeloHub Development Team
 */

class ToastManager {
    constructor() {
        this.container = document.getElementById('toast-container');
        this.toasts = new Map();
        this.toastId = 0;
    }

    /**
     * Mostra um toast de sucesso
     * @param {string} title - Título do toast
     * @param {string} message - Mensagem do toast
     * @param {number} duration - Duração em milissegundos (padrão: 5000)
     */
    success(title, message, duration = 5000) {
        return this.show('success', title, message, duration);
    }

    /**
     * Mostra um toast de erro
     * @param {string} title - Título do toast
     * @param {string} message - Mensagem do toast
     * @param {number} duration - Duração em milissegundos (padrão: 7000)
     */
    error(title, message, duration = 7000) {
        return this.show('error', title, message, duration);
    }

    /**
     * Mostra um toast
     * @param {string} type - Tipo do toast ('success' ou 'error')
     * @param {string} title - Título do toast
     * @param {string} message - Mensagem do toast
     * @param {number} duration - Duração em milissegundos
     */
    show(type, title, message, duration = 5000) {
        const id = ++this.toastId;
        const toast = this.createToast(id, type, title, message);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-remover após duração
        if (duration > 0) {
            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    /**
     * Cria o elemento HTML do toast
     * @param {number} id - ID único do toast
     * @param {string} type - Tipo do toast
     * @param {string} title - Título do toast
     * @param {string} message - Mensagem do toast
     */
    createToast(id, type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.toastId = id;

        const icon = this.getIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="toastManager.remove(${id})">
                <i class="fas fa-times"></i>
            </button>
        `;

        return toast;
    }

    /**
     * Obtém o ícone apropriado para o tipo de toast
     * @param {string} type - Tipo do toast
     */
    getIcon(type) {
        const icons = {
            success: 'fas fa-check',
            error: 'fas fa-exclamation-triangle'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    /**
     * Remove um toast específico
     * @param {number} id - ID do toast
     */
    remove(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        toast.classList.remove('show');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 300);
    }

    /**
     * Remove todos os toasts
     */
    clear() {
        this.toasts.forEach((toast, id) => {
            this.remove(id);
        });
    }
}

// Instância global do gerenciador de toasts
const toastManager = new ToastManager();

// Funções de conveniência para uso global
window.showToast = {
    success: (title, message, duration) => toastManager.success(title, message, duration),
    error: (title, message, duration) => toastManager.error(title, message, duration)
};

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}
