import express from 'express';
import evenementController from '../controllers/evenement.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get('/', evenementController.getAllEvenements);

router.get('/upcoming', evenementController.getUpcomingEvenements);

router.get('/past', evenementController.getPastEvenements);

router.get('/quartier/:quartierId', evenementController.getEvenementsByQuartier);

router.get('/:id', evenementController.getEvenementById);

router.get('/search', evenementController.searchEvenements);

router.get('/organisateur/:organisateurId', authenticateJWT, evenementController.getEvenementsByOrganisateur);

router.post('/', authenticateJWT, evenementController.createEvenement);

router.put('/:id', authenticateJWT, evenementController.updateEvenement);

router.delete('/:id', authenticateJWT, evenementController.deleteEvenement);

router.get('/:id/participants', authenticateJWT, evenementController.getEvenementParticipants);

router.post('/:id/participate', authenticateJWT, evenementController.participateToEvenement);

router.delete('/:id/participate', authenticateJWT, evenementController.cancelParticipation);

router.get('/:id/check-participation', authenticateJWT, evenementController.checkParticipation);

export default router;
