import { Request, Response } from 'express';
import { EvenementModel, Evenement } from '../models/evenement.model.js';

// Récupérer tous les événements
export const getAllEvenements = async (req: Request, res: Response) => {
    try {
        const evenements = await EvenementModel.findAll();
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements.' });
    }
};

// Récupérer les événements à venir
export const getUpcomingEvenements = async (req: Request, res: Response) => {
    try {
        const evenements = await EvenementModel.findUpcoming();
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements à venir:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements à venir.' });
    }
};

// Récupérer les événements passés
export const getPastEvenements = async (req: Request, res: Response) => {
    try {
        const evenements = await EvenementModel.findPast();
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements passés:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements passés.' });
    }
};

// Récupérer un événement par ID
export const getEvenementById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const evenement = await EvenementModel.findById(id);

        if (!evenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        res.status(200).json(evenement);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'événement.' });
    }
};

// Récupérer les événements d'un utilisateur
export const getEvenementsByOrganisateur = async (req: Request, res: Response) => {
    try {
        const organisateurId = parseInt(req.params.organisateurId);
        const evenements = await EvenementModel.findByOrganisateurId(organisateurId);
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements de l\'organisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements de l\'organisateur.' });
    }
};

// Récupérer les événements d'un quartier
export const getEvenementsByQuartier = async (req: Request, res: Response) => {
    try {
        const quartierId = parseInt(req.params.quartierId);
        const evenements = await EvenementModel.findByQuartierId(quartierId);
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la récupération des événements du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des événements du quartier.' });
    }
};

// Créer un nouvel événement
export const createEvenement = async (req: Request, res: Response) => {
    try {
        const evenementData: Evenement = {
            organisateur_id: req.user.id,
            nom: req.body.nom,
            description: req.body.description,
            date_evenement: new Date(req.body.date_evenement),
            lieu: req.body.lieu,
            type_evenement: req.body.type_evenement,
            photo_url: req.body.photo_url,
            quartier_id: req.body.quartier_id
        };

        const id = await EvenementModel.create(evenementData);
        const newEvenement = await EvenementModel.findById(id);

        res.status(201).json(newEvenement);
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'événement.' });
    }
};

// Mettre à jour un événement
export const updateEvenement = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(id);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // Vérifier si l'utilisateur est l'organisateur ou un admin
        if (existingEvenement.organisateur_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas l\'organisateur de cet événement.' });
        }

        // Préparer les données à mettre à jour
        const evenementData: Partial<Evenement> = {};
        
        if (req.body.nom !== undefined) evenementData.nom = req.body.nom;
        if (req.body.description !== undefined) evenementData.description = req.body.description;
        if (req.body.date_evenement !== undefined) evenementData.date_evenement = new Date(req.body.date_evenement);
        if (req.body.lieu !== undefined) evenementData.lieu = req.body.lieu;
        if (req.body.type_evenement !== undefined) evenementData.type_evenement = req.body.type_evenement;
        if (req.body.photo_url !== undefined) evenementData.photo_url = req.body.photo_url;
        if (req.body.quartier_id !== undefined) evenementData.quartier_id = req.body.quartier_id;

        // Mettre à jour l'événement
        await EvenementModel.update(id, evenementData);
        
        // Récupérer l'événement mis à jour
        const updatedEvenement = await EvenementModel.findById(id);
        
        res.status(200).json(updatedEvenement);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'événement.' });
    }
};

// Supprimer un événement
export const deleteEvenement = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(id);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // Vérifier si l'utilisateur est l'organisateur ou un admin
        if (existingEvenement.organisateur_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous n\'êtes pas l\'organisateur de cet événement.' });
        }

        // Supprimer l'événement
        await EvenementModel.delete(id);
        
        res.status(200).json({ message: 'Événement supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'événement:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'événement.' });
    }
};

// Rechercher des événements
export const searchEvenements = async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;

        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Le paramètre de recherche est obligatoire.' });
        }

        const evenements = await EvenementModel.search(query);
        res.status(200).json(evenements);
    } catch (error) {
        console.error('Erreur lors de la recherche d\'événements:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la recherche d\'événements.' });
    }
};

// Récupérer les participants d'un événement
export const getEvenementParticipants = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(id);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        const participants = await EvenementModel.getParticipants(id);
        res.status(200).json(participants);
    } catch (error) {
        console.error('Erreur lors de la récupération des participants:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des participants.' });
    }
};

// Participer à un événement
export const participateToEvenement = async (req: Request, res: Response) => {
    try {
        const evenementId = parseInt(req.params.id);
        const utilisateurId = req.user.id;
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(evenementId);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // Vérifier si l'événement est déjà passé
        if (new Date(existingEvenement.date_evenement) < new Date()) {
            return res.status(400).json({ message: 'Impossible de participer à un événement passé.' });
        }

        // Ajouter la participation
        await EvenementModel.addParticipant(evenementId, utilisateurId);
        
        res.status(200).json({ message: 'Participation enregistrée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la participation:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout de la participation.' });
    }
};

// Annuler sa participation à un événement
export const cancelParticipation = async (req: Request, res: Response) => {
    try {
        const evenementId = parseInt(req.params.id);
        const utilisateurId = req.user.id;
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(evenementId);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // Vérifier si l'utilisateur participe à l'événement
        const isParticipant = await EvenementModel.isParticipant(evenementId, utilisateurId);
        if (!isParticipant) {
            return res.status(400).json({ message: 'Vous ne participez pas à cet événement.' });
        }

        // Supprimer la participation
        await EvenementModel.removeParticipant(evenementId, utilisateurId);
        
        res.status(200).json({ message: 'Participation annulée avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la participation:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'annulation de la participation.' });
    }
};

// Vérifier si un utilisateur participe à un événement
export const checkParticipation = async (req: Request, res: Response) => {
    try {
        const evenementId = parseInt(req.params.id);
        const utilisateurId = req.user.id;
        
        // Vérifier si l'événement existe
        const existingEvenement = await EvenementModel.findById(evenementId);
        if (!existingEvenement) {
            return res.status(404).json({ message: 'Événement non trouvé.' });
        }

        // Vérifier si l'utilisateur participe à l'événement
        const isParticipant = await EvenementModel.isParticipant(evenementId, utilisateurId);
        
        res.status(200).json({ isParticipant });
    } catch (error) {
        console.error('Erreur lors de la vérification de la participation:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la vérification de la participation.' });
    }
};

export default {
    getAllEvenements,
    getUpcomingEvenements,
    getPastEvenements,
    getEvenementById,
    getEvenementsByOrganisateur,
    getEvenementsByQuartier,
    createEvenement,
    updateEvenement,
    deleteEvenement,
    searchEvenements,
    getEvenementParticipants,
    participateToEvenement,
    cancelParticipation,
    checkParticipation
};
