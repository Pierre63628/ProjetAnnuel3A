import { NextFunction, Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';
import jwtConfig from '../config/jwt.js';
import { promisify } from 'util';
import { ApiErrors } from "../errors/ApiErrors.js";

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
    const { nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id } = req.body;

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
        throw new ApiErrors('Cet email est déjà utilisé.', 409);
    }

    const userData: User = {
        nom,
        prenom,
        email,
        password,
        adresse,
        date_naissance: date_naissance ? new Date(date_naissance) : undefined,
        telephone,
        quartier_id
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
            email
        }
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
            role: user.role
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

export default {
    register,
    login,
    refreshToken,
    logout,
    getMe
};
