import express from 'express';
import {
    // Routes publiques
    getPublicArticles,
    getPublicArticleById,
    getPublicArticleStats,
    getValidatedArticles,
    getValidatedArticlesWithoutEdition,
    
    // Routes admin
    getAllArticles,
    getPendingArticles,
    getAdminArticleById,
    validateArticle,
    rejectArticle,
    
    // Routes utilisateur
    getUserArticles,
    getUserArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    submitForValidation,
    getArticleStats,
    
    // Routes journal/édition
    createJournal,
    getEditions,
    getEditionByUUID,
    getArticlesByEdition
} from '../controllers/journal.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// === ROUTES PUBLIQUES (pas d'authentification requise) ===
// Pour la visualisation du journal par tous les visiteurs
router.get('/', getPublicArticles);
router.get('/stats', getPublicArticleStats);

// === ROUTES AVEC AUTHENTIFICATION ===
// Pour les articles validés (authentification requise)
router.get('/validated', authenticateJWT, getValidatedArticles);
// Pour les articles validés sans editionId (authentification requise)
router.get('/validated-without-edition', authenticateJWT, getValidatedArticlesWithoutEdition);

// === ROUTES UTILISATEUR (authentification requise) ===
// Gestion des articles par les utilisateurs connectés
router.get('/user/my-articles', authenticateJWT, getUserArticles);
router.get('/user/stats', authenticateJWT, getArticleStats);
router.post('/user/create', authenticateJWT, createArticle);
router.patch('/user/:id/submit', authenticateJWT, submitForValidation);
router.get('/user/:id', authenticateJWT, getUserArticleById);
router.put('/user/:id', authenticateJWT, updateArticle);
router.delete('/user/:id', authenticateJWT, deleteArticle);

// === ROUTES ADMIN (authentification + rôle admin requis) ===
// Gestion complète des articles par les administrateurs
router.get('/admin/all', authenticateJWT, isAdmin, getAllArticles);
router.get('/admin/pending', authenticateJWT, isAdmin, getPendingArticles);
router.get('/admin/:id', authenticateJWT, isAdmin, getAdminArticleById);
router.patch('/admin/:id/validate', authenticateJWT, isAdmin, validateArticle);
router.patch('/admin/:id/reject', authenticateJWT, isAdmin, rejectArticle);

// === ROUTES POUR LA CRÉATION DE JOURNAUX ===
router.get('/editions', authenticateJWT, getEditions);
router.post('/create-journal', authenticateJWT, isAdmin, createJournal);

// === ROUTES POUR LES ÉDITIONS ===
router.get('/edition/:uuid', authenticateJWT, getEditionByUUID);
router.get('/edition/:uuid/articles', authenticateJWT, getArticlesByEdition);

// === ROUTES AVEC PARAMÈTRES (doivent être en dernier) ===
router.get('/:id', getPublicArticleById);



export default router; 