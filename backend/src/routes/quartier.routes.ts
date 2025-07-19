import express from 'express';
import quartierController from '../controllers/quartier.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes publiques
// Route pour récupérer tous les quartiers
router.get('/', quartierController.getAllQuartiers);

// Route pour rechercher des quartiers
router.get('/search', quartierController.searchQuartiers);

// Route pour rechercher un quartier par coordonnées
router.get('/coordinates', quartierController.findQuartierByCoordinates);

// Route pour récupérer les quartiers par ville
router.get('/ville/:ville', quartierController.getQuartiersByVille);

// Route pour récupérer un quartier par ID (doit être définie après les routes spécifiques)
router.get('/:id', quartierController.getQuartierById);

// Routes protégées (admin seulement)

router.post('/', authenticateJWT, isAdmin, quartierController.createQuartier);

router.put('/:id', authenticateJWT, isAdmin, quartierController.updateQuartier);

router.delete('/:id', authenticateJWT, isAdmin, quartierController.deleteQuartier);

router.get('/:id/users', authenticateJWT, isAdmin, quartierController.getQuartierUsers);

export default router;
