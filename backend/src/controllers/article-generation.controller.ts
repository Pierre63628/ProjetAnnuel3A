import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import journalModel, { CreateArticleData, UpdateArticleData } from '../models/journal.model.js';
import { ApiErrors } from '../errors/ApiErrors.js';

// Validation pour la création d'article
export const validateCreateArticle = [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Le titre est requis et doit faire moins de 255 caractères'),
    body('content').trim().isLength({ min: 1 }).withMessage('Le contenu est requis'),
    body('category').trim().isLength({ min: 1 }).withMessage('La catégorie est requise'),
    body('tags').isArray().withMessage('Les tags doivent être un tableau'),
    body('date').optional().isISO8601().withMessage('La date doit être au format ISO')
];

// Validation pour la mise à jour d'article
export const validateUpdateArticle = [
    body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Le titre doit faire moins de 255 caractères'),
    body('content').optional().trim().isLength({ min: 1 }).withMessage('Le contenu ne peut pas être vide'),
    body('category').optional().trim().isLength({ min: 1 }).withMessage('La catégorie ne peut pas être vide'),
    body('tags').optional().isArray().withMessage('Les tags doivent être un tableau'),
    body('status').optional().isIn(['brouillon', 'a_valider', 'valide', 'refuse']).withMessage('Statut invalide'),
    body('date').optional().isISO8601().withMessage('La date doit être au format ISO')
];

// Créer un nouvel article
export const createArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Erreurs de validation:', errors.array());
            throw new ApiErrors('Données invalides', 400);
        }

        const user = (req as any).user;
        console.log('Données reçues:', req.body);
        console.log('Utilisateur:', user);
        
        const articleData: CreateArticleData = {
            ...req.body,
            author: `${user.prenom} ${user.nom}`,
            authorId: user.id,
            date: new Date(req.body.date || Date.now()),
            quartier_id: user.quartier_id,
            status: 'valide' // Statut par défaut pour les nouveaux articles (temporaire pour test)
        };
        
        console.log('Données d\'article à créer:', articleData);

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

// Mettre à jour un article
export const updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiErrors('Données invalides', 400);
        }

        const { id } = req.params;
        const user = (req as any).user;

        // Vérifier si l'utilisateur peut modifier cet article
        const canEdit = user.role === 'admin' || await journalModel.isArticleAuthor(id, user.id);
        
        if (!canEdit) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à modifier cet article', 403);
        }

        const updateData: UpdateArticleData = {
            ...req.body,
            ...(req.body.date && { date: new Date(req.body.date) })
        };

        const article = await journalModel.updateArticle(id, updateData);

        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article mis à jour avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la mise à jour de l\'article:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'article'
            });
        }
    }
};

// Supprimer un article
export const deleteArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Vérifier si l'utilisateur peut supprimer cet article
        const canDelete = user.role === 'admin' || await journalModel.isArticleAuthor(id, user.id);
        
        if (!canDelete) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à supprimer cet article', 403);
        }

        const deleted = await journalModel.deleteArticle(id);

        if (!deleted) {
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

// Récupérer les articles de l'utilisateur connecté (pour l'édition)
export const getMyArticles = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        console.log('Récupération des articles pour l\'utilisateur:', user.id);
        
        const articles = await journalModel.getArticlesByAuthor(user.id);
        console.log('Articles récupérés:', articles.length);

        res.json({
            success: true,
            data: articles,
            total: articles.length
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de vos articles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de vos articles'
        });
    }
};

// Récupérer un article pour l'édition
export const getArticleForEdit = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        const article = await journalModel.getArticleById(id);
        
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        // Vérifier les permissions d'édition
        if (user.role !== 'admin' && article.authorId !== user.id) {
            throw new ApiErrors('Accès non autorisé à cet article', 403);
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

// Récupérer les statistiques des articles de l'utilisateur
export const getMyArticleStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const stats = await journalModel.getArticleStats(user.id);

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

// Publier/Dépublier un article
export const toggleArticleVisibility = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = (req as any).user;

        // Vérifier si l'utilisateur peut modifier cet article
        const canEdit = user.role === 'admin' || await journalModel.isArticleAuthor(id, user.id);
        
        if (!canEdit) {
            throw new ApiErrors('Vous n\'êtes pas autorisé à modifier cet article', 403);
        }

        const article = await journalModel.getArticleById(id);
        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        // Changer le statut selon l'état actuel
        let newStatus: 'brouillon' | 'a_valider';
        if (article.status === 'brouillon') {
            newStatus = 'a_valider';
        } else if (article.status === 'a_valider') {
            newStatus = 'brouillon';
        } else {
            throw new ApiErrors('Impossible de modifier le statut de cet article', 400);
        }

        const updatedArticle = await journalModel.updateArticle(id, {
            status: newStatus
        });

        res.json({
            success: true,
            message: `Article ${updatedArticle?.status === 'a_valider' ? 'soumis pour validation' : 'retiré de la validation'} avec succès`,
            data: updatedArticle
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors du changement de visibilité:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du changement de visibilité'
            });
        }
    }
}; 

// === FONCTIONS ADMIN ===

// Récupérer les articles en attente de validation (admin uniquement)
export const getPendingValidation = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        
        if (user.role !== 'admin') {
            throw new ApiErrors('Accès non autorisé', 403);
        }

        const articles = await journalModel.getArticlesPendingValidation();

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

// Valider un article (admin uniquement)
export const validateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { comment } = req.body;

        if (user.role !== 'admin') {
            throw new ApiErrors('Accès non autorisé', 403);
        }

        const article = await journalModel.validateArticle(id, user.id, comment);

        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article validé avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors de la validation:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la validation'
            });
        }
    }
};

// Refuser un article (admin uniquement)
export const rejectArticle = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        const { id } = req.params;
        const { comment } = req.body;

        if (user.role !== 'admin') {
            throw new ApiErrors('Accès non autorisé', 403);
        }

        if (!comment) {
            throw new ApiErrors('Un commentaire est requis pour refuser un article', 400);
        }

        const article = await journalModel.rejectArticle(id, user.id, comment);

        if (!article) {
            throw new ApiErrors('Article non trouvé', 404);
        }

        res.json({
            success: true,
            message: 'Article refusé avec succès',
            data: article
        });
    } catch (error) {
        if (error instanceof ApiErrors) {
            res.status(error.status).json({
                success: false,
                message: error.message
            });
        } else {
            console.error('Erreur lors du refus:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur lors du refus'
            });
        }
    }
};

// Récupérer les statistiques par statut (admin uniquement)
export const getStatsByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const user = (req as any).user;
        
        if (user.role !== 'admin') {
            throw new ApiErrors('Accès non autorisé', 403);
        }

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