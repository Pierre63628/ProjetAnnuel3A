# Journal - Séparation Génération et Visualisation

Ce document explique la séparation entre la génération d'articles et la visualisation du journal dans l'application NextDoorBuddy.

## Architecture

### 1. Génération d'Articles (`/api/articles`)
**Contrôleur :** `article-generation.controller.ts`  
**Routes :** `article-generation.routes.ts`  
**Authentification :** Requise

#### Fonctionnalités :
- **Création d'articles** : `POST /api/articles/`
- **Édition d'articles** : `PUT /api/articles/:id`
- **Suppression d'articles** : `DELETE /api/articles/:id`
- **Liste de mes articles** : `GET /api/articles/my-articles`
- **Article pour édition** : `GET /api/articles/edit/:id`
- **Statistiques personnelles** : `GET /api/articles/my-stats`
- **Publier/Dépublier** : `PATCH /api/articles/:id/toggle-visibility`

#### Permissions :
- Les utilisateurs peuvent créer, éditer et supprimer leurs propres articles
- Les administrateurs peuvent modifier tous les articles
- Chaque utilisateur ne voit que ses propres articles dans la liste

### 2. Visualisation du Journal (`/api/journal`)
**Contrôleur :** `journal.controller.ts`  
**Routes :** `journal.routes.ts`  
**Authentification :** Non requise

#### Fonctionnalités :
- **Liste des articles publics** : `GET /api/journal/`
- **Article public par ID** : `GET /api/journal/:id`
- **Statistiques publiques** : `GET /api/journal/stats`

#### Filtres disponibles :
- **Recherche** : `?search=terme`
- **Catégorie** : `?category=nom_categorie`
- **Auteur** : `?author=id_auteur`

#### Permissions :
- Accès public à tous les articles avec le statut `valide`
- Aucune authentification requise
- Les articles privés ne sont jamais visibles

## Modèle de Données

### JournalArticle (MongoDB)
```typescript
interface JournalArticle {
    _id?: ObjectId;
    title: string;
    content: string;
    author: string;
    authorId: number;
    date: Date;
    category: string;
    tags: string[];
    status: ArticleStatus;
    createdAt: Date;
    updatedAt: Date;
}
```

## Flux de Travail

### 1. Création d'un Article
1. L'utilisateur se connecte
2. Il accède à `/api/articles/` pour créer un article
3. L'article est créé avec le statut `brouillon` par défaut
4. L'utilisateur peut le publier via `toggle-visibility`

### 2. Publication d'un Article
1. L'utilisateur modifie le statut à `a_valider`
2. L'article devient visible dans `/api/journal/`
3. Tous les utilisateurs peuvent le consulter

### 3. Consultation du Journal
1. N'importe qui peut accéder à `/api/journal/`
2. Seuls les articles publics sont visibles
3. Possibilité de filtrer par recherche, catégorie ou auteur

## Sécurité

### Génération d'Articles
- Authentification JWT requise
- Vérification des permissions (propriétaire ou admin)
- Validation des données d'entrée
- Protection contre les injections

### Visualisation du Journal
- Aucune authentification requise
- Filtrage automatique des articles privés
- Pas d'accès aux métadonnées sensibles

## Exemples d'Utilisation

### Créer un Article
```bash
POST /api/articles/
Authorization: Bearer <token>
{
  "title": "Mon Article",
  "content": "Contenu de l'article...",
  "category": "Actualités",
  "tags": ["tag1", "tag2"],
  "status": "brouillon"
}
```

### Publier un Article
```bash
PATCH /api/articles/123/toggle-visibility
Authorization: Bearer <token>
```

### Consulter le Journal
```bash
GET /api/journal/
GET /api/journal/?search=terme
GET /api/journal/?category=Actualités
GET /api/journal/123
```

## Avantages de cette Séparation

1. **Sécurité** : Isolation claire entre création et consultation
2. **Performance** : Routes de consultation optimisées
3. **Maintenance** : Code plus modulaire et maintenable
4. **Évolutivité** : Facilite l'ajout de nouvelles fonctionnalités
5. **Clarté** : Séparation logique des responsabilités 