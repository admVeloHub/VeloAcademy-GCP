// VERSION: v1.0.0 | DATE: 2025-01-30 | AUTHOR: VeloHub Development Team
// GET /api/health - Health check

const { getDatabase, MONGODB_URI } = require('../lib/mongodb');

module.exports = async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Tratar preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const db = await getDatabase();

        return res.status(200).json({
            status: 'ok',
            mongodb: db ? 'connected' : 'disconnected',
            mongodb_uri_configured: !!MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(200).json({
            status: 'error',
            mongodb: 'disconnected',
            mongodb_uri_configured: !!MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

