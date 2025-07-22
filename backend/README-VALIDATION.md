# Système de Validation des Articles

Ce document explique le nouveau système de validation des articles avec statuts et validation par admin.

## Modèle de Données

### JournalArticle (MongoDB)
```typescript
export type ArticleStatus = 'brouillon' | 'a_valider' | 'valide' | 'refuse';

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
    quartier_id?: number;
    createdAt: Date;
    updatedAt: Date;
    validatedAt?: Date;
    validatedBy?: number; // ID de l'admin qui a validé
    validationComment?: string; // Commentaire de validation/refus
}
```

## Statuts des Articles

### 1. **Brouillon** (`brouillon`)
- Article en cours de rédaction
- Visible uniquement par l'auteur
- Peut être modifié et supprimé
- Peut être soumis pour validation

### 2. **À Valider** (`a_valider`)
- Article soumis pour validation par un admin
- Visible par l'auteur et les admins
- Ne peut plus être modifié par l'auteur
- En attente de décision admin

### 3. **Validé** (`valide`)
- Article approuvé par un admin
- Visible dans le journal public du quartier
- Ne peut plus être modifié
- Inclut les informations de validation

### 4. **Refusé** (`refuse`)
- Article rejeté par un admin
- Visible uniquement par l'auteur et les admins
- Inclut le commentaire de refus
- Peut être modifié et resoumis

## Flux de Travail

### 1. Création d'un Article
```
Utilisateur crée un article → Statut: "brouillon"
```

### 2. Soumission pour Validation
```
Utilisateur soumet l'article → Statut: "a_valider"
```

### 3. Validation par Admin
```
Admin valide → Statut: "valide" + validatedAt + validatedBy + commentaire
Admin refuse → Statut: "refuse" + validatedAt + validatedBy + commentaire
```

## API Endpoints

### Gestion d'Articles (Utilisateurs)
```
POST   /api/articles/                    # Créer un article (brouillon)
PUT    /api/articles/:id                 # Modifier un article
DELETE /api/articles/:id                 # Supprimer un article
GET    /api/articles/my-articles         # Mes articles
GET    /api/articles/edit/:id            # Article pour édition
GET    /api/articles/my-stats            # Mes statistiques
PATCH  /api/articles/:id/toggle-visibility # Soumettre/Retirer de la validation
```

### Validation Admin
```
GET    /api/articles/pending-validation  # Articles en attente
GET    /api/articles/stats-by-status     # Statistiques par statut
PATCH  /api/articles/:id/validate        # Valider un article
PATCH  /api/articles/:id/reject          # Refuser un article
```

### Visualisation (Public)
```
GET    /api/journal/                     # Articles validés uniquement
GET    /api/journal/:id                  # Article validé par ID
GET    /api/journal/stats                # Statistiques publiques
```

## Permissions

### Utilisateurs Normaux
- ✅ Créer des articles (brouillon)
- ✅ Modifier leurs articles (brouillon uniquement)
- ✅ Supprimer leurs articles
- ✅ Soumettre pour validation
- ✅ Retirer de la validation
- ❌ Voir les articles d'autres utilisateurs
- ❌ Valider/refuser des articles

### Administrateurs
- ✅ Toutes les permissions utilisateur
- ✅ Voir tous les articles
- ✅ Modifier tous les articles
- ✅ Valider des articles
- ✅ Refuser des articles avec commentaire
- ✅ Voir les statistiques par statut
- ✅ Voir les articles en attente

## Exemples d'Utilisation

### Créer un Article
```bash
POST /api/articles/
{
  "title": "Mon Article",
  "content": "Contenu de l'article...",
  "category": "Actualités",
  "tags": ["tag1", "tag2"],
  "date": "2024-01-20"
}
# Statut automatique: "brouillon"
```

### Soumettre pour Validation
```bash
PATCH /api/articles/123/toggle-visibility
# Change le statut de "brouillon" à "a_valider"
```

### Valider un Article (Admin)
```bash
PATCH /api/articles/123/validate
{
  "comment": "Article approuvé, excellent contenu"
}
# Statut: "valide" + métadonnées de validation
```

### Refuser un Article (Admin)
```bash
PATCH /api/articles/123/reject
{
  "comment": "Contenu inapproprié, veuillez modifier"
}
# Statut: "refuse" + commentaire de refus
```

## Statistiques

### Par Statut
```json
{
  "brouillon": 5,
  "a_valider": 3,
  "valide": 12,
  "refuse": 2
}
```

### Visualisation
- **Journal public** : Seuls les articles `valide`
- **Gestion utilisateur** : Articles `brouillon`, `a_valider`, `refuse`
- **Admin** : Tous les articles + statistiques complètes

## Avantages du Système

1. **Contrôle Qualité** : Validation par admin avant publication
2. **Traçabilité** : Historique des validations avec commentaires
3. **Flexibilité** : Possibilité de refuser avec explications
4. **Sécurité** : Séparation claire entre création et publication
5. **Transparence** : Statuts clairs pour tous les utilisateurs 