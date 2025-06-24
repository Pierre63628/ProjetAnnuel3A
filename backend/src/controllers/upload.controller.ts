import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/images';
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req: any, file: any, cb: any) => {
    console.log('File filter - mimetype:', file.mimetype);
    console.log('File filter - originalname:', file.originalname);
    console.log('File filter - fieldname:', file.fieldname);

    // Vérifier si c'est une image
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        console.log('File accepted - valid image type');
        cb(null, true);
    } else {
        console.log('File rejected - mimetype not allowed:', file.mimetype);
        cb(new Error('Seules les images sont autorisées (JPEG, PNG, GIF, WebP, etc.)'), false);
    }
};

// Configuration multer
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Contrôleur pour l'upload d'image
export const handleImageUpload = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            console.log('Upload failed: No file provided in request');
            res.status(400).json({ message: 'Aucun fichier fourni' });
            return;
        }

        // Construire l'URL de l'image - utiliser une URL relative qui sera servie par le frontend
        const imageUrl = `/uploads/images/${req.file.filename}`;

        console.log('Image uploaded successfully:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            imageUrl: imageUrl
        });

        res.status(200).json({
            message: 'Image uploadée avec succès',
            imageUrl: imageUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload de l\'image' });
    }
};

// Contrôleur pour supprimer une image
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { filename } = req.params;

        if (!filename) {
            res.status(400).json({ message: 'Nom de fichier requis' });
            return;
        }

        const imagePath = path.join('uploads/images', filename);

        // Vérifier si le fichier existe
        if (!fs.existsSync(imagePath)) {
            res.status(404).json({ message: 'Image non trouvée' });
            return;
        }

        // Supprimer le fichier
        fs.unlinkSync(imagePath);

        console.log('Image deleted successfully:', filename);
        res.status(200).json({ message: 'Image supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'image' });
    }
};

// Contrôleur pour l'upload de plusieurs images
export const handleMultipleImageUpload = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            res.status(400).json({ message: 'Aucun fichier fourni' });
            return;
        }

        // Construire les URLs des images
        const imageUrls = req.files.map((file: any) => `/uploads/images/${file.filename}`);

        console.log('Multiple images uploaded successfully:', {
            count: req.files.length,
            files: req.files.map((file: any) => ({
                filename: file.filename,
                originalname: file.originalname,
                size: file.size
            })),
            imageUrls: imageUrls
        });

        res.status(200).json({
            message: `${req.files.length} images uploadées avec succès`,
            imageUrls: imageUrls,
            count: req.files.length
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload multiple:', error);
        res.status(500).json({ message: 'Erreur lors de l\'upload des images' });
    }
};

export default {
    handleImageUpload,
    handleMultipleImageUpload,
    deleteImage,
    upload
};
