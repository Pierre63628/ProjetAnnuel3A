// Service pour les appels API authentifiés
// Utiliser le proxy Vite pour les appels API
const API_URL = '/api';

// Fonction pour obtenir le token d'accès depuis le localStorage
const getAccessToken = () => localStorage.getItem('accessToken');

// Fonction pour rafraîchir le token d'accès
const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
        throw new Error('Aucun token de rafraîchissement disponible');
    }

    try {
        const response = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
            throw new Error('Échec du rafraîchissement du token');
        }

        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);

        return data.accessToken;
    } catch (error) {
        // En cas d'erreur, déconnecter l'utilisateur
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw error;
    }
};

// Fonction pour effectuer des requêtes API authentifiées avec gestion automatique du rafraîchissement du token
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    // Ajouter le token d'accès aux en-têtes si disponible
    let accessToken = getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
        ...options.headers,
    };

    // Effectuer la requête
    let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // Si le token est expiré (401), essayer de le rafraîchir et réessayer
    if (response.status === 401) {
        try {
            accessToken = await refreshToken();

            // Réessayer la requête avec le nouveau token
            response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    ...options.headers,
                },
            });
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            throw error;
        }
    }

    // Gérer les erreurs
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}`);
    }

    // Retourner les données
    return response.json();
};

export default {
    // Méthodes GET, POST, PUT, PATCH, DELETE
    get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
    post: (endpoint: string, data: any) => apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    put: (endpoint: string, data: any) => apiRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    patch: (endpoint: string, data: any) => apiRequest(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
    }),
    delete: (endpoint: string, data?: any) => apiRequest(endpoint, {
        method: 'DELETE',
        ...(data ? { body: JSON.stringify(data) } : {})
    }),
};
