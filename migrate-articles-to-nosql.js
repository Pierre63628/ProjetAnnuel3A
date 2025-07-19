const { MongoClient } = require('mongodb');
const { Pool } = require('pg');

async function migrateArticlesToNoSQL() {
    const mongoUri = 'mongodb://localhost:27017/journal';
    const mongoClient = new MongoClient(mongoUri);
    
    const pgPool = new Pool({
        host: 'localhost',
        port: 5432,
        user: 'user',
        password: 'rootpass',
        database: 'nextdoorbuddy'
    });

    try {
        // Connexion MongoDB
        await mongoClient.connect();
        console.log('✅ Connecté à MongoDB');
        
        // Connexion PostgreSQL
        const pgClient = await pgPool.connect();
        console.log('✅ Connecté à PostgreSQL');

        const db = mongoClient.db('journal');
        const collection = db.collection('articles');

        // Récupérer tous les articles avec l'ancienne structure
        const oldArticles = await collection.find({}).toArray();
        console.log(`📊 Articles à migrer: ${oldArticles.length}`);

        if (oldArticles.length === 0) {
            console.log('✅ Aucun article à migrer');
            return;
        }

        let migratedCount = 0;
        let errorCount = 0;

        for (const oldArticle of oldArticles) {
            try {
                console.log(`\n🔄 Migration de l'article: ${oldArticle.title}`);

                // Récupérer les informations utilisateur depuis PostgreSQL
                const userResult = await pgClient.query(
                    'SELECT id, prenom, nom, email FROM utilisateurs WHERE id = $1',
                    [oldArticle.authorId]
                );

                if (userResult.rows.length === 0) {
                    console.log(`⚠️ Utilisateur non trouvé pour l'article ${oldArticle.title}`);
                    continue;
                }

                const user = userResult.rows[0];

                // Récupérer les informations du quartier depuis PostgreSQL
                const quartierResult = await pgClient.query(
                    'SELECT id, nom FROM quartiers WHERE id = $1',
                    [oldArticle.quartier_id]
                );

                if (quartierResult.rows.length === 0) {
                    console.log(`⚠️ Quartier non trouvé pour l'article ${oldArticle.title}`);
                    continue;
                }

                const quartier = quartierResult.rows[0];

                // Créer la nouvelle structure NoSQL
                const newArticle = {
                    title: oldArticle.title,
                    content: oldArticle.content,
                    author: {
                        _id: user.id,
                        name: `${user.prenom} ${user.nom}`,
                        email: user.email
                    },
                    date: oldArticle.date,
                    category: oldArticle.category,
                    tags: oldArticle.tags || [],
                    status: oldArticle.status,
                    quartier: {
                        _id: quartier.id,
                        name: quartier.nom
                    },
                    metadata: {
                        createdAt: oldArticle.createdAt || oldArticle.date,
                        updatedAt: oldArticle.updatedAt || oldArticle.date
                    }
                };

                // Ajouter les informations de validation si elles existent
                if (oldArticle.validatedAt || oldArticle.validatedBy || oldArticle.validationComment) {
                    // Récupérer les informations de l'admin qui a validé
                    if (oldArticle.validatedBy) {
                        const adminResult = await pgClient.query(
                            'SELECT id, prenom, nom FROM utilisateurs WHERE id = $1',
                            [oldArticle.validatedBy]
                        );

                        if (adminResult.rows.length > 0) {
                            const admin = adminResult.rows[0];
                            newArticle.validation = {
                                validatedAt: oldArticle.validatedAt,
                                validatedBy: {
                                    _id: admin.id,
                                    name: `${admin.prenom} ${admin.nom}`
                                },
                                comment: oldArticle.validationComment
                            };
                        }
                    }
                }

                // Mettre à jour l'article dans MongoDB
                await collection.updateOne(
                    { _id: oldArticle._id },
                    { $set: newArticle }
                );

                console.log(`✅ Article migré: ${oldArticle.title}`);
                migratedCount++;

            } catch (error) {
                console.error(`❌ Erreur lors de la migration de l'article ${oldArticle.title}:`, error);
                errorCount++;
            }
        }

        console.log(`\n📊 Résumé de la migration:`);
        console.log(`✅ Articles migrés avec succès: ${migratedCount}`);
        console.log(`❌ Erreurs: ${errorCount}`);
        console.log(`📝 Total traité: ${oldArticles.length}`);

        // Vérifier le résultat
        const newArticles = await collection.find({}).toArray();
        console.log(`\n🔍 Vérification - Articles après migration: ${newArticles.length}`);

        if (newArticles.length > 0) {
            console.log('\n📝 Exemple d\'article migré:');
            console.log(JSON.stringify(newArticles[0], null, 2));
        }

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    } finally {
        await mongoClient.close();
        await pgPool.end();
        console.log('🔌 Connexions fermées');
    }
}

migrateArticlesToNoSQL(); 