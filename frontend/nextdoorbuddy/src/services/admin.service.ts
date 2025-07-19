import api from './api';

interface AdminStats {
    totalUsers: number;
    totalQuartiers: number;
    totalEvents: number;
}

interface TrocStats {
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
    byType: Record<string, number>;
}

/**
 * Récupère les statistiques générales pour le tableau de bord admin
 */
export const getAdminStats = async (): Promise<AdminStats> => {
    try {
        return await api.get('/auth/stats');
    } catch (error) {
        console.error('Erreur getAdminStats:', error);
        throw error;
    }
};

/**
 * Récupère les statistiques des trocs pour le tableau de bord admin
 */
export const getTrocStats = async (): Promise<TrocStats> => {
    try {
        return await api.get('/troc/admin/stats');
    } catch (error) {
        console.error('Erreur getTrocStats:', error);
        throw error;
    }
};

export default {
    getAdminStats,
    getTrocStats
};
