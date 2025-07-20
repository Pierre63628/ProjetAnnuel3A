import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import { UserModel } from '../models/user.model.js';

declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }

        const token = authHeader.split(' ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant ou invalide.' });
        }

        // Use async/await instead of callback for better error handling
        try {
            const decoded = jwt.verify(token, jwtConfig.accessToken.secret) as any;

            if (!decoded || !decoded.userId) {
                return res.status(403).json({ message: 'Token invalide - données manquantes.' });
            }

            // Le token contient userId, pas decoded.userId
            const userId = decoded.userId;

            if (!userId) {
                return res.status(403).json({ message: 'Token invalide - userId manquant.' });
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            req.user = user;
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(403).json({ message: 'Token invalide ou expiré.' });
        }
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de l\'authentification.' });
    }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Accès refusé. Droits d\'administrateur requis.' });
    }
};

export default { authenticateJWT, isAdmin };
