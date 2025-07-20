import { Request, Response } from 'express';
import journalModel, { editionCollectionModel } from '../models/journal.model.js';
import { ApiErrors } from '../errors/ApiErrors.js';
import pool from '../config/db.js';

// Récupérer tous les articles publics (pour la visualisation)
export const getPublicArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const articles = await journalModel.getPublicArticles();

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles publics:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles'
        });
    }
};

// Récupérer un article public par ID
export const getPublicArticleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const article = await journalModel.getArticleById(id);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        // Vérifier que l'article est validé
        if (article.status !== 'valide') {
            throw new ApiErrors('Article non accessible', 403);
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'article'
            });
        }
    }
};

// Récupérer les statistiques des articles publics
export const getPublicArticleStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await journalModel.getStatsByStatus();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
};

// Récupérer tous les articles validés (pour les journaux)
export const getValidatedArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const articles = await journalModel.getValidatedArticles();

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles validés:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles validés'
        });
    }
};

// Récupérer les articles validés sans editionId (pour l'onglet éditions)
export const getValidatedArticlesWithoutEdition = async (req: Request, res: Response): Promise<void> => {
    try {
        // Récupérer tous les articles validés
        const allValidatedArticles = await journalModel.getValidatedArticles();

        // Filtrer pour ne garder que ceux sans editionId
        const articlesWithoutEdition = allValidatedArticles.filter(article =>
            !article.editionId || article.editionId === null || article.editionId === undefined
        );
        
        res.json({
            success: true,
            data: articlesWithoutEdition,
            total: articlesWithoutEdition.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles validés sans édition:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles validés sans édition'
        });
    }
};

// === FONCTIONS ADMIN ===

// Récupérer tous les articles (pour les admins)
export const getAllArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminId = req.user!.id;
        const adminQuartierId = req.user!.quartier_id;
        
        if (!adminQuartierId) {
            throw new ApiErrors('Vous devez être associé à un quartier pour voir les articles', 403);
        }
        
        const articles = await journalModel.getAllArticlesByQuartier(adminQuartierId);

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération de tous les articles:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des articles'
            });
        }
    }
};

// Récupérer les articles en attente de validation
export const getPendingArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const adminQuartierId = req.user!.quartier_id;
        
        if (!adminQuartierId) {
            throw new ApiErrors('Vous devez être associé à un quartier pour voir les articles', 403);
        }

        const articles = await journalModel.getArticlesPendingValidationByQuartier(adminQuartierId);

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération des articles en attente:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des articles en attente'
            });
        }
    }
};

// Valider un article (admin)
export const validateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;
        const adminQuartierId = req.user!.quartier_id;

        if (!adminQuartierId) {
            throw new ApiErrors('Vous devez être associé à un quartier pour valider des articles', 403);
        }

        // Vérifier que l'article appartient au quartier de l'admin
        const article = await journalModel.getArticleById(id);
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        if (article.quartierId !== adminQuartierId) {
            throw new ApiErrors('Vous ne pouvez valider que les articles de votre quartier', 403);
        }

        const updatedArticle = await journalModel.validateArticle(id);
        
        if (!updatedArticle) {
            throw new ApiErrors('Erreur lors de la validation de l\'article', 500);
        }

        res.json({
            success: true,
            message: 'Article validé avec succès',
            data: updatedArticle
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la validation de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation de l\'article'
            });
        }
    }
};

// Refuser un article (admin)
export const rejectArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;
        const adminQuartierId = req.user!.quartier_id;

        if (!adminQuartierId) {
            throw new ApiErrors('Vous devez être associé à un quartier pour refuser des articles', 403);
        }

        // Vérifier que l'article appartient au quartier de l'admin
        const article = await journalModel.getArticleById(id);
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        if (article.quartierId !== adminQuartierId) {
            throw new ApiErrors('Vous ne pouvez refuser que les articles de votre quartier', 403);
        }

        const updatedArticle = await journalModel.rejectArticle(id);
        
        if (!updatedArticle) {
            throw new ApiErrors('Erreur lors du refus de l\'article', 500);
        }

        res.json({
            success: true,
            message: 'Article refusé avec succès',
            data: updatedArticle
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors du refus de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du refus de l\'article'
            });
        }
    }
};

// === FONCTIONS UTILISATEUR ===

// Récupérer les articles de l'utilisateur connecté
export const getUserArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        const articles = await journalModel.getArticlesByAuthor(userId);

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles utilisateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles'
        });
    }
};

// Récupérer un article de l'utilisateur par ID
export const getUserArticleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const article = await journalModel.getArticleById(id);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        // Vérifier que l'utilisateur est l'auteur
        if (article.authorId !== userId) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à voir cet article', 403);
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'article'
            });
        }
    }
};

// Récupérer un article par ID (admin - peut voir tous les articles)
export const getAdminArticleById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const adminId = req.user!.id;
        const adminQuartierId = req.user!.quartier_id;

        const article = await journalModel.getArticleById(id);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        // Vérifier que l'admin peut voir les articles de son quartier
        if (article.quartierId !== adminQuartierId) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à voir cet article', 403);
        }

        res.json({
            success: true,
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'article'
            });
        }
    }
};

// Créer un nouvel article
export const createArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const { title, content, category, imageUrl } = req.body;
        let quartier_id = req.body.quartier_id || req.user!.quartier_id;

        // Récupérer les informations utilisateur depuis PostgreSQL
        const userResult = await pool.query(
            'SELECT id, prenom, nom, email FROM "Utilisateur" WHERE id = $1',
            [userId]
        );
        
        if (userResult.rows.length === 0) {
            throw new ApiErrors('Utilisateur non trouvé', 404);
        }
        
        const user = userResult.rows[0];

        // Vérifier que l'utilisateur a un quartier_id
        if (!quartier_id) {
            quartier_id = 1; // Quartier par défaut pour les tests
        }

        // Récupérer les informations du quartier depuis PostgreSQL
        const quartierResult = await pool.query(
            'SELECT id, nom_quartier as nom FROM "Quartier" WHERE id = $1',
            [quartier_id]
        );
        
        if (quartierResult.rows.length === 0) {
            throw new ApiErrors('Quartier non trouvé', 404);
        }
        
        const quartier = quartierResult.rows[0];

        const articleData = {
            title,
            content,
            authorId: user.id,
            authorName: `${user.prenom} ${user.nom}`,
            date: new Date(),
            quartierId: quartier.id,
            quartierName: quartier.nom,
            category: category || 'Actualités',
            imageUrl: imageUrl || null
        };

        const article = await journalModel.createArticle(articleData);

        res.status(201).json({
            success: true,
            message: 'Article créé avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la création de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'article'
            });
        }
    }
};

// Modifier un article
export const updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;
        const { title, content, category, imageUrl, ...otherData } = req.body;
        const updateData = { title, content, category, imageUrl, ...otherData };

        // Vérifier que l'utilisateur est l'auteur ou un admin
        const isAuthor = await journalModel.isArticleAuthor(id, userId);
        const isAdmin = req.user!.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à modifier cet article', 403);
        }

        const article = await journalModel.updateArticle(id, updateData);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article modifié avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la modification de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la modification de l\'article'
            });
        }
    }
};

// Supprimer un article
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // Vérifier que l'utilisateur est l'auteur ou un admin
        const isAuthor = await journalModel.isArticleAuthor(id, userId);
        const isAdmin = req.user!.role === 'admin';

        if (!isAuthor && !isAdmin) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à supprimer cet article', 403);
        }

        const success = await journalModel.deleteArticle(id);
        
        if (!success) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article supprimé avec succès'
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la suppression de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'article'
            });
        }
    }
};

// Soumettre un article pour validation
export const submitForValidation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        // Vérifier que l'utilisateur est l'auteur
        const isAuthor = await journalModel.isArticleAuthor(id, userId);

        if (!isAuthor) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à soumettre cet article', 403);
        }

        const article = await journalModel.submitForValidation(id);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article soumis pour validation avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la soumission pour validation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la soumission pour validation'
            });
        }
    }
};

// Récupérer les statistiques des articles
export const getArticleStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const isAdmin = req.user!.role === 'admin';

        let stats;
        if (isAdmin) {
            stats = await journalModel.getStatsByStatus();
        } else {
            // Pour les utilisateurs normaux, on peut retourner leurs propres statistiques
            const userArticles = await journalModel.getArticlesByAuthor(userId);
            stats = {
                total: userArticles.length,
                brouillon: userArticles.filter(a => a.status === 'brouillon').length,
                a_valider: userArticles.filter(a => a.status === 'a_valider').length,
                valide: userArticles.filter(a => a.status === 'valide').length,
                refuse: userArticles.filter(a => a.status === 'refuse').length
            };
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
}; 

// Créer un nouveau journal avec des articles
export const createJournal = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, articleIds } = req.body;
        const userId = req.user!.id;

        // Validation des données
        if (!title || !title.trim()) {
            throw new ApiErrors('Le titre du journal est requis', 400);
        }

        if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
            throw new ApiErrors('Au moins un article doit être sélectionné', 400);
        }

        // Créer l'édition
        const editionData = {
            title: title.trim(),
            description: description?.trim() || ''
        };

        const edition = await editionCollectionModel.createEdition(editionData);

        // Associer les articles à l'édition
        const updatedArticles = [];

        for (const articleId of articleIds) {
            const updatedArticle = await journalModel.assignArticleToEdition(articleId, edition.uuid);
            if (updatedArticle) {
                updatedArticles.push(updatedArticle);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Journal créé avec succès',
            data: {
                edition,
                articles: updatedArticles,
                totalArticles: updatedArticles.length
            }
        });

    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la création du journal:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du journal'
            });
        }
    }
}; 

// Récupérer toutes les éditions
export const getEditions = async (req: Request, res: Response): Promise<void> => {
    try {
        // Vérifier que editionCollectionModel est bien défini
        if (!editionCollectionModel) {
            throw new Error('editionCollectionModel n\'est pas défini');
        }

        // Vérifier que la méthode getAllEditions existe
        if (typeof editionCollectionModel.getAllEditions !== 'function') {
            throw new Error('La méthode getAllEditions n\'existe pas sur editionCollectionModel');
        }

        const editions = await editionCollectionModel.getAllEditions();

        res.json({
            success: true,
            data: editions,
            total: editions.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des éditions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des éditions'
        });
    }
};

// Récupérer une édition par son UUID
export const getEditionByUUID = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uuid } = req.params;
        
        if (!uuid) {
            throw new ApiErrors('UUID de l\'édition requis', 400);
        }

        const edition = await editionCollectionModel.getEditionByUUID(uuid);

        if (!edition) {
            throw new ApiErrors('Édition non trouvée', 404);
        }

        res.json({
            success: true,
            data: edition
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération de l\'édition:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'édition'
            });
        }
    }
};

// Récupérer les articles d'une édition spécifique
export const getArticlesByEdition = async (req: Request, res: Response): Promise<void> => {
    try {
        const { uuid } = req.params;
        
        if (!uuid) {
            throw new ApiErrors('UUID de l\'édition requis', 400);
        }

        // Vérifier que l'édition existe
        const edition = await editionCollectionModel.getEditionByUUID(uuid);
        if (!edition) {
            throw new ApiErrors('Édition non trouvée', 404);
        }

        // Récupérer les articles de l'édition
        const articles = await journalModel.getArticlesByEdition(uuid);

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la récupération des articles de l\'édition:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des articles de l\'édition'
            });
        }
    }
}; 