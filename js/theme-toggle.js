// Sistema de Toggle de Tema - IMPLEMENTADO SEGUINDO GUIDELINE
// VeloAcademy - VeloHub Design System

// Estado do tema
let isDarkMode = false;

// Função para alternar tema
const toggleDarkMode = () => {
    isDarkMode = !isDarkMode;
    
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('velohub-theme', 'dark');
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('velohub-theme', 'light');
        updateThemeIcon(false);
    }
};

// Função para atualizar ícone do tema
const updateThemeIcon = (isDark) => {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        if (isDark) {
            themeIcon.innerHTML = '🌙'; // Lua para tema escuro
            themeIcon.classList.add('active');
        } else {
            themeIcon.innerHTML = '☀️'; // Sol para tema claro
            themeIcon.classList.remove('active');
        }
    }
};

// Função para aplicar tema salvo ao carregar
const applySavedTheme = () => {
    const savedTheme = localStorage.getItem('velohub-theme') || 'light';
    const isDark = savedTheme === 'dark';
    
    if (isDark) {
        document.documentElement.classList.add('dark');
        isDarkMode = true;
        updateThemeIcon(true);
    } else {
        document.documentElement.classList.remove('dark');
        isDarkMode = false;
        updateThemeIcon(false);
    }
};

// Função para detectar preferência do sistema
const detectSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
};

// Função para aplicar tema do sistema se não houver preferência salva
const applySystemTheme = () => {
    if (!localStorage.getItem('velohub-theme')) {
        const systemTheme = detectSystemTheme();
        if (systemTheme === 'dark') {
            document.documentElement.classList.add('dark');
            isDarkMode = true;
            updateThemeIcon(true);
        }
    }
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema salvo
    applySavedTheme();
    
    // Aplicar tema do sistema se não houver preferência
    applySystemTheme();
    
    // Adicionar listener para o botão de tema
    const themeSwitch = document.querySelector('.theme-switch-wrapper');
    if (themeSwitch) {
        themeSwitch.addEventListener('click', toggleDarkMode);
    }
    
    // Listener para mudanças na preferência do sistema
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('velohub-theme')) {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                    isDarkMode = true;
                    updateThemeIcon(true);
                } else {
                    document.documentElement.classList.remove('dark');
                    isDarkMode = false;
                    updateThemeIcon(false);
                }
            }
        });
    }
});

// Exportar funções para uso externo
window.VeloHubTheme = {
    toggle: toggleDarkMode,
    isDark: () => isDarkMode,
    getCurrentTheme: () => isDarkMode ? 'dark' : 'light'
};
