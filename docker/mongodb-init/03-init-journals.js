// Script d'initialisation MongoDB pour les éditions
// Ce script est exécuté automatiquement lors du premier démarrage du conteneur MongoDB

// Se connecter à la base de données journal
db = db.getSiblingDB('journal');

// Fonction pour générer un UUID v4
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Créer la collection editions si elle n'existe pas
if (!db.getCollectionNames().includes('editions')) {
    db.createCollection('editions');
    print('Collection "editions" créée avec succès');
}

// Créer des index pour optimiser les requêtes
db.editions.createIndex({ "uuid": 1 }, { unique: true });
db.editions.createIndex({ "title": 1 });
db.editions.createIndex({ "createdAt": -1 });

print('Index pour editions créés avec succès');

// Insérer quelques éditions de démonstration
const demoEditions = [
    {
        uuid: generateUUID(),
        title: "Édition du Quartier Nord",
        description: "L'édition officielle du quartier nord de la ville",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        uuid: generateUUID(),
        title: "Le Petit Journal du Centre",
        description: "Informations et actualités du centre-ville",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        uuid: generateUUID(),
        title: "Édition des Événements",
        description: "Tous les événements et activités de notre communauté",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insérer les éditions de démonstration
db.editions.insertMany(demoEditions);

print('Éditions de démonstration insérées avec succès');

// Ajouter un index sur editionId dans la collection articles si il n'existe pas déjà
if (db.articles.getIndexes().findIndex(idx => idx.name === 'editionId_1') === -1) {
    db.articles.createIndex({ "editionId": 1 });
    print('Index editionId créé dans la collection articles');
}

print('Initialisation des éditions MongoDB terminée'); 