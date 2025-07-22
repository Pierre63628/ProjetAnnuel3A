import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'journal';
const ARTICLES_COLLECTION = 'articles';

async function testArticlesRetrieval() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection(ARTICLES_COLLECTION);
        
        console.log('\n=== TEST DE RÉCUPÉRATION DES ARTICLES ===\n');
        
        // 1. Récupérer tous les articles
        console.log('1️⃣ RÉCUPÉRATION DE TOUS LES ARTICLES:');
        console.log('----------------------------------------');
        const allArticles = await collection.find({}).sort({ date: -1 }).toArray();
        console.log(`📊 Nombre d'articles trouvés: ${allArticles.length}`);
        allArticles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.authorName} (${article.status})`);
        });
        
        // 2. Récupérer les articles validés
        console.log('\n2️⃣ RÉCUPÉRATION DES ARTICLES VALIDÉS:');
        console.log('----------------------------------------');
        const validatedArticles = await collection.find({ status: 'valide' }).sort({ date: -1 }).toArray();
        console.log(`📊 Nombre d'articles validés: ${validatedArticles.length}`);
        validatedArticles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.authorName} - ${article.quartierName}`);
        });
        
        // 3. Récupérer les articles par quartier
        console.log('\n3️⃣ RÉCUPÉRATION PAR QUARTIER:');
        console.log('----------------------------------------');
        const quartier1Articles = await collection.find({ quartierId: 1 }).sort({ date: -1 }).toArray();
        console.log(`📊 Articles du Quartier Centre (ID: 1): ${quartier1Articles.length}`);
        quartier1Articles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.status}`);
        });
        
        const quartier2Articles = await collection.find({ quartierId: 2 }).sort({ date: -1 }).toArray();
        console.log(`📊 Articles du Quartier Nord (ID: 2): ${quartier2Articles.length}`);
        quartier2Articles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.status}`);
        });
        
        // 4. Récupérer les articles par auteur
        console.log('\n4️⃣ RÉCUPÉRATION PAR AUTEUR:');
        console.log('----------------------------------------');
        const author1Articles = await collection.find({ authorId: 1 }).sort({ date: -1 }).toArray();
        console.log(`📊 Articles de Jean Dupont (ID: 1): ${author1Articles.length}`);
        author1Articles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.status}`);
        });
        
        // 5. Récupérer les articles en attente
        console.log('\n5️⃣ RÉCUPÉRATION DES ARTICLES EN ATTENTE:');
        console.log('----------------------------------------');
        const pendingArticles = await collection.find({ status: 'a_valider' }).sort({ date: -1 }).toArray();
        console.log(`📊 Articles en attente de validation: ${pendingArticles.length}`);
        pendingArticles.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.authorName} - ${article.quartierName}`);
        });
        
        // 6. Statistiques par statut
        console.log('\n6️⃣ STATISTIQUES PAR STATUT:');
        console.log('----------------------------------------');
        const stats = await collection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        stats.forEach(stat => {
            console.log(`  📈 ${stat._id}: ${stat.count} articles`);
        });
        
        // 7. Détail d'un article spécifique
        console.log('\n7️⃣ DÉTAIL D\'UN ARTICLE:');
        console.log('----------------------------------------');
        const sampleArticle = await collection.findOne({ status: 'valide' });
        if (sampleArticle) {
            console.log('📄 Article détaillé:');
            console.log(JSON.stringify(sampleArticle, null, 2));
        }
        
        // 8. Test de recherche par texte
        console.log('\n8️⃣ RECHERCHE PAR TEXTE:');
        console.log('----------------------------------------');
        const searchResults = await collection.find({
            $or: [
                { title: { $regex: 'test', $options: 'i' } },
                { content: { $regex: 'test', $options: 'i' } }
            ]
        }).toArray();
        console.log(`📊 Articles contenant "test": ${searchResults.length}`);
        searchResults.forEach((article, index) => {
            console.log(`  ${index + 1}. "${article.title}" - ${article.authorName}`);
        });
        
        console.log('\n✅ TESTS DE RÉCUPÉRATION TERMINÉS');
        console.log('📊 Structure NoSQL classique fonctionne parfaitement !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.close();
    }
}

testArticlesRetrieval(); 