# NextDoorBuddy

Application de mise en relation entre voisins pour favoriser l'entraide et la convivialité dans les quartiers.

## Technologies utilisées

- **Frontend** : React, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL
- **Authentification** : JWT (stateless)

## Structure du projet

```
.
├── backend/                # Code du serveur Node.js/Express
│   ├── src/              # Code source du backend
│   │   ├── config/       # Configuration (base de données, JWT, etc.)
│   │   ├── controllers/  # Contrôleurs pour les routes
│   │   ├── middlewares/  # Middlewares (authentification, validation, etc.)
│   │   ├── models/       # Modèles de données
│   │   └── routes/       # Définition des routes API
│   └── Dockerfile       # Configuration Docker pour le backend
├── docker/                # Fichiers de configuration Docker
│   └── init/           # Scripts d'initialisation de la base de données
├── frontend/              # Code de l'application React
│   └── nextdoorbuddy/   # Application React
│       ├── src/          # Code source du frontend
│       │   ├── components/  # Composants React réutilisables
│       │   ├── contexts/    # Contextes React (authentification, etc.)
│       │   ├── pages/       # Pages de l'application
│       │   └── styles/      # Styles CSS/Tailwind
│       └── Dockerfile    # Configuration Docker pour le frontend
└── docker-compose.yaml    # Configuration Docker Compose
```

## Fonctionnalités

- Authentification sécurisée (JWT)
- Gestion des utilisateurs
- Gestion des événements de quartier
- Mise en relation entre voisins

## Installation et lancement

```bash
# Cloner le dépôt
git clone https://github.com/Pierre63628/ProjetAnnuel3A.git
cd ProjetAnnuel-NextDoorBuddy

# Lancer les conteneurs Docker
docker-compose up --build -d
```

## Accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000

## Utilisateurs de test

- **Administrateur** : lucas.verrecchia@gmail.com / Admin123!
- **Utilisateur** : jean.dupont@example.com / User123!