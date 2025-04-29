import express from 'express';
import quartierController from '../controllers/quartier.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Routes publiques
// Route pour récupérer tous les quartiers
router.get('/', quartierController.getAllQuartiers);

// Route pour récupérer un quartier par ID
router.get('/:id', quartierController.getQuartierById);

// Route pour récupérer les quartiers par ville
router.get('/ville/:ville', quartierController.getQuartiersByVille);

// Route pour rechercher des quartiers
router.get('/search', quartierController.searchQuartiers);

// Routes protégées (admin seulement)

router.post('/', authenticateJWT, isAdmin, quartierController.createQuartier);

router.put('/:id', authenticateJWT, isAdmin, quartierController.updateQuartier);

router.delete('/:id', authenticateJWT, isAdmin, quartierController.deleteQuartier);

router.get('/:id/users', authenticateJWT, isAdmin, quartierController.getQuartierUsers);

export default router;
