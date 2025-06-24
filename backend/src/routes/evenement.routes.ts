import express from 'express';
import evenementController, {
    getAllEvenementsByQuartier, getUpcomingEvenement,
    getUpcomingEvenementsByquartier
} from '../controllers/evenement.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get('/', evenementController.getAllEvenements);

router.get('/all/:idQuartier', evenementController.getAllEvenementsByQuartier);

router.get('/upcoming/:idQuartier', evenementController.getUpcomingEvenementsByquartier);

router.get('/past/:idQuartier', evenementController.getPastEvenementsByQuartier);

router.get('/upcoming/', evenementController.getUpcomingEvenement);

router.get('/past', evenementController.getPastEvenements);

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

router.get('/user/my-events', authenticateJWT, evenementController.getUserParticipations);

router.get('/:id/check-participation', authenticateJWT, evenementController.checkParticipation);

export default router;
