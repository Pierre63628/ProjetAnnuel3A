import api from './api';

export interface Evenement {
    id: number;
    organisateur_id: number;
    nom: string;
    description?: string;
    date_evenement: string;
    lieu: string;
    type_evenement?: string;
    photo_url?: string;
    created_at?: string;
    updated_at?: string;
    organisateur_nom?: string;
    organisateur_prenom?: string;
}

export interface Participant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    date_inscription: string;
}

// Récupérer tous les événements
export const getAllEvenements = async (): Promise<Evenement[]> => {
    try {
        const data = await api.get('/evenements');
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des événements');
        return [];
    }
};

// Récupérer les événements à venir
export const getUpcomingEvenements = async (quartierId: number | string): Promise<Evenement[]> => {
    try {
        const data = await api.get(`/evenements/upcoming/${quartierId}`);
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des événements à venir');
        return [];
    }
};

// Récupérer les événements passés
export const getPastEvenements = async (): Promise<Evenement[]> => {
    try {
        const data = await api.get('/evenements/past');
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des événements passés');
        return [];
    }
};

// Récupérer un événement par ID
export const getEvenementById = async (id: number | string): Promise<Evenement | null> => {
    try {
        const data = await api.get(`/evenements/${id}`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'événement ${id}`);
        return null;
    }
};

// Récupérer les événements d'un utilisateur
export const getEvenementsByOrganisateur = async (organisateurId: number): Promise<Evenement[]> => {
    try {
        const data = await api.get(`/evenements/organisateur/${organisateurId}`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des événements de l'organisateur ${organisateurId}`);
        return [];
    }
};

// Créer un nouvel événement
export const createEvenement = async (evenementData: Omit<Evenement, 'id' | 'organisateur_id'>): Promise<Evenement | null> => {
    try {
        const data = await api.post('/evenements', evenementData);
        return data;
    } catch (error) {
        console.error('Erreur lors de la création de l\'événement');
        return null;
    }
};

// Mettre à jour un événement
export const updateEvenement = async (id: number, evenementData: Partial<Evenement>): Promise<Evenement | null> => {
    try {
        const data = await api.put(`/evenements/${id}`, evenementData);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'événement ${id}`);
        return null;
    }
};

// Supprimer un événement
export const deleteEvenement = async (id: number): Promise<boolean> => {
    try {
        await api.delete(`/evenements/${id}`);
        return true;
    } catch (error) {
        console.error(`Erreur lors de la suppression de l'événement ${id}`);
        return false;
    }
};

// Rechercher des événements
export const searchEvenements = async (query: string): Promise<Evenement[]> => {
    try {
        const data = await api.get(`/evenements/search?q=${encodeURIComponent(query)}`);
        return data;
    } catch (error) {
        console.error('Erreur lors de la recherche d\'événements');
        return [];
    }
};

// Récupérer les participants d'un événement
export const getEvenementParticipants = async (id: number): Promise<Participant[]> => {
    try {
        const data = await api.get(`/evenements/${id}/participants`);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la récupération des participants de l'événement ${id}`);
        return [];
    }
};

// Participer à un événement
export const participateToEvenement = async (id: number): Promise<boolean> => {
    try {
        await api.post(`/evenements/${id}/participate`, {});
        return true;
    } catch (error) {
        console.error(`Erreur lors de la participation à l'événement ${id}`);
        return false;
    }
};

// Annuler sa participation à un événement
export const cancelParticipation = async (id: number): Promise<boolean> => {
    try {
        await api.delete(`/evenements/${id}/participate`);
        return true;
    } catch (error) {
        console.error(`Erreur lors de l'annulation de la participation à l'événement ${id}`);
        return false;
    }
};

// Vérifier si un utilisateur participe à un événement
export const checkParticipation = async (id: number): Promise<boolean> => {
    try {
        const data = await api.get(`/evenements/${id}/check-participation`);
        return data.isParticipant;
    } catch (error) {
        console.error(`Erreur lors de la vérification de la participation à l'événement ${id}`);
        return false;
    }
};

export default {
    getAllEvenements,
    getUpcomingEvenements,
    getPastEvenements,
    getEvenementById,
    getEvenementsByOrganisateur,
    createEvenement,
    updateEvenement,
    deleteEvenement,
    searchEvenements,
    getEvenementParticipants,
    participateToEvenement,
    cancelParticipation,
    checkParticipation
};
