import { Request, Response } from 'express';
import { UserModel, User } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';

// Récupérer tous les utilisateurs (admin seulement)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await UserModel.findAll();

        // Supprimer les mots de passe de la réponse
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
};

// Récupérer tous les utilisateurs avec leurs informations de quartier (admin seulement)
export const getAllUsersWithQuartier = async (req: Request, res: Response) => {
    try {
        const users = await UserModel.findAllWithQuartier();

        // Supprimer les mots de passe de la réponse
        const usersWithoutPasswords = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs avec quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs avec quartier.' });
    }
};

// Récupérer un utilisateur par ID
export const getUserById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à accéder à ces informations
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres informations.' });
        }

        const user = await UserModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Supprimer le mot de passe de la réponse
        const { password, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
    }
};

// Mettre à jour un utilisateur
export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres informations.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Extraire les données à mettre à jour
        const {
            nom, prenom, email, password, adresse,
            date_naissance, telephone, quartier_id, role
        } = req.body;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== existingUser.email) {
            const userWithEmail = await UserModel.findByEmail(email);
            if (userWithEmail && userWithEmail.id !== id) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre utilisateur.' });
            }
        }

        // Seul un admin peut changer le rôle d'un utilisateur
        if (role !== undefined && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seul un administrateur peut modifier le rôle d\'un utilisateur.' });
        }

        // Préparer les données à mettre à jour
        const userData: Partial<User> = {};

        if (nom !== undefined) userData.nom = nom;
        if (prenom !== undefined) userData.prenom = prenom;
        if (email !== undefined) userData.email = email;
        if (password !== undefined) userData.password = password;
        if (adresse !== undefined) userData.adresse = adresse;
        if (date_naissance !== undefined) userData.date_naissance = date_naissance ? new Date(date_naissance) : undefined;
        if (telephone !== undefined) userData.telephone = telephone;
        if (quartier_id !== undefined) userData.quartier_id = quartier_id;
        if (role !== undefined && req.user.role === 'admin') userData.role = role;

        // Mettre à jour l'utilisateur
        const success = await UserModel.update(id, userData);

        if (!success) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur.' });
        }

        // Récupérer l'utilisateur mis à jour
        const updatedUser = await UserModel.findById(id);

        // Supprimer le mot de passe de la réponse
        const { password: _, ...userWithoutPassword } = updatedUser!;

        res.status(200).json({
            message: 'Utilisateur mis à jour avec succès',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
    }
};

// Supprimer un utilisateur
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à supprimer ce compte
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez supprimer que votre propre compte.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Révoquer tous les tokens de l'utilisateur
        await TokenModel.revokeAllUserTokens(id);

        // Supprimer l'utilisateur
        const success = await UserModel.delete(id);

        if (!success) {
            return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur.' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
};

export default {
    getAllUsers,
    getAllUsersWithQuartier,
    getUserById,
    updateUser,
    deleteUser
};
