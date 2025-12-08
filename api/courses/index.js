// VERSION: v2.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/courses - Listar todos os cursos ativos
// Suporta estrutura normalizada (4 coleções) com fallback para estrutura antiga

const { getDatabase } = require('../../lib/mongodb');

// Função para buscar cursos usando estrutura normalizada (agregação)
async function getCoursesNormalized(db) {
    const cursosCollection = db.collection('cursos');
    
    const pipeline = [
        // 1. Buscar apenas cursos ativos
        {
            $match: { isActive: true }
        },
        // 2. Ordenar por courseOrder
        {
            $sort: { courseOrder: 1 }
        },
        // 3. Lookup módulos ativos
        {
            $lookup: {
                from: 'modulos',
                let: { cursoId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$cursoId', '$$cursoId'] },
                                    { $eq: ['$isActive', true] }
                                ]
                            }
                        }
                    },
                    { $sort: { moduleOrder: 1 } },
                    // 4. Lookup seções ativas dentro de cada módulo
                    {
                        $lookup: {
                            from: 'secoes',
                            let: { moduloId: '$_id' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $eq: ['$moduloId', '$$moduloId'] },
                                                { $eq: ['$isActive', true] }
                                            ]
                                        }
                                    }
                                },
                                { $sort: { temaOrder: 1 } },
                                // 5. Lookup aulas ativas dentro de cada seção
                                {
                                    $lookup: {
                                        from: 'aulas',
                                        let: { secaoId: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $and: [
                                                            { $eq: ['$secaoId', '$$secaoId'] },
                                                            { $eq: ['$isActive', true] }
                                                        ]
                                                    }
                                                }
                                            },
                                            { $sort: { lessonOrdem: 1 } }
                                        ],
                                        as: 'lessons'
                                    }
                                }
                            ],
                            as: 'sections'
                        }
                    }
                ],
                as: 'modules'
            }
        },
        // 6. Remover campos internos do MongoDB
        {
            $project: {
                _id: 1,
                cursoClasse: 1,
                cursoNome: 1,
                cursoDescription: 1,
                courseOrder: 1,
                isActive: 1,
                createdAt: 1,
                updatedAt: 1,
                createdBy: 1,
                version: 1,
                modules: {
                    $map: {
                        input: '$modules',
                        as: 'modulo',
                        in: {
                            moduleId: '$$modulo.moduleId',
                            moduleNome: '$$modulo.moduleNome',
                            moduleOrder: '$$modulo.moduleOrder',
                            isActive: '$$modulo.isActive',
                            sections: {
                                $map: {
                                    input: '$$modulo.sections',
                                    as: 'secao',
                                    in: {
                                        temaNome: '$$secao.temaNome',
                                        temaOrder: '$$secao.temaOrder',
                                        isActive: '$$secao.isActive',
                                        hasQuiz: '$$secao.hasQuiz',
                                        quizId: '$$secao.quizId',
                                        lessons: '$$secao.lessons'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ];
    
    return await cursosCollection.aggregate(pipeline).toArray();
}

// Função para buscar cursos usando estrutura antiga (fallback)
async function getCoursesLegacy(db) {
    const collection = db.collection('cursos_conteudo');
    
    const courses = await collection.find({ isActive: true })
        .sort({ courseOrder: 1 })
        .toArray();
    
    // Filtrar conteúdo ativo recursivamente
    return courses.map(course => {
        const filteredModules = (course.modules || [])
            .filter(m => m.isActive)
            .sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0))
            .map(module => {
                const filteredSections = (module.sections || [])
                    .filter(s => s.isActive)
                    .map(section => {
                        const filteredLessons = (section.lessons || [])
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
}

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

        let courses = [];
        let structureUsed = 'unknown';
        
        // Tentar estrutura normalizada primeiro
        try {
            const normalizedCourses = await getCoursesNormalized(db);
            if (normalizedCourses && normalizedCourses.length > 0) {
                courses = normalizedCourses;
                structureUsed = 'normalized';
                console.log(`✅ Usando estrutura normalizada: ${courses.length} cursos encontrados`);
            }
        } catch (normalizedError) {
            console.warn('⚠️  Erro ao buscar estrutura normalizada, tentando estrutura antiga:', normalizedError.message);
        }
        
        // Fallback para estrutura antiga se normalizada não retornou resultados
        if (courses.length === 0) {
            try {
                courses = await getCoursesLegacy(db);
                structureUsed = 'legacy';
                console.log(`✅ Usando estrutura antiga (fallback): ${courses.length} cursos encontrados`);
            } catch (legacyError) {
                console.error('❌ Erro ao buscar estrutura antiga:', legacyError.message);
                throw legacyError;
            }
        }

        return res.status(200).json({
            success: true,
            courses: courses,
            structure: structureUsed // Informação para debug (pode ser removida em produção)
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

