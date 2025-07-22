// Script de test pour la création de journaux et l'association avec les articles
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/journal?authSource=admin&authMechanism=SCRAM-SHA-1';
const MONGODB_DB = process.env.MONGODB_DB || 'journal';

async function testJournalCreation() {
    let client;
    
    try {
        console.log('=== TEST CRÉATION JOURNAUX ===');
        
        // Connexion à MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(MONGODB_DB);
        
        // 1. Créer quelques journaux de test
        const journalsCollection = db.collection('journals');
        
        const testJournals = [
            {
                uuid: generateUUID(),
                title: "Journal Test 1",
                description: "Premier journal de test",
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                uuid: generateUUID(),
                title: "Journal Test 2", 
                description: "Deuxième journal de test",
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        
        const journalResults = await journalsCollection.insertMany(testJournals);
        console.log('✅ Journaux créés:', journalResults.insertedIds);
        
        // 2. Récupérer les UUIDs des journaux créés
        const createdJournals = await journalsCollection.find({}).toArray();
        console.log('📰 Journaux dans la base:', createdJournals.map(j => ({ uuid: j.uuid, title: j.title })));
        
        // 3. Associer des articles existants à un journal
        const articlesCollection = db.collection('articles');
        
        // Récupérer quelques articles existants
        const existingArticles = await articlesCollection.find({}).limit(2).toArray();
        console.log('📄 Articles existants trouvés:', existingArticles.length);
        
        if (existingArticles.length > 0 && createdJournals.length > 0) {
            // Associer le premier article au premier journal
            const updateResult1 = await articlesCollection.updateOne(
                { _id: existingArticles[0]._id },
                { $set: { journalId: createdJournals[0].uuid, updatedAt: new Date() } }
            );
            console.log('✅ Premier article associé au journal:', updateResult1.modifiedCount);
            
            // Associer le deuxième article au deuxième journal
            if (existingArticles.length > 1 && createdJournals.length > 1) {
                const updateResult2 = await articlesCollection.updateOne(
                    { _id: existingArticles[1]._id },
                    { $set: { journalId: createdJournals[1].uuid, updatedAt: new Date() } }
                );
                console.log('✅ Deuxième article associé au journal:', updateResult2.modifiedCount);
            }
        }
        
        // 4. Vérifier les associations
        const articlesWithJournals = await articlesCollection.find({ journalId: { $exists: true, $ne: null } }).toArray();
        console.log('📋 Articles avec journal:', articlesWithJournals.map(a => ({ 
            title: a.title, 
            journalId: a.journalId 
        })));
        
        // 5. Récupérer les articles d'un journal spécifique
        if (createdJournals.length > 0) {
            const journalArticles = await articlesCollection.find({ 
                journalId: createdJournals[0].uuid 
            }).toArray();
            console.log(`📰 Articles du journal "${createdJournals[0].title}":`, journalArticles.length);
        }
        
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
testJournalCreation(); 