const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'journal';
const COLLECTION_NAME = 'articles';

async function initMongoDBArticles() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connecté à MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        // Vider la collection d'abord
        await collection.deleteMany({});
        console.log('🗑️  Collection vidée');
        
        // Créer des articles de test avec structure NoSQL
        const testArticles = [
            {
                title: 'Premier article de test',
                content: 'Ceci est le contenu du premier article de test avec une structure NoSQL complète.',
                author: {
                    _id: 1,
                    name: 'Jean Dupont',
                    email: 'jean.dupont@example.com'
                },
                date: new Date('2024-01-15'),
                category: 'Actualités',
                tags: ['test', 'premier'],
                status: 'valide',
                quartier: {
                    _id: 1,
                    name: 'Quartier Centre'
                },
                validation: {
                    validatedAt: new Date('2024-01-16'),
                    validatedBy: {
                        _id: 999,
                        name: 'Admin Test'
                    },
                    comment: 'Article validé pour test'
                },
                metadata: {
                    createdAt: new Date('2024-01-15'),
                    updatedAt: new Date('2024-01-16')
                }
            },
            {
                title: 'Deuxième article de test',
                content: 'Contenu du deuxième article avec des informations sur le quartier.',
                author: {
                    _id: 2,
                    name: 'Marie Martin',
                    email: 'marie.martin@example.com'
                },
                date: new Date('2024-01-20'),
                category: 'Événements',
                tags: ['événement', 'quartier'],
                status: 'valide',
                quartier: {
                    _id: 1,
                    name: 'Quartier Centre'
                },
                validation: {
                    validatedAt: new Date('2024-01-21'),
                    validatedBy: {
                        _id: 999,
                        name: 'Admin Test'
                    },
                    comment: 'Événement validé'
                },
                metadata: {
                    createdAt: new Date('2024-01-20'),
                    updatedAt: new Date('2024-01-21')
                }
            },
            {
                title: 'Article en attente de validation',
                content: 'Cet article est en attente de validation par un administrateur.',
                author: {
                    _id: 3,
                    name: 'Pierre Durand',
                    email: 'pierre.durand@example.com'
                },
                date: new Date('2024-01-25'),
                category: 'Annonces',
                tags: ['annonce', 'attente'],
                status: 'a_valider',
                quartier: {
                    _id: 2,
                    name: 'Quartier Nord'
                },
                metadata: {
                    createdAt: new Date('2024-01-25'),
                    updatedAt: new Date('2024-01-25')
                }
            },
            {
                title: 'Article brouillon',
                content: 'Cet article est encore en brouillon.',
                author: {
                    _id: 1,
                    name: 'Jean Dupont',
                    email: 'jean.dupont@example.com'
                },
                date: new Date('2024-01-30'),
                category: 'Actualités',
                tags: ['brouillon'],
                status: 'brouillon',
                quartier: {
                    _id: 1,
                    name: 'Quartier Centre'
                },
                metadata: {
                    createdAt: new Date('2024-01-30'),
                    updatedAt: new Date('2024-01-30')
                }
            }
        ];
        
        console.log('📝 Insertion des articles de test...');
        const result = await collection.insertMany(testArticles);
        console.log(`✅ ${result.insertedCount} articles insérés avec succès`);
        
        // Vérifier les articles insérés
        const count = await collection.countDocuments();
        console.log(`📊 Nombre total d'articles dans la collection: ${count}`);
        
        // Afficher un exemple d'article
        const sampleArticle = await collection.findOne({ status: 'valide' });
        console.log('📄 Exemple d\'article validé:');
        console.log(JSON.stringify(sampleArticle, null, 2));
        
        // Lister tous les articles par statut
        const stats = await collection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        console.log('📈 Statistiques par statut:');
        stats.forEach(stat => {
            console.log(`  - ${stat._id}: ${stat.count} articles`);
        });
        
        console.log('✅ Base MongoDB initialisée avec succès !');
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await client.close();
    }
}

initMongoDBArticles(); 