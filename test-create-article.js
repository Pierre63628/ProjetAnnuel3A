const { MongoClient } = require('mongodb');
const { Pool } = require('pg');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'journal';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nextdoorbuddy',
    user: 'postgres',
    password: 'postgres'
});

async function testCreateArticle() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        console.log('=== TEST CRÉATION ARTICLE ===');
        
        // 1. Test connexion MongoDB
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('articles');
        
        // 2. Test connexion PostgreSQL
        const pgResult = await pool.query('SELECT 1');
        console.log('✅ Connecté à PostgreSQL');
        
        // 3. Vérifier les utilisateurs
        const usersResult = await pool.query('SELECT id, prenom, nom, email, quartier_id FROM utilisateurs LIMIT 5');
        console.log('👥 Utilisateurs disponibles:');
        usersResult.rows.forEach(user => {
            console.log(`  - ID: ${user.id}, Nom: ${user.prenom} ${user.nom}, Quartier: ${user.quartier_id}`);
        });
        
        // 4. Vérifier les quartiers
        const quartiersResult = await pool.query('SELECT id, nom FROM quartiers ORDER BY id');
        console.log('🏘️  Quartiers disponibles:');
        quartiersResult.rows.forEach(quartier => {
            console.log(`  - ID: ${quartier.id}, Nom: ${quartier.nom}`);
        });
        
        // 5. Test création article
        if (usersResult.rows.length > 0 && quartiersResult.rows.length > 0) {
            const user = usersResult.rows[0];
            const quartier = quartiersResult.rows[0];
            
            const articleData = {
                title: 'Test article',
                content: 'Contenu de test',
                authorId: user.id,
                authorName: `${user.prenom} ${user.nom}`,
                date: new Date(),
                quartierId: quartier.id,
                quartierName: quartier.nom,
                category: 'Actualités'
            };
            
            console.log('📝 Tentative de création d\'article avec:', articleData);
            
            const result = await collection.insertOne(articleData);
            console.log('✅ Article créé avec succès, ID:', result.insertedId);
            
            // Vérifier l'article créé
            const createdArticle = await collection.findOne({ _id: result.insertedId });
            console.log('📄 Article créé:', createdArticle);
            
            // Nettoyer
            await collection.deleteOne({ _id: result.insertedId });
            console.log('🗑️  Article de test supprimé');
        } else {
            console.log('❌ Pas d\'utilisateurs ou de quartiers disponibles');
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await client.close();
        await pool.end();
    }
}

testCreateArticle(); 