import express from 'express';
import quartierController from '../controllers/quartier.controller';

const router = express.Router();

// Route pour récupérer tous les quartiers
router.get('/', quartierController.getAllQuartiers);

// Route pour récupérer un quartier par ID
router.get('/:id', quartierController.getQuartierById);

export default router;
