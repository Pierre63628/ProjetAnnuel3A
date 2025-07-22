// Script d'initialisation MongoDB pour le journal
// Ce script est exécuté automatiquement lors du premier démarrage du conteneur MongoDB

// Se connecter à la base de données journal
db = db.getSiblingDB('journal');

// Créer la collection articles si elle n'existe pas
if (!db.getCollectionNames().includes('articles')) {
    db.createCollection('articles');
    print('Collection "articles" créée avec succès');
}

// Créer des index pour optimiser les requêtes
db.articles.createIndex({ "authorId": 1 });
db.articles.createIndex({ "category": 1 });
db.articles.createIndex({ "date": -1 });
db.articles.createIndex({ "title": "text", "content": "text" });

print('Index créés avec succès');

// Insérer quelques articles de démonstration
const demoArticles = [
    {
        title: "Première réunion du conseil de quartier",
        content: "Aujourd'hui, nous avons organisé la première réunion du conseil de quartier. Les habitants ont pu exprimer leurs préoccupations et proposer des améliorations pour notre quartier. L'ambiance était très constructive et nous avons pris plusieurs décisions importantes.",
        author: "Marie Dupont",
        authorId: 1,
        date: new Date("2024-01-15"),
        category: "Événements",
        tags: ["conseil", "quartier", "réunion"],
        status: 'valide',
        editionId: null, // Sera associé à une édition plus tard
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        title: "Installation des nouveaux bancs dans le parc",
        content: "Les nouveaux bancs ont été installés dans le parc municipal. Ils sont plus confortables et respectent l'environnement. Les enfants adorent déjà les tester !",
        author: "Jean Martin",
        authorId: 2,
        date: new Date("2024-01-10"),
        category: "Améliorations",
        tags: ["parc", "bancs", "aménagement"],
        status: 'valide',
        editionId: null, // Sera associé à une édition plus tard
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        title: "Nouveau système de tri sélectif",
        content: "La mairie a mis en place un nouveau système de tri sélectif dans notre quartier. Des conteneurs colorés ont été installés à plusieurs endroits stratégiques. Un guide de tri a été distribué à tous les habitants.",
        author: "Sophie Bernard",
        authorId: 3,
        date: new Date("2024-01-05"),
        category: "Environnement",
        tags: ["tri", "recyclage", "environnement"],
        status: 'valide',
        editionId: null, // Sera associé à une édition plus tard
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insérer les articles de démonstration
db.articles.insertMany(demoArticles);

print('Articles de démonstration insérés avec succès');
print('Initialisation MongoDB terminée'); 