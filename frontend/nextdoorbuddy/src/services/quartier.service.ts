import api from './api';

export interface Quartier {
    id: number;
    nom_quartier: string;
    ville?: string;
    code_postal?: string;
}

export const getQuartiers = async (): Promise<Quartier[]> => {
    try {
        const data = await api.get('/quartiers');
        return data;
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        return [];
    }
};

export default {
    getQuartiers
};
