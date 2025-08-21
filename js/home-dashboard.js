// JavaScript para a página Home Dashboard da VeloAcademy
const homeDashboardApp = {
    init() {
        this.checkAuthentication();
        this.initTheme();
        this.initUserInfo();
        this.initLogout();
        this.initAnimations();
    },

    checkAuthentication() {
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        if (!userEmail || !userName) {
            // Usuário não está logado, redirecionar para landing page
            window.location.href = './index.html';
            return;
        }
        
        // Usuário está logado, continuar
        console.log('Usuário autenticado:', userName);
    },

    initTheme() {
        const themeToggle = document.getElementById('theme-toggle');
        const sunIcon = themeToggle.querySelector('.bx-sun');
        const moonIcon = themeToggle.querySelector('.bx-moon');
        const docElement = document.documentElement;

        const savedTheme = localStorage.getItem('theme') || 'light';
        docElement.setAttribute('data-theme', savedTheme);
        themeToggle.setAttribute('data-theme', savedTheme);

        const updateIcons = (theme) => {
            if (theme === 'light') {
                sunIcon.classList.add('active');
                moonIcon.classList.remove('active');
            } else {
                sunIcon.classList.remove('active');
                moonIcon.classList.add('active');
            }
        };

        updateIcons(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = docElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            docElement.setAttribute('data-theme', newTheme);
            themeToggle.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcons(newTheme);
        });
    },

    initUserInfo() {
        const userName = localStorage.getItem('userName');
        const userPicture = localStorage.getItem('userPicture');
        
        // Atualizar nome do usuário
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName || 'Usuário';
        }
        
        // Atualizar avatar do usuário
        const userAvatar = document.getElementById('user-avatar');
        if (userPicture && userAvatar) {
            userAvatar.src = userPicture;
            userAvatar.style.display = 'block';
        } else if (userAvatar) {
            // Avatar padrão se não houver foto
            userAvatar.style.display = 'none';
            const userInfo = document.getElementById('user-info');
            userInfo.classList.add('no-avatar');
        }
    },

    initLogout() {
        const logoutBtn = document.getElementById('logout-btn');
        
        logoutBtn.addEventListener('click', () => {
            // Limpar dados do usuário
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            localStorage.removeItem('userPicture');
            localStorage.removeItem('dadosAtendenteChatbot');
            
            // Redirecionar para landing page
            window.location.href = './index.html';
        });
    },

    initAnimations() {
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
        const animatedElements = document.querySelectorAll('.stat-card, .course-card');
        animatedElements.forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.transitionDelay = `${index * 100}ms`;
            observer.observe(el);
        });
    }
};

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    homeDashboardApp.init();
});
