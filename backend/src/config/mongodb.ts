import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/journal?authSource=admin&authMechanism=SCRAM-SHA-1';
const MONGODB_DB = process.env.MONGODB_DB || 'journal';

let client: MongoClient;
let db: Db;

export const connectToMongoDB = async (): Promise<Db> => {
    try {
        console.log('=== CONNEXION MONGODB ===');
        console.log('URI:', MONGODB_URI);
        console.log('Base de données:', MONGODB_DB);
        
        // Forcer une nouvelle connexion à chaque fois
        if (client) {
            console.log('Fermeture de la connexion existante...');
            await client.close();
            client = null;
            db = null;
        }
        
        console.log('Création d\'une nouvelle connexion MongoDB...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connecté à MongoDB avec succès');
        
        db = client.db(MONGODB_DB);
        console.log('Base de données sélectionnée:', db.databaseName);
        console.log('==========================');
        return db;
    } catch (error) {
        console.error('❌ Erreur de connexion à MongoDB:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    }
};

export const getMongoDB = (): Db => {
    if (!db) {
        throw new Error('MongoDB n\'est pas connecté. Appelez connectToMongoDB() d\'abord.');
    }
    return db;
};

export const closeMongoDB = async (): Promise<void> => {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('🔌 Connexion MongoDB fermée');
    }
};

export const reconnectMongoDB = async (): Promise<Db> => {
    await closeMongoDB();
    return await connectToMongoDB();
};

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
    await closeMongoDB();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeMongoDB();
    process.exit(0);
}); 