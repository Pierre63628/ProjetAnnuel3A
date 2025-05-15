import { Request, Response, NextFunction } from 'express';
import { validationResult, body } from 'express-validator';

// Middleware pour vérifier les erreurs de validation
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
    }
    next();
};

// Règles de validation pour l'inscription
export const registerValidationRules = [
    body('nom').notEmpty().withMessage('Le nom est requis'),
    body('prenom').notEmpty().withMessage('Le prénom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/[A-Z]/)
        .withMessage('Le mot de passe doit contenir au moins une majuscule')
        .matches(/[a-z]/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule')
        .matches(/[0-9]/)
        .withMessage('Le mot de passe doit contenir au moins un chiffre')
        .matches(/[\W_]/)
        .withMessage('Le mot de passe doit contenir au moins un caractère spécial'),
    body('adresse').notEmpty().withMessage('L\'adresse est requise pour une application de quartier'),
    body('telephone')
        .optional()
        .matches(/^[0-9]{10}$/)
        .withMessage('Le numéro de téléphone doit contenir 10 chiffres'),
    body('date_naissance')
        .optional()
        .isISO8601()
        .withMessage('La date de naissance doit être au format YYYY-MM-DD')
];

// Règles de validation pour la connexion
export const loginValidationRules = [
    body('email').isEmail().withMessage('Email invalide'),
    body('password').notEmpty().withMessage('Le mot de passe est requis')
];

export default {
    validateRequest,
    registerValidationRules,
    loginValidationRules
};
