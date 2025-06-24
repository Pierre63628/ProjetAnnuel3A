import express from 'express';
import {
    createTroc,
    getTrocByUserQuartier,
    getUserTrocs,
    updateTroc,
    deleteTroc,
    removeTrocImage,
    adminGetAllTrocs,
    adminUpdateTrocStatus,
    adminGetTrocStats
} from '../controllers/troc.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route de test simple
router.get('/test', (req, res) => {
    res.json({ message: 'Troc routes working!' });
});

// Routes pour les annonces de troc
router.post('/', authenticateJWT, createTroc);
router.get('/', authenticateJWT, getTrocByUserQuartier); // Requires auth to know user's neighborhood
router.get('/my-trocs', authenticateJWT, getUserTrocs);
router.put('/:id', authenticateJWT, updateTroc);
router.delete('/:id', authenticateJWT, deleteTroc);
router.delete('/:id/image', authenticateJWT, removeTrocImage);

// Routes admin
router.get('/admin/all', authenticateJWT, isAdmin, adminGetAllTrocs);
router.patch('/admin/:id/status', authenticateJWT, isAdmin, adminUpdateTrocStatus);
router.get('/admin/stats', authenticateJWT, isAdmin, adminGetTrocStats);

export default router;
