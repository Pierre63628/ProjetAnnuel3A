// Script de migration pour ajouter le champ editionId aux articles existants
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/journal?authSource=admin&authMechanism=SCRAM-SHA-1';
const MONGODB_DB = process.env.MONGODB_DB || 'journal';

async function migrateArticlesToEditions() {
    let client;
    
    try {
        console.log('=== MIGRATION ARTICLES VERS ÉDITIONS ===');
        
        // Connexion à MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(MONGODB_DB);
        const articlesCollection = db.collection('articles');
        
        // 1. Vérifier les articles existants
        const allArticles = await articlesCollection.find({}).toArray();
        console.log('📄 Articles existants:', allArticles.length);
        
        // 2. Identifier les articles qui n'ont pas encore editionId
        const articlesWithoutEditionId = allArticles.filter(article => 
            !article.hasOwnProperty('editionId')
        );
        
        console.log('📄 Articles sans editionId:', articlesWithoutEditionId.length);
        
        if (articlesWithoutEditionId.length === 0) {
            console.log('✅ Tous les articles ont déjà le champ editionId');
            return;
        }
        
        // 3. Ajouter le champ editionId à tous les articles qui n'en ont pas
        const updatePromises = articlesWithoutEditionId.map(article => 
            articlesCollection.updateOne(
                { _id: article._id },
                { 
                    $set: { 
                        editionId: null,
                        updatedAt: new Date()
                    } 
                }
            )
        );
        
        const updateResults = await Promise.all(updatePromises);
        const updatedCount = updateResults.reduce((sum, result) => sum + result.modifiedCount, 0);
        
        console.log('✅ Articles mis à jour avec editionId:', updatedCount);
        
        // 4. Vérifier le résultat
        const updatedArticles = await articlesCollection.find({}).toArray();
        const articlesWithEditionId = updatedArticles.filter(article => 
            article.hasOwnProperty('editionId')
        );
        
        console.log('📄 Articles avec editionId après migration:', articlesWithEditionId.length);
        
        // 5. Afficher quelques exemples
        console.log('📋 Exemples d\'articles après migration:');
        updatedArticles.slice(0, 3).forEach((article, index) => {
            console.log(`${index + 1}. "${article.title}" - editionId: ${article.editionId || 'null'}`);
        });
        
        // 6. Créer l'index editionId s'il n'existe pas
        const indexes = await articlesCollection.indexes();
        const editionIdIndexExists = indexes.some(index => 
            index.name === 'editionId_1'
        );
        
        if (!editionIdIndexExists) {
            await articlesCollection.createIndex({ "editionId": 1 });
            console.log('✅ Index editionId créé');
        } else {
            console.log('✅ Index editionId existe déjà');
        }
        
        console.log('=== MIGRATION TERMINÉE AVEC SUCCÈS ===');
        
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connexion MongoDB fermée');
        }
    }
}

// Exécuter la migration
migrateArticlesToEditions(); 