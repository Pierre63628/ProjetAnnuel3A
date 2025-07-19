// Script de test pour vérifier les articles validés sans journal
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/journal?authSource=admin&authMechanism=SCRAM-SHA-1';
const MONGODB_DB = process.env.MONGODB_DB || 'journal';

async function testArticlesWithoutJournal() {
    let client;
    
    try {
        console.log('=== TEST ARTICLES VALIDÉS SANS JOURNAL ===');
        
        // Connexion à MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(MONGODB_DB);
        
        // 1. Vérifier les articles validés
        const articlesCollection = db.collection('articles');
        
        const allValidatedArticles = await articlesCollection.find({ 
            status: 'valide' 
        }).toArray();
        
        console.log('📄 Articles validés totaux:', allValidatedArticles.length);
        
        // 2. Filtrer les articles sans journalId
        const articlesWithoutJournal = allValidatedArticles.filter(article => 
            !article.journalId || article.journalId === null || article.journalId === undefined
        );
        
        console.log('📄 Articles validés sans journal:', articlesWithoutJournal.length);
        
        // 3. Afficher les détails des articles sans journal
        if (articlesWithoutJournal.length > 0) {
            console.log('📋 Détails des articles sans journal:');
            articlesWithoutJournal.forEach((article, index) => {
                console.log(`${index + 1}. "${article.title}" par ${article.authorName} (${article.category})`);
                console.log(`   Date: ${new Date(article.date).toLocaleDateString('fr-FR')}`);
                console.log(`   journalId: ${article.journalId || 'null'}`);
                console.log('   ---');
            });
        } else {
            console.log('❌ Aucun article validé sans journal trouvé');
        }
        
        // 4. Vérifier les articles avec journalId
        const articlesWithJournal = allValidatedArticles.filter(article => 
            article.journalId && article.journalId !== null && article.journalId !== undefined
        );
        
        console.log('📄 Articles validés avec journal:', articlesWithJournal.length);
        
        if (articlesWithJournal.length > 0) {
            console.log('📋 Détails des articles avec journal:');
            articlesWithJournal.forEach((article, index) => {
                console.log(`${index + 1}. "${article.title}" par ${article.authorName} (${article.category})`);
                console.log(`   Date: ${new Date(article.date).toLocaleDateString('fr-FR')}`);
                console.log(`   journalId: ${article.journalId}`);
                console.log('   ---');
            });
        }
        
        // 5. Statistiques générales
        console.log('\n📊 Statistiques:');
        console.log(`- Total articles validés: ${allValidatedArticles.length}`);
        console.log(`- Articles sans journal: ${articlesWithoutJournal.length}`);
        console.log(`- Articles avec journal: ${articlesWithJournal.length}`);
        console.log(`- Pourcentage sans journal: ${((articlesWithoutJournal.length / allValidatedArticles.length) * 100).toFixed(1)}%`);
        
        console.log('\n=== TEST TERMINÉ AVEC SUCCÈS ===');
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        if (client) {
            await client.close();
            console.log('🔌 Connexion MongoDB fermée');
        }
    }
}

// Exécuter le test
testArticlesWithoutJournal(); 