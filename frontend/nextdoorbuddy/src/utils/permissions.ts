import { Evenement } from '../services/evenement.service';

interface User {
    id: number;
    role?: string;
    [key: string]: any;
}

/**
 * Vérifie si un utilisateur peut supprimer un événement
 * @param user - L'utilisateur connecté
 * @param evenement - L'événement à vérifier
 * @returns true si l'utilisateur peut supprimer l'événement, false sinon
 */
export const canDeleteEvent = (user: User | null, evenement: Evenement): boolean => {
    if (!user || !evenement) {
        return false;
    }

    // Les administrateurs peuvent supprimer tous les événements
    if (user.role === 'admin') {
        return true;
    }

    // L'organisateur peut supprimer son propre événement
    if (user.id === evenement.organisateur_id) {
        return true;
    }

    return false;
};

/**
 * Vérifie si un utilisateur peut modifier un événement
 * @param user - L'utilisateur connecté
 * @param evenement - L'événement à vérifier
 * @returns true si l'utilisateur peut modifier l'événement, false sinon
 */
export const canEditEvent = (user: User | null, evenement: Evenement): boolean => {
    if (!user || !evenement) {
        return false;
    }

    // Les administrateurs peuvent modifier tous les événements
    if (user.role === 'admin') {
        return true;
    }

    // L'organisateur peut modifier son propre événement
    if (user.id === evenement.organisateur_id) {
        return true;
    }

    return false;
};

/**
 * Vérifie si un utilisateur est administrateur
 * @param user - L'utilisateur à vérifier
 * @returns true si l'utilisateur est administrateur, false sinon
 */
export const isAdmin = (user: User | null): boolean => {
    return user?.role === 'admin';
};

/**
 * Vérifie si un utilisateur est l'organisateur d'un événement
 * @param user - L'utilisateur à vérifier
 * @param evenement - L'événement à vérifier
 * @returns true si l'utilisateur est l'organisateur, false sinon
 */
export const isEventOrganizer = (user: User | null, evenement: Evenement): boolean => {
    return user?.id === evenement.organisateur_id;
};
