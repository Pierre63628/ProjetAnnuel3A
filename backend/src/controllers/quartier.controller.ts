import { Request, Response } from 'express';
import { QuartierModel } from '../models/quartier.model';

// Récupérer tous les quartiers
export const getAllQuartiers = async (req: Request, res: Response) => {
    try {
        const quartiers = await QuartierModel.findAll();
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers.' });
    }
};

// Récupérer un quartier par ID
export const getQuartierById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
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

export default {
    getAllQuartiers,
    getQuartierById
};
