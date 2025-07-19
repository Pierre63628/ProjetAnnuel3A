import express from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import {
    getMyArticles,
    getArticleForEdit,
    createArticle,
    updateArticle,
    deleteArticle,
    getMyArticleStats,
    toggleArticleVisibility,
    validateCreateArticle,
    validateUpdateArticle,
    getPendingValidation,
    validateArticle,
    rejectArticle,
    getStatsByStatus
} from '../controllers/article-generation.controller.js';

const router = express.Router();

// Routes pour la génération d'articles (nécessitent une authentification)
router.get('/my-articles', authenticateJWT, getMyArticles);
router.get('/my-stats', authenticateJWT, getMyArticleStats);
router.get('/edit/:id', authenticateJWT, getArticleForEdit);
router.post('/', authenticateJWT, validateCreateArticle, createArticle);
router.put('/:id', authenticateJWT, validateUpdateArticle, updateArticle);
router.delete('/:id', authenticateJWT, deleteArticle);
router.patch('/:id/toggle-visibility', authenticateJWT, toggleArticleVisibility);

// Routes admin pour la validation des articles
router.get('/pending-validation', authenticateJWT, getPendingValidation);
router.get('/stats-by-status', authenticateJWT, getStatsByStatus);
router.patch('/:id/validate', authenticateJWT, validateArticle);
router.patch('/:id/reject', authenticateJWT, rejectArticle);

export default router; 