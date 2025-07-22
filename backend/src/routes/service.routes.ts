import express from 'express';
import {
    createService,
    getServicesByUserQuartier,
    getServiceById,
    getUserServices,
    updateService,
    deleteService,
    searchServices,
    adminGetAllServices,
    adminUpdateServiceStatus,
    adminGetServiceStats
} from '../controllers/service.controller.js';
import { authenticateJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Route de test simple
router.get('/test', (req, res) => {
    res.json({ message: 'Service routes working!' });
});

// Routes pour les services
router.post('/', authenticateJWT, createService);
router.get('/', authenticateJWT, getServicesByUserQuartier); // Requires auth to know user's neighborhood
router.get('/search', authenticateJWT, searchServices); // Recherche avancée
router.get('/my-services', authenticateJWT, getUserServices);
router.get('/:id', authenticateJWT, getServiceById); // Get single service by ID
router.put('/:id', authenticateJWT, updateService);
router.delete('/:id', authenticateJWT, deleteService);

// Routes admin
router.get('/admin/all', authenticateJWT, isAdmin, adminGetAllServices);
router.patch('/admin/:id/status', authenticateJWT, isAdmin, adminUpdateServiceStatus);
router.get('/admin/stats', authenticateJWT, isAdmin, adminGetServiceStats);

export default router;
