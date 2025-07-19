const { MongoClient } = require('mongodb');

async function testMongoDB() {
    const uri = 'mongodb://localhost:27017/journal';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');

        const db = client.db('journal');
        const collection = db.collection('articles');

        // Compter tous les articles
        const totalArticles = await collection.countDocuments();
        console.log(`📊 Total d'articles: ${totalArticles}`);

        // Compter les articles par statut
        const statusStats = await collection.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('📈 Articles par statut:');
        statusStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count}`);
        });

        // Afficher quelques articles validés
        const validatedArticles = await collection.find({ status: 'valide' }).limit(3).toArray();
        console.log(`\n📝 Articles validés (${validatedArticles.length} trouvés):`);
        validatedArticles.forEach((article, index) => {
            console.log(`\nArticle ${index + 1}:`);
            console.log(`  - ID: ${article._id}`);
            console.log(`  - Titre: ${article.title}`);
            console.log(`  - Auteur: ${article.author?.name || 'N/A'}`);
            console.log(`  - Quartier: ${article.quartier?.name || 'N/A'}`);
            console.log(`  - Date: ${article.date}`);
            console.log(`  - Statut: ${article.status}`);
        });

        // Afficher la structure d'un article
        if (validatedArticles.length > 0) {
            console.log('\n🔍 Structure d\'un article:');
            console.log(JSON.stringify(validatedArticles[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await client.close();
        console.log('🔌 Connexion fermée');
    }
}

testMongoDB(); 