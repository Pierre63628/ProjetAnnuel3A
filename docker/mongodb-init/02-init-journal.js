// Script d'initialisation pour la base de données journal
db = db.getSiblingDB('journal');

// Créer la collection articles si elle n'existe pas
db.createCollection('articles');

// Insérer quelques articles de test
db.articles.insertMany([
    {
        title: "Bienvenue dans notre quartier !",
        content: "C'est avec plaisir que nous vous accueillons dans notre journal de quartier. Ici, vous trouverez toutes les actualités, événements et informations importantes de notre communauté.",
        author: "Équipe du quartier",
        authorId: 1,
        date: new Date("2024-01-15"),
        category: "Actualités",
        tags: ["bienvenue", "quartier", "communauté"],
        status: "valide",
        quartier_id: 1,
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        validatedAt: new Date("2024-01-15"),
        validatedBy: 1,
        validationComment: "Article de bienvenue approuvé"
    },
    {
        title: "Nouveau parc pour enfants",
        content: "Un nouveau parc pour enfants a été inauguré ce week-end. Il comprend des toboggans, des balançoires et un espace de jeux sécurisé. Venez nombreux avec vos enfants !",
        author: "Marie Dupont",
        authorId: 2,
        date: new Date("2024-01-16"),
        category: "Améliorations",
        tags: ["parc", "enfants", "jeux", "inauguration"],
        status: "valide",
        quartier_id: 1,
        createdAt: new Date("2024-01-16"),
        updatedAt: new Date("2024-01-16"),
        validatedAt: new Date("2024-01-16"),
        validatedBy: 1,
        validationComment: "Excellente nouvelle pour le quartier"
    },
    {
        title: "Collecte de déchets verts",
        content: "La prochaine collecte de déchets verts aura lieu le 20 janvier. Pensez à sortir vos sacs biodégradables avant 8h du matin.",
        author: "Service municipal",
        authorId: 3,
        date: new Date("2024-01-17"),
        category: "Environnement",
        tags: ["collecte", "déchets", "vert", "écologie"],
        status: "valide",
        quartier_id: 1,
        createdAt: new Date("2024-01-17"),
        updatedAt: new Date("2024-01-17"),
        validatedAt: new Date("2024-01-17"),
        validatedBy: 1,
        validationComment: "Information importante pour tous"
    },
    {
        title: "Concert de jazz au square",
        content: "Le groupe de jazz local se produira ce samedi soir au square central. Venez profiter d'une soirée musicale en plein air !",
        author: "Association culturelle",
        authorId: 4,
        date: new Date("2024-01-18"),
        category: "Culture",
        tags: ["concert", "jazz", "musique", "événement"],
        status: "valide",
        quartier_id: 1,
        createdAt: new Date("2024-01-18"),
        updatedAt: new Date("2024-01-18"),
        validatedAt: new Date("2024-01-18"),
        validatedBy: 1,
        validationComment: "Événement culturel approuvé"
    },
    {
        title: "Tournoi de pétanque",
        content: "Le tournoi annuel de pétanque aura lieu dimanche prochain. Inscriptions ouvertes jusqu'à samedi midi.",
        author: "Club de pétanque",
        authorId: 5,
        date: new Date("2024-01-19"),
        category: "Sport",
        tags: ["pétanque", "tournoi", "sport", "compétition"],
        status: "valide",
        quartier_id: 1,
        createdAt: new Date("2024-01-19"),
        updatedAt: new Date("2024-01-19"),
        validatedAt: new Date("2024-01-19"),
        validatedBy: 1,
        validationComment: "Événement sportif traditionnel"
    }
]);

// Créer un index de texte pour la recherche
db.articles.createIndex({
    title: "text",
    content: "text",
    tags: "text"
});

print("✅ Base de données journal initialisée avec succès");
print("📰 Articles de test créés");
print("🔍 Index de recherche créé"); 