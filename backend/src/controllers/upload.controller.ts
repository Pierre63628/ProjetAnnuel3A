import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dans Docker, le volume est monté sur /app/uploads
        const uploadDir = '/app/uploads/images';
        console.log('=== MULTER STORAGE ===');
        console.log('Current working directory:', process.cwd());
        console.log('Upload directory (Docker):', uploadDir);
        console.log('Directory exists:', fs.existsSync(uploadDir));
        
        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('Directory created successfully');
        }
        
        console.log('Using directory:', uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Générer un nom de fichier unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
        console.log('Generated filename:', filename);
        cb(null, filename);
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req: any, file: any, cb: any) => {
    console.log('=== MULTER FILE FILTER ===');
    console.log('File filter - mimetype:', file.mimetype);
    console.log('File filter - originalname:', file.originalname);
    console.log('File filter - fieldname:', file.fieldname);
    console.log('File filter - size:', file.size);

    // Vérifier si c'est une image
    if (file.mimetype && file.mimetype.startsWith('image/')) {
        console.log('File filter - ACCEPTED: valid image type');
        cb(null, true);
    } else {
        console.log('File filter - REJECTED: mimetype not allowed:', file.mimetype);
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
        console.log('=== BACKEND UPLOAD: Début handleImageUpload ===');
        console.log('Headers:', req.headers);
        console.log('User:', req.user);
        console.log('File:', req.file);
        console.log('Body:', req.body);
        
        if (!req.file) {
            console.log('Upload failed: No file provided in request');
            res.status(400).json({ message: 'Aucun fichier fourni' });
            return;
        }

        // Vérifier si le fichier a été réellement sauvegardé
        const expectedPath = path.join('/app/uploads', 'images', req.file.filename);
        console.log('BACKEND UPLOAD: Vérification du fichier sauvegardé');
        console.log('BACKEND UPLOAD: Chemin attendu:', expectedPath);
        console.log('BACKEND UPLOAD: Fichier existe:', fs.existsSync(expectedPath));
        
        if (fs.existsSync(expectedPath)) {
            const stats = fs.statSync(expectedPath);
            console.log('BACKEND UPLOAD: Taille du fichier:', stats.size);
        } else {
            console.log('BACKEND UPLOAD: ERREUR - Le fichier n\'existe pas sur le disque !');
        }

        // Construire l'URL de l'image - utiliser une URL relative qui sera servie par le frontend
        const imageUrl = `/uploads/images/${req.file.filename}`;

        console.log('Image uploaded successfully:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            imageUrl: imageUrl
        });

        const response = {
            message: 'Image uploadée avec succès',
            imageUrl: imageUrl,
            filename: req.file.filename
        };

        console.log('BACKEND UPLOAD: Envoi de la réponse:', response);
        res.status(200).json(response);
        console.log('BACKEND UPLOAD: Réponse envoyée avec succès');
    } catch (error) {
        console.error('BACKEND UPLOAD: Erreur détaillée:', error);
        console.error('BACKEND UPLOAD: Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
        res.status(500).json({ 
            message: 'Erreur lors de l\'upload de l\'image',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
        });
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

        const imagePath = path.join('/app/uploads', 'images', filename);

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
