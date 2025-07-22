import express from 'express';
import userController from '../controllers/user.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route pour récupérer tous les utilisateurs (admin seulement)
router.get('/', authenticateJWT, isAdmin, userController.getAllUsers);

// Route pour récupérer tous les utilisateurs avec leurs quartiers (admin seulement)
router.get('/with-quartier', authenticateJWT, isAdmin, userController.getAllUsersWithQuartier);

// Route pour récupérer un utilisateur par ID
router.get('/:id', authenticateJWT, userController.getUserById);

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticateJWT, userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/:id', authenticateJWT, userController.deleteUser);

export default router;
