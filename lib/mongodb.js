// VERSION: v1.0.4 | DATE: 2026-04-23 | AUTHOR: VeloHub Development Team
// Módulo compartilhado para conexão MongoDB (serverless functions; textos em pt-BR).

const path = require('path');
const { loadFrom: loadFonteEnv } = require('./load-fonte-env.cjs');
loadFonteEnv(path.join(__dirname, '..'));

const { MongoClient } = require('mongodb');

// String de conexão: apenas MONGO_ENV (FONTE DA VERDADE / ecossistema VeloHub)
const MONGODB_URI = (process.env.MONGO_ENV || '').trim() || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME_ACADEMY || 'academy_registros';

let cachedClient = null;
let cachedDb = null;

// Conectar ao MongoDB (com cache para serverless)
async function connectToDatabase() {
    try {
        // Se já temos conexão em cache, reutilizar
        if (cachedClient && cachedDb) {
            return { client: cachedClient, db: cachedDb };
        }

        if (!MONGODB_URI || MONGODB_URI === 'mongodb://localhost:27017') {
            console.warn('⚠️ MONGO_ENV não configurada.');
            return { client: null, db: null };
        }

        const client = new MongoClient(MONGODB_URI, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        await client.connect();
        const db = client.db(DB_NAME);

        // Cachear conexão
        cachedClient = client;
        cachedDb = db;

        console.log('✅ Conectado ao MongoDB:', DB_NAME);
        return { client, db };
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        return { client: null, db: null };
    }
}

// Obter database (para compatibilidade)
async function getDatabase() {
    const { db } = await connectToDatabase();
    return db;
}

module.exports = {
    connectToDatabase,
    getDatabase,
    DB_NAME,
    MONGODB_URI
};

