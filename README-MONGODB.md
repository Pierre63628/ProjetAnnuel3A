# Ajout de MongoDB pour le Journal

## 🎯 **Objectif**

Ajout d'une base de données MongoDB pour stocker les articles du journal de quartier, avec gestion des permissions selon le rôle utilisateur.

## 🏗️ **Architecture**

### **Base de données**
- **PostgreSQL** : Utilisateurs, événements, trocs, messagerie (existant)
- **MongoDB** : Articles du journal (nouveau)

### **Permissions**
- **Admin** : Voit et gère tous les articles
- **User** : Ne voit et ne gère que ses propres articles

## 📦 **Composants ajoutés**

### **Docker**
- Service MongoDB dans `docker-compose.yaml`
- Script d'initialisation dans `docker/mongodb-init/`
- Volume persistant `mongodb_data`

### **Backend**
- Configuration MongoDB : `backend/src/config/mongodb.ts`
- Modèle articles : `backend/src/models/journal.model.ts`
- Contrôleur : `backend/src/controllers/journal.controller.ts`
- Routes : `backend/src/routes/journal.routes.ts`
- Dépendances : `mongodb` et `@types/mongodb`

### **Frontend**
- Page Journal : `frontend/nextdoorbuddy/src/pages/Journal.tsx`
- Item menu : Ajout dans `Header.tsx`
- Traductions : FR/EN dans les fichiers i18n

## 🚀 **Installation**

### **1. Reconstruire les conteneurs**
```bash
# Arrêter les conteneurs existants
docker-compose down

# Reconstruire avec MongoDB
docker-compose up --build -d
```

### **2. Vérifier les services**
```bash
# Vérifier que tous les services démarrent
docker-compose ps

# Vérifier les logs MongoDB
docker-compose logs mongodb
```

## 🔧 **Configuration**

### **Variables d'environnement**
```yaml
# Backend
MONGODB_URI: mongodb://mongodb:27017/journal
MONGODB_DB: journal

# MongoDB
MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: adminpass
MONGO_INITDB_DATABASE: journal
```

### **Ports**
- **MongoDB** : 27017
- **PostgreSQL** : 5432
- **Backend** : 3000
- **Frontend** : 5173

## 📊 **Structure MongoDB**

### **Base de données** : `journal`

#### **Collection** : `articles`
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  author: String,
  authorId: Number,
  date: Date,
  category: String,
  tags: [String],
  status: String,
  editionId: String, // UUID de l'édition associée (optionnel)
  createdAt: Date,
  updatedAt: Date
}
```

#### **Collection** : `editions`
```javascript
{
  _id: ObjectId,
  uuid: String, // UUID auto-généré unique
  title: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Index créés**

#### **Collection articles**
- `authorId` : Pour filtrer par auteur
- `category` : Pour filtrer par catégorie
- `date` : Pour trier chronologiquement
- `title + content` : Index de texte pour la recherche
- `editionId` : Pour filtrer par édition

#### **Collection editions**
- `uuid` : Index unique pour l'UUID
- `title` : Pour la recherche par titre
- `createdAt` : Pour trier chronologiquement

## 🔌 **API Endpoints**

### **Base URL** : `/api/journal`

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|-------------|
| GET | `/` | Liste des articles | Selon rôle |
| GET | `/stats` | Statistiques | Selon rôle |
| GET | `/:id` | Article par ID | Auteur ou Admin |
| POST | `/` | Créer article | Authentifié |
| PUT | `/:id` | Modifier article | Auteur ou Admin |
| DELETE | `/:id` | Supprimer article | Auteur ou Admin |

### **Paramètres de requête**
- `search` : Recherche textuelle
- `category` : Filtrage par catégorie

## 🎨 **Fonctionnalités Frontend**

### **Page Journal**
- **Recherche** en temps réel
- **Filtrage** par catégorie
- **Permissions** visuelles (badge Admin)
- **Actions** conditionnelles (Modifier/Supprimer)
- **Messages** informatifs selon le rôle

### **Interface adaptative**
- **Admin** : Voit tous les articles, toutes les actions
- **User** : Voit ses articles, actions limitées

## 🧪 **Données de test**

Le script d'initialisation MongoDB crée automatiquement :
- 3 articles de démonstration
- 3 journaux de démonstration
- Index optimisés
- Collections `articles` et `journals`

## 📰 **Fonctionnalités des Éditions**

### **Gestion des éditions**
- **Création** : Génération automatique d'UUID unique
- **Association** : Articles peuvent être associés à une édition
- **Flexibilité** : Articles peuvent exister sans édition

### **Modèles disponibles**
- `JournalModel` : Gestion des articles avec référence aux éditions
- `EditionCollectionModel` : Gestion des collections d'éditions

### **Méthodes principales**
```javascript
// Éditions
editionCollectionModel.createEdition(data)
editionCollectionModel.getAllEditions()
editionCollectionModel.getEditionByUUID(uuid)
editionCollectionModel.updateEdition(uuid, data)
editionCollectionModel.deleteEdition(uuid)

// Articles avec éditions
journalModel.getArticlesByEdition(editionId)
journalModel.getValidatedArticlesByEdition(editionId)
journalModel.assignArticleToEdition(articleId, editionId)
journalModel.removeArticleFromEdition(articleId)
```

## 🔍 **Dépannage**

### **MongoDB ne démarre pas**
```bash
# Vérifier les logs
docker-compose logs mongodb

# Redémarrer le service
docker-compose restart mongodb
```

### **Connexion échoue**
```bash
# Vérifier la configuration
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

### **Données perdues**
```bash
# Supprimer le volume et redémarrer
docker-compose down
docker volume rm projetannuel-nextdoorbuddy_mongodb_data
docker-compose up --build -d
```

## 📝 **Notes importantes**

1. **Dual Database** : PostgreSQL + MongoDB
2. **Permissions** : Gérées côté backend et frontend
3. **Index** : Optimisés pour les performances
4. **Persistence** : Volume Docker pour les données
5. **Initialisation** : Automatique au premier démarrage

## 🧪 **Scripts de test**

### **Test des éditions**
```bash
# Tester la création et l'association des éditions
node test-edition-creation.js
```

### **Migration des données**
```bash
# Vérifier la structure actuelle des articles
node check-articles-structure.js

# Migrer les articles existants vers le nouveau format
node migrate-articles-to-editions.js
```

### **Scripts d'initialisation**
- `docker/mongodb-init/01-init-journal.js` : Initialisation des articles
- `docker/mongodb-init/03-init-journals.js` : Initialisation des éditions

### **Scripts de migration**
- `migrate-articles-to-editions.js` : Ajouter le champ editionId aux articles existants
- `check-articles-structure.js` : Vérifier la structure actuelle des articles

## 🚀 **Prochaines étapes**

- [ ] Connecter le frontend à l'API MongoDB
- [ ] Ajouter la création/modification d'articles
- [ ] Implémenter la recherche avancée
- [ ] Ajouter des images aux articles
- [ ] Système de commentaires
- [ ] Interface de gestion des éditions
- [ ] API endpoints pour les éditions 