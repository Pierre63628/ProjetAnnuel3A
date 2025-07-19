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
        console.log('🔐 === DÉBUT authenticateJWT ===');
        console.log('URL:', req.url);
        console.log('Method:', req.method);
        console.log('Headers:', req.headers);
        
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);

        if (!authHeader) {
            console.log('❌ Pas d\'en-tête Authorization');
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }

        const token = authHeader.split(' ')[1];
        console.log('Token extrait:', token ? 'Présent' : 'Absent');

        if (!token || token === 'null' || token === 'undefined') {
            console.log('❌ Token manquant ou invalide');
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant ou invalide.' });
        }

        // Use async/await instead of callback for better error handling
        try {
            const decoded = jwt.verify(token, jwtConfig.accessToken.secret) as any;
            console.log("✅ Token décodé:", decoded);

            if (!decoded || !decoded.userId) {
                console.log('❌ Token invalide - données manquantes:', decoded);
                return res.status(403).json({ message: 'Token invalide - données manquantes.' });
            }

            // Le token contient userId, pas decoded.userId
            const userId = decoded.userId;
            console.log('User ID extrait:', userId);
            
            if (!userId) {
                console.log('❌ Token invalide - userId manquant');
                return res.status(403).json({ message: 'Token invalide - userId manquant.' });
            }

            const user = await UserModel.findById(userId);
            console.log('Utilisateur trouvé:', user ? 'Oui' : 'Non');
            
            if (!user) {
                console.log('❌ Utilisateur non trouvé pour ID:', userId);
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            req.user = user;
            console.log('✅ Authentification réussie pour user:', user.id);
            next();
        } catch (jwtError) {
            console.error('❌ JWT verification error:', jwtError);
            return res.status(403).json({ message: 'Token invalide ou expiré.' });
        }
    } catch (error) {
        console.error('❌ Erreur d\'authentification:', error);
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
