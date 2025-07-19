import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'journal';
const ARTICLES_COLLECTION = 'articles';
const EDITIONS_COLLECTION = 'editions';

async function initMongoDBCollections() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(DB_NAME);
        
        // === COLLECTION ARTICLES ===
        const articlesCollection = db.collection(ARTICLES_COLLECTION);
        await articlesCollection.deleteMany({});
        console.log('🗑️  Collection articles vidée');
        
        const testArticles = [
            {
                title: 'Premier article de test',
                content: 'Ceci est le contenu du premier article de test avec une structure NoSQL simplifiée.',
                authorId: 1,
                authorName: 'Jean Dupont',
                date: new Date('2024-01-15'),
                status: 'valide',
                quartierId: 1,
                quartierName: 'Quartier Centre',
                category: 'Actualités',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date('2024-01-16')
            },
            {
                title: 'Deuxième article de test',
                content: 'Contenu du deuxième article avec des informations sur le quartier.',
                authorId: 2,
                authorName: 'Marie Martin',
                date: new Date('2024-01-20'),
                status: 'valide',
                quartierId: 1,
                quartierName: 'Quartier Centre',
                category: 'Événements',
                createdAt: new Date('2024-01-20'),
                updatedAt: new Date('2024-01-21')
            },
            {
                title: 'Article en attente de validation',
                content: 'Cet article est en attente de validation par un administrateur.',
                authorId: 3,
                authorName: 'Pierre Durand',
                date: new Date('2024-01-25'),
                status: 'a_valider',
                quartierId: 2,
                quartierName: 'Quartier Nord',
                category: 'Améliorations',
                createdAt: new Date('2024-01-25'),
                updatedAt: new Date('2024-01-25')
            }
        ];
        
        console.log('📝 Insertion des articles de test...');
        const articlesResult = await articlesCollection.insertMany(testArticles);
        console.log(`✅ ${articlesResult.insertedCount} articles insérés avec succès`);
        
        // === COLLECTION EDITIONS ===
        const editionsCollection = db.collection(EDITIONS_COLLECTION);
        await editionsCollection.deleteMany({});
        console.log('🗑️  Collection editions vidée');
        
        const testEditions = [
            {
                title: 'Édition du 15 janvier 2024',
                date: new Date('2024-01-15'),
                weekNumber: 3,
                year: 2024,
                status: 'published',
                articles: [
                    {
                        articleId: articlesResult.insertedIds[0], // Premier article
                        position: 1,
                        title: 'Premier article de test'
                    }
                ],
                quartier: {
                    _id: 1,
                    name: 'Quartier Centre'
                },
                editor: {
                    _id: 999,
                    name: 'Admin Test'
                },
                metadata: {
                    createdAt: new Date('2024-01-15'),
                    publishedAt: new Date('2024-01-16'),
                    updatedAt: new Date('2024-01-16')
                }
            },
            {
                title: 'Édition du 20 janvier 2024',
                date: new Date('2024-01-20'),
                weekNumber: 4,
                year: 2024,
                status: 'published',
                articles: [
                    {
                        articleId: articlesResult.insertedIds[1], // Deuxième article
                        position: 1,
                        title: 'Deuxième article de test'
                    }
                ],
                quartier: {
                    _id: 1,
                    name: 'Quartier Centre'
                },
                editor: {
                    _id: 999,
                    name: 'Admin Test'
                },
                metadata: {
                    createdAt: new Date('2024-01-20'),
                    publishedAt: new Date('2024-01-21'),
                    updatedAt: new Date('2024-01-21')
                }
            },
            {
                title: 'Édition en préparation - Semaine 5',
                date: new Date('2024-01-27'),
                weekNumber: 5,
                year: 2024,
                status: 'draft',
                articles: [],
                quartier: {
                    _id: 2,
                    name: 'Quartier Nord'
                },
                editor: {
                    _id: 999,
                    name: 'Admin Test'
                },
                metadata: {
                    createdAt: new Date('2024-01-27'),
                    updatedAt: new Date('2024-01-27')
                }
            }
        ];
        
        console.log('📝 Insertion des éditions de test...');
        const editionsResult = await editionsCollection.insertMany(testEditions);
        console.log(`✅ ${editionsResult.insertedCount} éditions insérées avec succès`);
        
        // === STATISTIQUES ===
        console.log('\n📊 STATISTIQUES:');
        
        const articlesCount = await articlesCollection.countDocuments();
        const editionsCount = await editionsCollection.countDocuments();
        
        console.log(`📄 Articles: ${articlesCount}`);
        console.log(`📚 Éditions: ${editionsCount}`);
        
        // Statistiques des articles par statut
        const articlesStats = await articlesCollection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('\n📈 Articles par statut:');
        articlesStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} articles`);
        });
        
        // Statistiques des éditions par statut
        const editionsStats = await editionsCollection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('\n📈 Éditions par statut:');
        editionsStats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} éditions`);
        });
        
        // Exemple d'article avec nouvelle structure
        const sampleArticle = await articlesCollection.findOne({ status: 'valide' });
        console.log('\n📄 Exemple d\'article avec structure simplifiée:');
        console.log(JSON.stringify(sampleArticle, null, 2));
        
        console.log('\n✅ Base MongoDB initialisée avec succès !');
        console.log('📁 Collections créées:');
        console.log(`  - ${ARTICLES_COLLECTION}: ${articlesCount} documents`);
        console.log(`  - ${EDITIONS_COLLECTION}: ${editionsCount} documents`);
        console.log('\n🎯 Structure NoSQL classique:');
        console.log('  - Champs simples (authorId, authorName, quartierId, quartierName)');
        console.log('  - Pas d\'objets embarqués complexes');
        console.log('  - Structure épurée et performante');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.close();
    }
}

initMongoDBCollections(); 