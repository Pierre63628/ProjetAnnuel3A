import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';
import jwtConfig from '../config/jwt.js';

// Générer les tokens JWT
const generateTokens = (userId: number) => {
    // Token d'accès (courte durée)
    const accessToken = jwt.sign(
        { userId },
        jwtConfig.accessToken.secret,
        { expiresIn: jwtConfig.accessToken.expiresIn }
    );

    // Token de rafraîchissement (longue durée)
    const refreshToken = jwt.sign(
        { userId },
        jwtConfig.refreshToken.secret,
        { expiresIn: jwtConfig.refreshToken.expiresIn }
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
            case 'd': // jours
                expiryDate.setDate(expiryDate.getDate() + value);
                break;
            case 'h': // heures
                expiryDate.setHours(expiryDate.getHours() + value);
                break;
            case 'm': // minutes
                expiryDate.setMinutes(expiryDate.getMinutes() + value);
                break;
            default:
                // Par défaut, 7 jours
                expiryDate.setDate(expiryDate.getDate() + 7);
        }
    } else if (typeof expiresIn === 'number') {
        // Si c'est un nombre (en secondes)
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    } else {
        // Par défaut, 7 jours
        expiryDate.setDate(expiryDate.getDate() + 7);
    }

    return expiryDate;
};

export const register = async (req: Request, res: Response) => {
    try {
        const { nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id } = req.body;

        // Vérifier si l'email existe déjà
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Créer le nouvel utilisateur
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

        // Générer les tokens
        const { accessToken, refreshToken } = generateTokens(userId);

        // Sauvegarder le token de rafraîchissement dans la base de données
        await TokenModel.create({
            user_id: userId,
            token: refreshToken,
            expires_at: calculateExpiryDate()
        });

        // Retourner les tokens et les informations de l'utilisateur
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
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
};

// Connexion d'un utilisateur
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Vérifier le mot de passe
        const isPasswordValid = UserModel.verifyPassword(password, user.password!);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        // Générer les tokens
        const { accessToken, refreshToken } = generateTokens(user.id!);

        // Sauvegarder le token de rafraîchissement dans la base de données
        await TokenModel.create({
            user_id: user.id!,
            token: refreshToken,
            expires_at: calculateExpiryDate()
        });

        // Retourner les tokens et les informations de l'utilisateur
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
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
};

// Rafraîchir le token d'accès
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Token de rafraîchissement requis.' });
        }

        // Vérifier si le token existe dans la base de données
        const tokenRecord = await TokenModel.findByToken(refreshToken);
        if (!tokenRecord) {
            return res.status(403).json({ message: 'Token de rafraîchissement invalide ou révoqué.' });
        }

        // Vérifier si le token est expiré
        if (new Date() > new Date(tokenRecord.expires_at)) {
            await TokenModel.revokeToken(refreshToken);
            return res.status(403).json({ message: 'Token de rafraîchissement expiré.' });
        }

        // Vérifier la validité du token
        jwt.verify(refreshToken, jwtConfig.refreshToken.secret, async (err: any, decoded: any) => {
            if (err) {
                await TokenModel.revokeToken(refreshToken);
                return res.status(403).json({ message: 'Token de rafraîchissement invalide.' });
            }

            const userId = decoded.userId;

            // Vérifier si l'utilisateur existe toujours
            const user = await UserModel.findById(userId);
            if (!user) {
                await TokenModel.revokeToken(refreshToken);
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            // Générer un nouveau token d'accès
            const newAccessToken = jwt.sign(
                { userId },
                jwtConfig.accessToken.secret,
                { expiresIn: jwtConfig.accessToken.expiresIn }
            );

            // Retourner le nouveau token d'accès
            res.status(200).json({
                accessToken: newAccessToken
            });
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        res.status(500).json({ message: 'Erreur serveur lors du rafraîchissement du token.' });
    }
};

// Déconnexion d'un utilisateur
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Token de rafraîchissement requis.' });
        }

        // Révoquer le token de rafraîchissement
        await TokenModel.revokeToken(refreshToken);

        res.status(200).json({ message: 'Déconnexion réussie.' });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la déconnexion.' });
    }
};

// Obtenir les informations de l'utilisateur connecté
export const getMe = async (req: Request, res: Response) => {
    try {
        // L'utilisateur est déjà attaché à la requête par le middleware authenticateJWT
        const user = req.user;

        // Supprimer le mot de passe de la réponse
        const { password, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des informations utilisateur.' });
    }
};

export default {
    register,
    login,
    refreshToken,
    logout,
    getMe
};
