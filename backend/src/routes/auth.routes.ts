import express from 'express';
import authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { validateRequest, registerValidationRules, loginValidationRules } from '../middlewares/validation.middleware';

const router = express.Router();

// Route d'inscription
router.post('/register', registerValidationRules, validateRequest, authController.register);

// Route de connexion
router.post('/login', loginValidationRules, validateRequest, authController.login);

// Route de rafraîchissement du token
router.post('/refresh-token', authController.refreshToken);

// Route de déconnexion
router.post('/logout', authController.logout);

// Route pour obtenir les informations de l'utilisateur connecté
router.get('/me', authenticateJWT, authController.getMe);

export default router;
