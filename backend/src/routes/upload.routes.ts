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

// Route pour l'upload d'une seule image
router.post('/image', upload.single('image'), handleMulterError, handleImageUpload);

// Route pour l'upload de plusieurs images (max 5)
router.post('/images', upload.array('images', 5), handleMulterError, handleMultipleImageUpload);

// Route de test sans authentification
router.post('/test', upload.single('image'), handleMulterError, handleImageUpload);

// Route pour supprimer une image
router.delete('/image/:filename', deleteImage);

export default router;
