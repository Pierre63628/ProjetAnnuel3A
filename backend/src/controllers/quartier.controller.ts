import { Request, Response } from 'express';
import { QuartierModel, Quartier } from '../models/quartier.model.js';
import { GeoService } from '../services/geo.service.js';
import { UtilisateurQuartierModel } from '../models/utilisateur-quartier.model.js';

// Récupérer tous les quartiers
export const getAllQuartiers = async (req: Request, res: Response) => {
    try {
        console.log('Controller: Getting all quartiers');
        const quartiers = await QuartierModel.findAll();
        console.log(`Controller: Found ${quartiers.length} quartiers`);
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers.' });
    }
};

// Récupérer les quartiers par ville
export const getQuartiersByVille = async (req: Request, res: Response) => {
    try {
        const ville = req.params.ville;
        const quartiers = await QuartierModel.findByVille(ville);
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers par ville:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers par ville.' });
    }
};

// Récupérer un quartier par ID
export const getQuartierById = async (req: Request, res: Response) => {
    try {
        const idParam = req.params.id;

        // Vérifier que l'ID est un nombre valide
        const id = parseInt(idParam);
        if (isNaN(id)) {
            return res.status(400).json({
                message: `L'ID du quartier doit être un nombre valide, reçu: ${idParam}`
            });
        }

        const quartier = await QuartierModel.findById(id);

        if (!quartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        res.status(200).json(quartier);
    } catch (error) {
        console.error('Erreur lors de la récupération du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du quartier.' });
    }
};

// Créer un nouveau quartier
export const createQuartier = async (req: Request, res: Response) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent créer des quartiers.' });
        }

        const { nom_quartier, ville, code_postal, description } = req.body;

        // Validation des données
        if (!nom_quartier) {
            return res.status(400).json({ message: 'Le nom du quartier est obligatoire.' });
        }

        const quartierData: Quartier = {
            nom_quartier,
            ville,
            code_postal,
            description
        };

        const id = await QuartierModel.create(quartierData);
        const newQuartier = await QuartierModel.findById(id);

        res.status(201).json(newQuartier);
    } catch (error) {
        console.error('Erreur lors de la création du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création du quartier.' });
    }
};

// Mettre à jour un quartier
export const updateQuartier = async (req: Request, res: Response) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent modifier des quartiers.' });
        }

        const id = parseInt(req.params.id);
        const { nom_quartier, ville, code_postal, description } = req.body;

        // Vérifier si le quartier existe
        const existingQuartier = await QuartierModel.findById(id);
        if (!existingQuartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        // Préparer les données à mettre à jour
        const quartierData: Partial<Quartier> = {};

        if (nom_quartier !== undefined) quartierData.nom_quartier = nom_quartier;
        if (ville !== undefined) quartierData.ville = ville;
        if (code_postal !== undefined) quartierData.code_postal = code_postal;
        if (description !== undefined) quartierData.description = description;

        // Mettre à jour le quartier
        const success = await QuartierModel.update(id, quartierData);

        if (!success) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour du quartier.' });
        }

        // Récupérer le quartier mis à jour
        const updatedQuartier = await QuartierModel.findById(id);
        res.status(200).json(updatedQuartier);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du quartier.' });
    }
};

// Supprimer un quartier
export const deleteQuartier = async (req: Request, res: Response) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent supprimer des quartiers.' });
        }

        const id = parseInt(req.params.id);

        // Vérifier si le quartier existe
        const existingQuartier = await QuartierModel.findById(id);
        if (!existingQuartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        try {
            // Essayer de supprimer le quartier
            const success = await QuartierModel.delete(id);
            if (success) {
                return res.status(200).json({ message: 'Quartier supprimé avec succès.' });
            } else {
                return res.status(500).json({ message: 'Erreur lors de la suppression du quartier.' });
            }
        } catch (deleteError: any) {
            // Si la suppression échoue à cause des utilisateurs rattachés, proposer la désactivation
            if (deleteError.message && (deleteError.message.includes('utilisateurs y sont rattachés'))) {
                return res.status(400).json({
                    message: deleteError.message,
                    suggestion: 'Vous pouvez désactiver ce quartier au lieu de le supprimer.'
                });
            }
            throw deleteError;
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du quartier.' });
    }
};



// Rechercher des quartiers
export const searchQuartiers = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;

        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Le paramètre de recherche est obligatoire.' });
        }

        const quartiers = await QuartierModel.search(query);
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la recherche de quartiers:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la recherche de quartiers.' });
    }
};

// Récupérer les utilisateurs d'un quartier
export const getQuartierUsers = async (req: Request, res: Response) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent voir tous les utilisateurs d\'un quartier.' });
        }

        const id = parseInt(req.params.id);

        // Vérifier si le quartier existe
        const existingQuartier = await QuartierModel.findById(id);
        if (!existingQuartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        const users = await UtilisateurQuartierModel.findByQuartierId(id);
        res.status(200).json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs du quartier.' });
    }
};

// Rechercher un quartier par coordonnées géographiques
export const findQuartierByCoordinates = async (req: Request, res: Response) => {
    try {
        const { longitude, latitude } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                message: 'Les coordonnées (longitude et latitude) sont requises',
                quartierFound: false
            });
        }

        // Convertir les coordonnées en nombres et vérifier qu'elles sont valides
        const lon = parseFloat(longitude as string);
        const lat = parseFloat(latitude as string);

        if (isNaN(lon) || isNaN(lat)) {
            console.warn(`Coordonnées invalides reçues: longitude=${longitude}, latitude=${latitude}`);
            return res.status(400).json({
                message: 'Les coordonnées doivent être des nombres valides',
                quartierFound: false
            });
        }

        console.log(`Recherche de quartier pour les coordonnées: longitude=${lon}, latitude=${lat}`);

        // Rechercher le quartier
        const quartier = await GeoService.findQuartierByCoordinates(lon, lat);

        if (!quartier) {
            console.log(`Aucun quartier trouvé pour les coordonnées: longitude=${lon}, latitude=${lat}`);
            return res.status(404).json({
                message: 'Aucun quartier trouvé pour ces coordonnées',
                quartierFound: false
            });
        }

        console.log(`Quartier trouvé:`, JSON.stringify(quartier, null, 2));

        res.status(200).json({
            quartier,
            quartierFound: true,
        });
    } catch (error) {
        console.error('Erreur lors de la recherche du quartier par coordonnées:', error);
        res.status(500).json({
            message: 'Erreur serveur lors de la recherche du quartier',
            quartierFound: false
        });
    }
};

export default {
    getAllQuartiers,
    getQuartiersByVille,
    getQuartierById,
    createQuartier,
    updateQuartier,
    deleteQuartier,
    searchQuartiers,
    getQuartierUsers,
    findQuartierByCoordinates
};
