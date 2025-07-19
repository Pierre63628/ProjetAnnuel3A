import { Request, Response } from 'express';
import { UtilisateurQuartierModel, UtilisateurQuartier } from '../models/utilisateur-quartier.model.js';
import { UserModel } from '../models/user.model.js';
import { QuartierModel } from '../models/quartier.model.js';

// Récupérer tous les quartiers d'un utilisateur
export const getUserQuartiers = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log(`Backend: Getting quartiers for user ${userId}`);

        // Vérifier si l'utilisateur est autorisé à voir ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            console.log(`Backend: Access denied for user ${req.user.id} trying to access quartiers of user ${userId}`);
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez voir que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            console.log(`Backend: User ${userId} not found`);
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const quartiers = await UtilisateurQuartierModel.findByUserId(userId);
        console.log(`Backend: Found ${quartiers.length} quartiers for user ${userId}:`, quartiers);
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers de l\'utilisateur.' });
    }
};

// Récupérer le quartier principal d'un utilisateur
export const getUserPrincipalQuartier = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);

        // Vérifier si l'utilisateur est autorisé à voir ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez voir que votre propre quartier principal.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const quartier = await UtilisateurQuartierModel.findPrincipalByUserId(userId);

        if (!quartier) {
            return res.status(404).json({ message: 'Aucun quartier principal trouvé pour cet utilisateur.' });
        }

        res.status(200).json(quartier);
    } catch (error) {
        console.error('Erreur lors de la récupération du quartier principal de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du quartier principal de l\'utilisateur.' });
    }
};

// Ajouter un quartier à un utilisateur
export const addQuartierToUser = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        const { quartier_id, est_principal } = req.body;

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si le quartier existe
        const existingQuartier = await QuartierModel.findById(quartier_id);
        if (!existingQuartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }



        // Ajouter le quartier à l'utilisateur
        const data: UtilisateurQuartier = {
            utilisateur_id: userId,
            quartier_id,
            est_principal: est_principal || false,
            statut: 'actif'
        };

        const id = await UtilisateurQuartierModel.create(data);

        // Si c'est le quartier principal, mettre à jour le quartier_id dans la table Utilisateur
        if (est_principal) {
            await UserModel.update(userId, { quartier_id });
        }

        res.status(201).json({
            message: 'Quartier ajouté avec succès à l\'utilisateur.',
            id
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du quartier à l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du quartier à l\'utilisateur.' });
    }
};

// Définir un quartier comme principal pour un utilisateur
export const setQuartierAsPrincipal = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        const quartierId = parseInt(req.params.quartierId);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await UserModel.findById(userId);
        if (!existingUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si le quartier existe
        const existingQuartier = await QuartierModel.findById(quartierId);
        if (!existingQuartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }



        // Définir le quartier comme principal
        await UtilisateurQuartierModel.setAsPrincipal(userId, quartierId);

        res.status(200).json({ message: 'Quartier défini comme principal avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la définition du quartier comme principal:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la définition du quartier comme principal.' });
    }
};

// Supprimer un quartier d'un utilisateur
export const removeQuartierFromUser = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.userId);
        const relationId = parseInt(req.params.relationId);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si la relation existe et appartient bien à cet utilisateur
        const relations = await UtilisateurQuartierModel.findByUserId(userId);
        const relation = relations.find(r => r.id === relationId);

        if (!relation) {
            return res.status(404).json({ message: 'Relation non trouvée ou n\'appartenant pas à cet utilisateur.' });
        }

        // Vérifier si c'est le quartier principal
        if (relation.est_principal) {
            return res.status(400).json({
                message: 'Vous ne pouvez pas supprimer votre quartier principal.',
                suggestion: 'Définissez d\'abord un autre quartier comme principal.'
            });
        }

        // Supprimer la relation
        const success = await UtilisateurQuartierModel.delete(relationId);

        if (!success) {
            return res.status(500).json({ message: 'Erreur lors de la suppression du quartier.' });
        }

        res.status(200).json({ message: 'Quartier supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du quartier.' });
    }
};

export default {
    getUserQuartiers,
    getUserPrincipalQuartier,
    addQuartierToUser,
    setQuartierAsPrincipal,
    removeQuartierFromUser
};
