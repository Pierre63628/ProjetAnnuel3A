import { Request, Response, NextFunction } from 'express';
import { ApiErrors } from '../errors/ApiErrors.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err);

    if (err instanceof ApiErrors) {
        return res.status(err.status).json({ message: err.message });
    }

    // Erreur inconnue
    res.status(500).json({ message: 'Erreur serveur inattendue' });
};
