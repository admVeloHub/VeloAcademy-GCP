// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/courses/:cursoNome - Obter curso específico

const { getDatabase } = require('../../lib/mongodb');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Apenas GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Método não permitido'
        });
    }

    try {
        // Vercel passa parâmetros dinâmicos via req.query
        // Tentar pegar de req.query primeiro, depois da URL como fallback
        let cursoNome = req.query.cursoNome || '';
        
        // Fallback: extrair da URL se não vier em req.query
        if (!cursoNome) {
            const urlMatch = req.url.match(/\/courses\/([^\/]+)/);
            if (urlMatch) {
                cursoNome = urlMatch[1];
            }
        }
        
        cursoNome = decodeURIComponent(cursoNome);

        if (!cursoNome) {
            return res.status(400).json({
                success: false,
                error: 'Parâmetro cursoNome é obrigatório'
            });
        }

        const db = await getDatabase();

        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.'
            });
        }

        const collection = db.collection('cursos_conteudo');

        const course = await collection.findOne({
            cursoNome: cursoNome,
            isActive: true
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                error: 'Curso não encontrado'
            });
        }

        // Filtrar conteúdo ativo recursivamente
        const filteredModules = course.modules
            .filter(m => m.isActive)
            .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
            .map(module => {
                const filteredSections = module.sections
                    .filter(s => s.isActive)
                    .map(section => {
                        const filteredLessons = section.lessons
                            .filter(l => l.isActive)
                            .sort((a, b) => (a.lessonOrdem || 0) - (b.lessonOrdem || 0));

                        return {
                            ...section,
                            lessons: filteredLessons
                        };
                    })
                    .sort((a, b) => (a.temaOrder || 0) - (b.temaOrder || 0));

                return {
                    ...module,
                    sections: filteredSections
                };
            });

        return res.status(200).json({
            success: true,
            course: {
                ...course,
                modules: filteredModules
            }
        });

    } catch (error) {
        console.error('Erro ao obter curso:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao obter curso',
            details: error.message
        });
    }
};

