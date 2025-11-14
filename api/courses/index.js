// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/courses - Listar todos os cursos ativos

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
        const db = await getDatabase();

        if (!db) {
            return res.status(503).json({
                success: false,
                error: 'MongoDB não disponível. Verifique a variável de ambiente MONGODB_URI no Vercel.'
            });
        }

        const collection = db.collection('cursos_conteudo');

        // Buscar cursos ativos, ordenados por courseOrder
        const courses = await collection.find({ isActive: true })
            .sort({ courseOrder: 1 })
            .toArray();

        // Filtrar conteúdo ativo recursivamente
        const filteredCourses = courses.map(course => {
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

            return {
                ...course,
                modules: filteredModules
            };
        });

        return res.status(200).json({
            success: true,
            courses: filteredCourses
        });

    } catch (error) {
        console.error('Erro ao listar cursos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar cursos',
            details: error.message
        });
    }
};

