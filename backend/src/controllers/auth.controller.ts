import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';
import jwtConfig from '../config/jwt.js';
import { promisify } from 'util';
import { ApiErrors } from "../errors/ApiErrors.js";
import { GeoService } from '../services/geo.service.js';
import pool from "../config/db.js";

const verifyJwt = promisify(jwt.verify.bind(jwt));

// Wrapper async pour éviter de répéter try/catch partout
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Générer les tokens JWT
const generateTokens = (userId: number) => {
    const accessToken = jwt.sign(
        { userId },
        jwtConfig.accessToken.secret,
        { expiresIn: jwtConfig.accessToken.expiresIn } as SignOptions
    );

    const refreshToken = jwt.sign(
        { userId },
        jwtConfig.refreshToken.secret,
        { expiresIn: jwtConfig.refreshToken.expiresIn } as SignOptions
    );

    return { accessToken, refreshToken };
};

// Calculer la date d'expiration du token de rafraîchissement
const calculateExpiryDate = (): Date => {
    const expiresIn = jwtConfig.refreshToken.expiresIn;
    const expiryDate = new Date();

    if (typeof expiresIn === 'string') {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));

        switch (unit) {
            case 'd':
                expiryDate.setDate(expiryDate.getDate() + value);
                break;
            case 'h':
                expiryDate.setHours(expiryDate.getHours() + value);
                break;
            case 'm':
                expiryDate.setMinutes(expiryDate.getMinutes() + value);
                break;
            default:
                expiryDate.setDate(expiryDate.getDate() + 7);
        }
    } else if (typeof expiresIn === 'number') {
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    } else {
        expiryDate.setDate(expiryDate.getDate() + 7);
    }

    return expiryDate;
};

export const register = asyncHandler(async (req: Request, res: Response) => {
    const {
        nom, prenom, email, password,
        adresse, latitude, longitude,
        date_naissance, telephone, quartier_id
    } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
        throw new ApiErrors('Cet email est déjà utilisé.', 409);
    }

    // Déterminer le quartier en fonction des coordonnées géographiques
    let finalQuartierId = quartier_id;
    let quartierInfo = null;

    // Si des coordonnées sont fournies et qu'aucun quartier n'est spécifié, essayer de trouver le quartier
    if (latitude && longitude && !quartier_id) {
        try {
            // Vérifier que les coordonnées sont valides
            const lon = parseFloat(String(longitude));
            const lat = parseFloat(String(latitude));

            if (isNaN(lon) || isNaN(lat)) {
                console.warn(`Coordonnées invalides lors de l'inscription: longitude=${longitude}, latitude=${latitude}`);
            } else {
                console.log(`Recherche de quartier pour les coordonnées: longitude=${lon}, latitude=${lat}`);
                const quartier = await GeoService.findQuartierByCoordinates(lon, lat);

                if (quartier) {
                    console.log(`Quartier trouvé:`, JSON.stringify(quartier, null, 2));
                    finalQuartierId = quartier.id;
                    quartierInfo = {
                        id: quartier.id,
                        nom: quartier.nom_quartier,
                        ville: quartier.ville,
                        code_postal: quartier.code_postal
                    };
                } else {
                    console.log(`Aucun quartier trouvé pour les coordonnées: longitude=${lon}, latitude=${lat}`);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la recherche du quartier par coordonnées:', error);
            // On continue l'inscription même si la recherche de quartier échoue
        }
    }

    const userData: User = {
        nom,
        prenom,
        email,
        password,
        adresse,
        date_naissance: date_naissance ? new Date(date_naissance) : undefined,
        telephone,
        quartier_id: finalQuartierId
    };

    const userId = await UserModel.create(userData);

    const { accessToken, refreshToken } = generateTokens(userId);

    await TokenModel.create({
        user_id: userId,
        token: refreshToken,
        expires_at: calculateExpiryDate()
    });

    res.status(201).json({
        message: 'Utilisateur créé avec succès',
        accessToken,
        refreshToken,
        user: {
            id: userId,
            nom,
            prenom,
            email,
            quartier_id: finalQuartierId
        },
        quartierInfo: quartierInfo,
        quartierFound: !!quartierInfo
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user || !UserModel.verifyPassword(password, user.password!)) {
        throw new ApiErrors('Email ou mot de passe incorrect.', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user.id!);

    await TokenModel.create({
        user_id: user.id!,
        token: refreshToken,
        expires_at: calculateExpiryDate()
    });

    res.status(200).json({
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            quartier_id: user.quartier_id
        }
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new ApiErrors('Token de rafraîchissement requis.', 400);
    }

    const tokenRecord = await TokenModel.findByToken(refreshToken);
    if (!tokenRecord) {
        throw new ApiErrors('Token de rafraîchissement invalide ou révoqué.', 403);
    }

    if (new Date() > new Date(tokenRecord.expires_at)) {
        await TokenModel.revokeToken(refreshToken);
        throw new ApiErrors('Token de rafraîchissement expiré.', 403);
    }

    let decoded: any;
    try {
        decoded = await verifyJwt(refreshToken, jwtConfig.refreshToken.secret);
    } catch {
        await TokenModel.revokeToken(refreshToken);
        throw new ApiErrors('Token de rafraîchissement invalide.', 403);
    }

    const userId = decoded.userId;
    const user = await UserModel.findById(userId);
    if (!user) {
        await TokenModel.revokeToken(refreshToken);
        throw new ApiErrors('Utilisateur non trouvé.', 404);
    }

    const newAccessToken = jwt.sign(
        { userId },
        jwtConfig.accessToken.secret,
        { expiresIn: jwtConfig.accessToken.expiresIn } as SignOptions
    );

    res.status(200).json({ accessToken: newAccessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new ApiErrors('Token de rafraîchissement requis.', 400);
    }

    await TokenModel.revokeToken(refreshToken);

    res.status(200).json({ message: 'Déconnexion réussie.' });
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new ApiErrors('Utilisateur non authentifié.', 401);
    }

    const { password, ...userWithoutPassword } = user;
    res.status(200).json(userWithoutPassword);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
    try {
        const [users, quartiers, events] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM "Utilisateur"'),
            pool.query('SELECT COUNT(*) FROM "Quartier"'),
            pool.query('SELECT COUNT(*) FROM "Evenement"')
        ]);

        res.json({
            totalUsers: parseInt(users.rows[0].count),
            totalQuartiers: parseInt(quartiers.rows[0].count),
            totalEvents: parseInt(events.rows[0].count)
        });
    } catch (error) {
        console.error('Erreur API /stats:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
    }
});

export default {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    getStats
};
