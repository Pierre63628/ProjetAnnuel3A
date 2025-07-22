// Script de test pour la création d'éditions et l'association avec les articles
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/journal?authSource=admin&authMechanism=SCRAM-SHA-1';
const MONGODB_DB = process.env.MONGODB_DB || 'journal';

async function testEditionCreation() {
    let client;
    
    try {
        console.log('=== TEST CRÉATION ÉDITIONS ===');
        
        // Connexion à MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(MONGODB_DB);
        
        // 1. Créer quelques éditions de test
        const editionsCollection = db.collection('editions');
        
        const testEditions = [
            {
                uuid: generateUUID(),
                title: "Édition Test 1",
                description: "Première édition de test",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                uuid: generateUUID(),
                title: "Édition Test 2", 
                description: "Deuxième édition de test",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        const editionResults = await editionsCollection.insertMany(testEditions);
        console.log('✅ Éditions créées:', editionResults.insertedIds);
        
        // 2. Récupérer les UUIDs des éditions créées
        const createdEditions = await editionsCollection.find({}).toArray();
        console.log('📰 Éditions dans la base:', createdEditions.map(e => ({ uuid: e.uuid, title: e.title })));
        
        // 3. Associer des articles existants à une édition
        const articlesCollection = db.collection('articles');
        
        // Récupérer quelques articles existants
        const existingArticles = await articlesCollection.find({}).limit(2).toArray();
        console.log('📄 Articles existants trouvés:', existingArticles.length);
        
        if (existingArticles.length > 0 && createdEditions.length > 0) {
            // Associer le premier article à la première édition
            const updateResult1 = await articlesCollection.updateOne(
                { _id: existingArticles[0]._id },
                { $set: { editionId: createdEditions[0].uuid, updatedAt: new Date() } }
            );
            console.log('✅ Premier article associé à l\'édition:', updateResult1.modifiedCount);
            
            // Associer le deuxième article à la deuxième édition
            if (existingArticles.length > 1 && createdEditions.length > 1) {
                const updateResult2 = await articlesCollection.updateOne(
                    { _id: existingArticles[1]._id },
                    { $set: { editionId: createdEditions[1].uuid, updatedAt: new Date() } }
                );
                console.log('✅ Deuxième article associé à l\'édition:', updateResult2.modifiedCount);
            }
        }
        
        // 4. Vérifier les associations
        const articlesWithEditions = await articlesCollection.find({ editionId: { $exists: true, $ne: null } }).toArray();
        console.log('📋 Articles avec édition:', articlesWithEditions.map(a => ({ 
            title: a.title, 
            editionId: a.editionId 
        })));
        
        // 5. Récupérer les articles d'une édition spécifique
        if (createdEditions.length > 0) {
            const editionArticles = await articlesCollection.find({ 
                editionId: createdEditions[0].uuid 
            }).toArray();
            console.log(`📰 Articles de l'édition "${createdEditions[0].title}":`, editionArticles.length);
        }
        
        // 6. Vérifier les articles sans édition
        const articlesWithoutEdition = await articlesCollection.find({ 
            $or: [
                { editionId: { $exists: false } },
                { editionId: null },
                { editionId: undefined }
            ]
        }).toArray();
        console.log('📄 Articles sans édition:', articlesWithoutEdition.length);
        
        console.log('=== TEST TERMINÉ AVEC SUCCÈS ===');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connexion MongoDB fermée');
        }
    }
}

// Fonction pour générer un UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Exécuter le test
testEditionCreation(); 