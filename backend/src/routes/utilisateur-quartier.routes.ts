import express from 'express';
import utilisateurQuartierController from '../controllers/utilisateur-quartier.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route pour récupérer tous les quartiers d'un utilisateur
router.get('/:userId/quartiers', authenticateJWT, utilisateurQuartierController.getUserQuartiers);

// Route pour récupérer le quartier principal d'un utilisateur
router.get('/:userId/quartier-principal', authenticateJWT, utilisateurQuartierController.getUserPrincipalQuartier);

// Route pour ajouter un quartier à un utilisateur
router.post('/:userId/quartiers', authenticateJWT, utilisateurQuartierController.addQuartierToUser);

// Route pour définir un quartier comme principal pour un utilisateur
router.put('/:userId/quartiers/:quartierId/principal', authenticateJWT, utilisateurQuartierController.setQuartierAsPrincipal);

// Route pour supprimer un quartier d'un utilisateur
router.delete('/:userId/quartiers/:relationId', authenticateJWT, utilisateurQuartierController.removeQuartierFromUser);

export default router;
