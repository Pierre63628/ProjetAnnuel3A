import express from 'express';
import { handleImageUpload, handleMultipleImageUpload, deleteImage, upload } from '../controllers/upload.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Middleware pour gérer les erreurs multer
const handleMulterError = (err: any, req: any, res: any, next: any) => {
    if (err) {
        console.error('Erreur multer:', err);
        return res.status(400).json({ message: err.message || 'Erreur lors de l\'upload' });
    }
    next();
};

// Route pour l'upload d'une seule image (avec authentification)
router.post('/image', authenticateJWT, upload.single('image'), handleMulterError, handleImageUpload);

// Route pour l'upload de plusieurs images (max 5) (avec authentification)
router.post('/images', authenticateJWT, upload.array('images', 5), handleMulterError, handleMultipleImageUpload);

// Route de test sans authentification
router.post('/test', upload.single('image'), handleMulterError, handleImageUpload);

// Route de test simple pour vérifier que le serveur répond
router.get('/test', (req, res) => {
    res.json({ message: 'Upload service is working' });
});

// Route pour supprimer une image (avec authentification)
router.delete('/image/:filename', authenticateJWT, deleteImage);

export default router;
