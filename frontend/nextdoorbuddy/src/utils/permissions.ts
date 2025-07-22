import { Evenement } from '../services/evenement.service';
import { AnnonceTroc } from '../services/troc.service';

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

/**
 * Vérifie si un utilisateur peut supprimer une annonce de troc
 * @param user - L'utilisateur connecté
 * @param troc - L'annonce de troc à vérifier
 * @returns true si l'utilisateur peut supprimer l'annonce, false sinon
 */
export const canDeleteTroc = (user: User | null, troc: AnnonceTroc | null): boolean => {
    if (!user || !troc) {
        return false;
    }

    // Les administrateurs peuvent supprimer toutes les annonces
    if (user.role === 'admin') {
        return true;
    }

    // Le propriétaire peut supprimer sa propre annonce
    if (user.id === troc.utilisateur_id) {
        return true;
    }

    return false;
};

/**
 * Vérifie si un utilisateur peut modifier une annonce de troc
 * @param user - L'utilisateur connecté
 * @param troc - L'annonce de troc à vérifier
 * @returns true si l'utilisateur peut modifier l'annonce, false sinon
 */
export const canEditTroc = (user: User | null, troc: AnnonceTroc | null): boolean => {
    if (!user || !troc) {
        return false;
    }

    // Les administrateurs peuvent modifier toutes les annonces
    if (user.role === 'admin') {
        return true;
    }

    // Le propriétaire peut modifier sa propre annonce
    if (user.id === troc.utilisateur_id) {
        return true;
    }

    return false;
};

/**
 * Vérifie si un utilisateur est le propriétaire d'une annonce de troc
 * @param user - L'utilisateur à vérifier
 * @param troc - L'annonce de troc à vérifier
 * @returns true si l'utilisateur est le propriétaire, false sinon
 */
export const isTrocOwner = (user: User | null, troc: AnnonceTroc): boolean => {
    return user?.id === troc.utilisateur_id;
};
