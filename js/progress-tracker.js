// VERSION: v1.0.1 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// Sistema de rastreamento de progresso de vídeos e desbloqueio de quizzes

const ProgressTracker = {
    // Função para obter URL base da API
    getApiBaseUrl() {
        // Em desenvolvimento, usar localhost
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            return 'http://localhost:3001/api';
        }
        // Em produção, usar URL relativa (API no mesmo domínio)
        return '/api';
    },
    
    // Getter para compatibilidade com código existente
    get apiBaseUrl() {
        return this.getApiBaseUrl();
    },
    
    // Cache local de progresso
    progressCache: {},
    
    // Obter email do usuário autenticado
    getUserEmail() {
        try {
            const userEmail = localStorage.getItem('userEmail');
            if (!userEmail) {
                throw new Error('Usuário não autenticado');
            }
            return userEmail;
        } catch (error) {
            console.error('Erro ao obter email do usuário:', error);
            return null;
        }
    },
    
    // Salvar progresso de aula completada
    async saveVideoProgress(subtitle, lessonTitle, allLessonTitles = null) {
        try {
            const userEmail = this.getUserEmail();
            if (!userEmail) {
                console.warn('Usuário não autenticado, progresso não será salvo');
                return { success: false, error: 'Usuário não autenticado' };
            }
            
            const requestBody = {
                userEmail,
                subtitle,
                lessonTitle
            };
            
            // Adicionar lista completa de aulas se fornecida
            if (allLessonTitles && Array.isArray(allLessonTitles) && allLessonTitles.length > 0) {
                requestBody.allLessonTitles = allLessonTitles;
            }
            
            const response = await fetch(`${this.apiBaseUrl}/progress/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Atualizar cache local
                const cacheKey = `${userEmail}_${subtitle}`;
                this.progressCache[cacheKey] = result.progress;
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao salvar progresso:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Obter progresso de um subtítulo específico
    async getProgress(subtitle) {
        try {
            const userEmail = this.getUserEmail();
            if (!userEmail) {
                return null;
            }
            
            const cacheKey = `${userEmail}_${subtitle}`;
            
            // Verificar cache primeiro
            if (this.progressCache[cacheKey]) {
                return this.progressCache[cacheKey];
            }
            
            const response = await fetch(
                `${this.apiBaseUrl}/progress/${encodeURIComponent(userEmail)}/${encodeURIComponent(subtitle)}`
            );
            
            const result = await response.json();
            
            if (result.success && result.progress) {
                this.progressCache[cacheKey] = result.progress;
                return result.progress;
            }
            
            return null;
        } catch (error) {
            console.error('Erro ao obter progresso:', error);
            return null;
        }
    },
    
    // Verificar se todas as aulas de um subtítulo foram completadas
    async checkAllLessonsCompleted(subtitle, allLessonTitles) {
        try {
            const progress = await this.getProgress(subtitle);
            
            if (!progress || !progress.completedVideos) {
                return false;
            }
            
            // Verificar se todas as aulas estão marcadas como true
            const allCompleted = allLessonTitles.every(lessonTitle => 
                progress.completedVideos[lessonTitle] === true
            );
            
            return allCompleted;
        } catch (error) {
            console.error('Erro ao verificar conclusão:', error);
            return false;
        }
    },
    
    // Desbloquear quiz após conclusão de todas as aulas
    async unlockQuiz(subtitle) {
        try {
            const userEmail = this.getUserEmail();
            if (!userEmail) {
                return { success: false, error: 'Usuário não autenticado' };
            }
            
            const response = await fetch(`${this.apiBaseUrl}/progress/unlock-quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userEmail,
                    subtitle
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Atualizar cache
                const cacheKey = `${userEmail}_${subtitle}`;
                if (this.progressCache[cacheKey]) {
                    this.progressCache[cacheKey].quizUnlocked = true;
                }
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao desbloquear quiz:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Carregar todo o progresso do usuário
    async loadUserProgress() {
        try {
            const userEmail = this.getUserEmail();
            if (!userEmail) {
                return {};
            }
            
            const response = await fetch(
                `${this.apiBaseUrl}/progress/user/${encodeURIComponent(userEmail)}`
            );
            
            const result = await response.json();
            
            if (result.success && result.progress) {
                // Popular cache
                result.progress.forEach(p => {
                    const cacheKey = `${userEmail}_${p.subtitle}`;
                    this.progressCache[cacheKey] = p;
                });
                
                return result.progress;
            }
            
            return {};
        } catch (error) {
            console.error('Erro ao carregar progresso do usuário:', error);
            return {};
        }
    },
    
    // Verificar se quiz está desbloqueado
    async isQuizUnlocked(subtitle) {
        try {
            const progress = await this.getProgress(subtitle);
            return progress && progress.quizUnlocked === true;
        } catch (error) {
            console.error('Erro ao verificar status do quiz:', error);
            return false;
        }
    },
    
    // Limpar cache
    clearCache() {
        this.progressCache = {};
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.ProgressTracker = ProgressTracker;
}

