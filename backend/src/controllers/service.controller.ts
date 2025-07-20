import { Request, Response } from 'express';
import { ServiceModel, Service } from '../models/service.model.js';
import { UserModel } from '../models/user.model.js';
import pool from '../config/db.js';

interface AuthenticatedRequest extends Request {
    user?: {
        id: number;
        quartier_id: number;
        role: string;
    };
}

export const createService = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = req.user.id;

        const user = await UserModel.findById(utilisateurId);
        if (!user || !user.quartier_id) {
            return res.status(400).json({ message: 'Utilisateur invalide ou non rattaché à un quartier.' });
        }

        const { titre, description, type_service, categorie } = req.body;
        if (!titre || !description || !type_service || !categorie) {
            return res.status(400).json({
                message: 'Les champs titre, description, type_service et categorie sont obligatoires.'
            });
        }

        if (!['offre', 'demande'].includes(type_service)) {
            return res.status(400).json({ message: 'Le type de service doit être "offre" ou "demande".' });
        }

        const dateDebut = req.body.date_debut ? new Date(req.body.date_debut) : null;
        const dateFin = req.body.date_fin ? new Date(req.body.date_fin) : null;

        if (dateDebut && dateFin && dateFin < dateDebut) {
            return res.status(400).json({ message: 'La date de fin ne peut pas être antérieure à la date de début.' });
        }

        const newService: Service = {
            titre,
            description,
            type_service,
            categorie,
            date_debut: dateDebut,
            date_fin: dateFin,
            horaires: req.body.horaires || null,
            recurrence: req.body.recurrence || 'ponctuel',
            prix: req.body.prix ? parseFloat(req.body.prix) : null,
            budget_max: req.body.budget_max ? parseFloat(req.body.budget_max) : null,
            lieu: req.body.lieu || null,
            competences_requises: req.body.competences_requises || null,
            materiel_fourni: req.body.materiel_fourni || false,
            experience_requise: req.body.experience_requise || null,
            age_min: req.body.age_min ? parseInt(req.body.age_min) : null,
            age_max: req.body.age_max ? parseInt(req.body.age_max) : null,
            nombre_personnes: req.body.nombre_personnes ? parseInt(req.body.nombre_personnes) : 1,
            urgence: req.body.urgence || 'normale',
            contact_info: req.body.contact_info || null,
            date_publication: new Date(),
            utilisateur_id: utilisateurId,
            quartier_id: user.quartier_id,
            statut: 'active'
        };

        const serviceId = await ServiceModel.create(newService);
        const createdService = await ServiceModel.findById(serviceId);

        return res.status(201).json({
            message: 'Service créé avec succès',
            service: createdService
        });
    } catch (error) {
        console.error('Erreur lors de la création du service :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les services du quartier de l'utilisateur
export const getServicesByUserQuartier = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || !req.user.quartier_id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié ou sans quartier.' });
        }

        const userQuartierId = req.user.quartier_id;

        // Récupérer les services du même quartier avec les informations de l'utilisateur
        const result = await pool.query(`
            SELECT s.*, u.nom, u.prenom, q.nom_quartier
            FROM "Service" s
            JOIN "Utilisateur" u ON s.utilisateur_id = u.id
            JOIN "Quartier" q ON s.quartier_id = q.id
            WHERE s.quartier_id = $1 AND s.statut = 'active'
            ORDER BY s.date_publication DESC
        `, [userQuartierId]);

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des services :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les services de l'utilisateur connecté
export const getUserServices = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const services = await ServiceModel.findByUser(req.user.id);
        return res.status(200).json(services);
    } catch (error) {
        console.error('Erreur lors de la récupération des services de l\'utilisateur :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer un service par son ID
export const getServiceById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const serviceId = parseInt(req.params.id);

        if (isNaN(serviceId)) {
            return res.status(400).json({ message: 'ID de service invalide.' });
        }

        const service = await ServiceModel.findById(serviceId);

        if (!service) {
            return res.status(404).json({ message: 'Service non trouvé.' });
        }

        // Vérifier que le service appartient au même quartier que l'utilisateur
        if (req.user && req.user.quartier_id && service.quartier_id !== req.user.quartier_id) {
            return res.status(403).json({ message: 'Accès non autorisé à ce service.' });
        }

        return res.status(200).json(service);
    } catch (error) {
        console.error('Erreur lors de la récupération du service :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un service
export const updateService = async (req: AuthenticatedRequest, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = req.user.id;
        const serviceId = parseInt(req.params.id);

        // Vérifier que le service appartient à l'utilisateur
        const existingService = await ServiceModel.findById(serviceId);
        if (!existingService || existingService.utilisateur_id !== utilisateurId) {
            return res.status(403).json({ message: 'Accès non autorisé à ce service.' });
        }

        // Validation des dates si fournies
        const dateDebut = req.body.date_debut ? new Date(req.body.date_debut) : null;
        const dateFin = req.body.date_fin ? new Date(req.body.date_fin) : null;

        if (dateDebut && dateFin && dateFin < dateDebut) {
            return res.status(400).json({ message: 'La date de fin ne peut pas être antérieure à la date de début.' });
        }

        const updateData: Partial<Service> = {
            titre: req.body.titre || existingService.titre,
            description: req.body.description || existingService.description,
            type_service: req.body.type_service || existingService.type_service,
            categorie: req.body.categorie || existingService.categorie,
            date_debut: dateDebut !== undefined ? dateDebut : existingService.date_debut,
            date_fin: dateFin !== undefined ? dateFin : existingService.date_fin,
            horaires: req.body.horaires !== undefined ? req.body.horaires : existingService.horaires,
            recurrence: req.body.recurrence || existingService.recurrence,
            prix: req.body.prix !== undefined ? (req.body.prix ? parseFloat(req.body.prix) : null) : existingService.prix,
            budget_max: req.body.budget_max !== undefined ? (req.body.budget_max ? parseFloat(req.body.budget_max) : null) : existingService.budget_max,
            lieu: req.body.lieu !== undefined ? req.body.lieu : existingService.lieu,
            competences_requises: req.body.competences_requises !== undefined ? req.body.competences_requises : existingService.competences_requises,
            materiel_fourni: req.body.materiel_fourni !== undefined ? req.body.materiel_fourni : existingService.materiel_fourni,
            experience_requise: req.body.experience_requise !== undefined ? req.body.experience_requise : existingService.experience_requise,
            age_min: req.body.age_min !== undefined ? (req.body.age_min ? parseInt(req.body.age_min) : null) : existingService.age_min,
            age_max: req.body.age_max !== undefined ? (req.body.age_max ? parseInt(req.body.age_max) : null) : existingService.age_max,
            nombre_personnes: req.body.nombre_personnes !== undefined ? parseInt(req.body.nombre_personnes) : existingService.nombre_personnes,
            urgence: req.body.urgence || existingService.urgence,
            contact_info: req.body.contact_info !== undefined ? req.body.contact_info : existingService.contact_info
        };

        const success = await ServiceModel.update(serviceId, updateData);

        if (success) {
            const updatedService = await ServiceModel.findById(serviceId);
            return res.status(200).json({
                message: 'Service mis à jour avec succès',
                service: updatedService
            });
        } else {
            return res.status(404).json({ message: 'Service non trouvé' });
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du service :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un service
export const deleteService = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = req.user.id;
        const serviceId = parseInt(req.params.id);

        // Vérifier que le service appartient à l'utilisateur
        const existingService = await ServiceModel.findById(serviceId);
        if (!existingService || existingService.utilisateur_id !== utilisateurId) {
            return res.status(403).json({ message: 'Accès non autorisé à ce service.' });
        }

        const success = await ServiceModel.delete(serviceId);
        if (success) {
            return res.status(200).json({ message: 'Service supprimé avec succès' });
        } else {
            return res.status(404).json({ message: 'Service non trouvé' });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du service :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Recherche avancée de services
export const searchServices = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user || !req.user.quartier_id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié ou sans quartier.' });
        }

        const filters = {
            type_service: req.query.type_service as 'offre' | 'demande',
            categorie: req.query.categorie as string,
            prix_max: req.query.prix_max ? parseFloat(req.query.prix_max as string) : undefined,
            date_debut: req.query.date_debut ? new Date(req.query.date_debut as string) : undefined,
            urgence: req.query.urgence as string
        };

        const services = await ServiceModel.search(req.user.quartier_id, filters);
        return res.status(200).json(services);
    } catch (error) {
        console.error('Erreur lors de la recherche de services :', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Contrôleurs admin
export const adminGetAllServices = async (req: Request, res: Response) => {
    try {
        const services = await ServiceModel.findAll();
        res.status(200).json(services);
    } catch (error) {
        console.error('Erreur lors de la récupération de tous les services:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const adminUpdateServiceStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (!['active', 'inactive', 'complete'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const updated = await ServiceModel.updateStatus(parseInt(id), statut);
        if (!updated) {
            return res.status(404).json({ message: 'Service non trouvé' });
        }

        res.status(200).json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const adminGetServiceStats = async (req: Request, res: Response) => {
    try {
        const stats = await ServiceModel.getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
