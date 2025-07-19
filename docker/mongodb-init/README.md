# Initialisation MongoDB pour le Journal

Ce dossier contient les scripts d'initialisation pour la base de données MongoDB utilisée pour stocker les articles du journal.

## Structure

- `01-init-journal.js` : Script principal d'initialisation

## Fonctionnalités

Le script d'initialisation :

1. **Crée la base de données** `journal`
2. **Crée la collection** `articles`
3. **Configure les index** pour optimiser les performances :
   - Index sur `authorId` pour filtrer par auteur
   - Index sur `category` pour filtrer par catégorie
   - Index sur `date` pour trier chronologiquement
   - Index de texte sur `title` et `content` pour la recherche
4. **Insère des articles de démonstration**

## Variables d'environnement

- `MONGO_INITDB_ROOT_USERNAME` : admin
- `MONGO_INITDB_ROOT_PASSWORD` : adminpass
- `MONGO_INITDB_DATABASE` : journal

## Connexion

- **Host** : mongodb
- **Port** : 27017
- **Database** : journal
- **Collection** : articles

## Utilisation

Les scripts sont exécutés automatiquement lors du premier démarrage du conteneur MongoDB avec `docker-compose up --build`. 