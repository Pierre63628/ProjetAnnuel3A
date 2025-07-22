import api from './api';

export interface JournalArticle {
    _id: string;
    title: string;
    content: string;
    authorId: number;
    authorName: string;
    date: string;
    status: 'brouillon' | 'a_valider' | 'valide' | 'refuse';
    quartierId: number;
    quartierName: string;
    category: string;
    images?: string[];
    imageUrl?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateArticleData {
    title: string;
    content: string;
    quartier_id: number;
    category: string;
    images?: string[];
    imageUrl?: string;
}

export interface UpdateArticleData {
    title?: string;
    content?: string;
    quartier_id?: number;
    category?: string;
    images?: string[];
    imageUrl?: string;
}

export interface CreateJournalData {
    title: string;
    description?: string;
    articleIds: string[];
}

export interface Edition {
    _id: string;
    uuid: string;
    title: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

class JournalService {
    // Récupérer tous les articles publics (pour la visualisation)
    async getPublicArticles(): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getPublicArticles ===');
            console.log('URL:', '/journal/public');
            
            const response = await api.get('/journal/public');
            
            console.log('SERVICE: Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération des articles publics:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer tous les articles validés (pour les journaux)
    async getValidatedArticles(): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getValidatedArticles ===');
            console.log('URL:', '/journal/validated');
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get('/journal/validated');
            
            console.log('SERVICE: Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            console.log('SERVICE: Structure de response.data:', typeof response.data, response.data);
            console.log('SERVICE: response.data.data existe:', !!response.data.data);
            console.log('SERVICE: response.data.data est un tableau:', Array.isArray(response.data.data));
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération des articles validés:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer les articles validés sans editionId (pour l'onglet éditions)
    async getValidatedArticlesWithoutEdition(): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getValidatedArticlesWithoutEdition ===');
            console.log('URL:', '/journal/validated-without-edition');
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get('/journal/validated-without-edition');
            
            console.log('SERVICE: Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération des articles validés sans édition:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer tous les articles (pour les admins)
    async getAllArticles(): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getAllArticles (ADMIN) ===');
            console.log('URL:', '/journal/admin/all');
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get('/journal/admin/all');
            
            console.log('SERVICE: Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            console.log('SERVICE: Structure de response.data:', typeof response.data, response.data);
            console.log('SERVICE: response.data.data existe:', !!response.data.data);
            console.log('SERVICE: response.data.data est un tableau:', Array.isArray(response.data.data));
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération de tous les articles:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer les articles en attente de validation (admin)
    async getPendingArticles(): Promise<JournalArticle[]> {
        try {
            const response = await api.get('/journal/admin/pending');
            return response.data.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des articles en attente:', error);
            return [];
        }
    }

    // Valider un article (admin)
    async validateArticle(articleId: string, comment?: string): Promise<JournalArticle | null> {
        try {
            const response = await api.patch(`/journal/admin/${articleId}/validate`, {
                comment: comment || 'Article validé par l\'administrateur'
            });
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors de la validation de l\'article:', error);
            throw error;
        }
    }

    // Rejeter un article (admin)
    async rejectArticle(articleId: string, comment: string): Promise<JournalArticle | null> {
        try {
            const response = await api.patch(`/journal/admin/${articleId}/reject`, { comment });
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors du rejet de l\'article:', error);
            throw error;
        }
    }

    // === MÉTHODES UTILISATEUR ===

    // Récupérer les articles de l'utilisateur connecté
    async getMyArticles(): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getMyArticles (USER) ===');
            console.log('URL:', '/journal/user/my-articles');
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get('/journal/user/my-articles');
            
            console.log('SERVICE: Réponse reçue:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            console.log('SERVICE: Structure de response.data:', typeof response.data, response.data);
            console.log('SERVICE: response.data.data existe:', !!response.data.data);
            console.log('SERVICE: response.data.data est un tableau:', Array.isArray(response.data.data));
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération de vos articles:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Créer un nouvel article
    async createArticle(articleData: CreateArticleData): Promise<JournalArticle> {
        try {
            console.log('=== SERVICE: createArticle ===');
            console.log('URL:', '/journal/user/create');
            console.log('Article data:', articleData);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.post('/journal/user/create', articleData);
            
            console.log('SERVICE: Réponse createArticle:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les différentes structures de réponse possibles
            let article: JournalArticle;
            
            if (response.data.data) {
                // Structure: { success: true, data: {...} }
                article = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (response.data._id) {
                // Structure: {...} (objet direct)
                article = response.data;
                console.log('SERVICE: Structure détectée: response.data (objet direct)');
            } else {
                throw new Error('Structure de réponse inattendue');
            }
            
            console.log('SERVICE: Article créé:', article);
            return article;
        } catch (error) {
            console.error('Erreur lors de la création de l\'article:', error);
            throw error;
        }
    }

    // Modifier un article
    async updateArticle(articleId: string, updateData: UpdateArticleData): Promise<JournalArticle | null> {
        try {
            const response = await api.put(`/journal/user/${articleId}`, updateData);
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors de la modification de l\'article:', error);
            throw error;
        }
    }

    // Supprimer un article
    async deleteArticle(articleId: string): Promise<boolean> {
        try {
            await api.delete(`/journal/user/${articleId}`);
            return true;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'article:', error);
            throw error;
        }
    }

    // Soumettre un article pour validation
    async submitForValidation(articleId: string): Promise<JournalArticle | null> {
        try {
            console.log('=== SERVICE: submitForValidation ===');
            console.log('URL:', `/journal/user/${articleId}/submit`);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.patch(`/journal/user/${articleId}/submit`, {});
            
            console.log('SERVICE: Réponse submitForValidation:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les différentes structures de réponse possibles
            let article: JournalArticle | null = null;
            
            if (response.data.data) {
                // Structure: { success: true, data: {...} }
                article = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (response.data._id) {
                // Structure: {...} (objet direct)
                article = response.data;
                console.log('SERVICE: Structure détectée: response.data (objet direct)');
            } else if (response.data.success && response.data.data) {
                // Structure: { success: true, data: {...} }
                article = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Article soumis:', article);
            return article;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la soumission de l\'article:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            throw error;
        }
    }

    // Récupérer les statistiques des articles
    async getArticleStats(): Promise<any> {
        try {
            const response = await api.get('/journal/user/stats');
            return response.data.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {};
        }
    }

    // Récupérer un article par ID
    async getArticleById(articleId: string): Promise<JournalArticle | null> {
        try {
            // Déterminer si l'utilisateur est admin
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const isAdmin = user?.role === 'admin';
            
            const endpoint = isAdmin ? `/journal/admin/${articleId}` : `/journal/user/${articleId}`;
            
            console.log('=== SERVICE: getArticleById ===');
            console.log('User role:', user?.role);
            console.log('Is admin:', isAdmin);
            console.log('URL:', endpoint);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get(endpoint);
            
            console.log('SERVICE: Réponse getArticleById:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les différentes structures de réponse possibles
            let article: JournalArticle | null = null;
            
            if (response.data.data) {
                // Structure: { success: true, data: {...} }
                article = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (response.data._id) {
                // Structure: {...} (objet direct)
                article = response.data;
                console.log('SERVICE: Structure détectée: response.data (objet direct)');
            } else if (response.data.success && response.data.data) {
                // Structure: { success: true, data: {...} }
                article = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            } else {
                console.log('SERVICE: Structure de réponse inattendue:', response.data);
                return null;
            }
            
            console.log('SERVICE: Article récupéré:', article);
            return article;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération de l\'article:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return null;
        }
    }

    // Créer un nouveau journal avec des articles
    async createJournal(journalData: CreateJournalData): Promise<any> {
        try {
            console.log('=== SERVICE: createJournal ===');
            console.log('URL:', '/journal/create-journal');
            console.log('Journal data:', journalData);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.post('/journal/create-journal', journalData);
            
            console.log('SERVICE: Réponse createJournal:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            return response.data;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la création du journal:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            throw error;
        }
    }

    // Récupérer toutes les éditions
    async getEditions(): Promise<Edition[]> {
        try {
            console.log('=== SERVICE: getEditions ===');
            console.log('URL:', '/journal/editions');
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get('/journal/editions');
            
            console.log('SERVICE: Réponse getEditions:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les deux structures de réponse possibles
            let editions: Edition[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                editions = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                editions = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                editions = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Éditions extraites:', editions.length);
            console.log('SERVICE: Première édition:', editions[0]);
            
            return editions;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération des éditions:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer les articles d'une édition spécifique
    async getArticlesByEdition(editionUuid: string): Promise<JournalArticle[]> {
        try {
            console.log('=== SERVICE: getArticlesByEdition ===');
            console.log('URL:', `/journal/edition/${editionUuid}/articles`);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get(`/journal/edition/${editionUuid}/articles`);
            
            console.log('SERVICE: Réponse getArticlesByEdition:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les différentes structures de réponse possibles
            let articles: JournalArticle[] = [];
            
            if (response.data.data && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...], total: number }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (Array.isArray(response.data)) {
                // Structure: [...] (tableau direct)
                articles = response.data;
                console.log('SERVICE: Structure détectée: response.data (tableau direct)');
            } else if (response.data.success && Array.isArray(response.data.data)) {
                // Structure: { success: true, data: [...] }
                articles = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Articles extraits:', articles.length);
            console.log('SERVICE: Premier article:', articles[0]);
            
            return articles;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération des articles de l\'édition:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return [];
        }
    }

    // Récupérer une édition par son UUID
    async getEditionByUUID(editionUuid: string): Promise<Edition | null> {
        try {
            console.log('=== SERVICE: getEditionByUUID ===');
            console.log('URL:', `/journal/edition/${editionUuid}`);
            console.log('Token:', localStorage.getItem('accessToken') ? 'Présent' : 'Absent');
            
            const response = await api.get(`/journal/edition/${editionUuid}`);
            
            console.log('SERVICE: Réponse getEditionByUUID:', {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            });
            
            // Gérer les différentes structures de réponse possibles
            let edition: Edition | null = null;
            
            if (response.data.data) {
                // Structure: { success: true, data: {...} }
                edition = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.data');
            } else if (response.data._id) {
                // Structure: {...} (objet direct)
                edition = response.data;
                console.log('SERVICE: Structure détectée: response.data (objet direct)');
            } else if (response.data.success && response.data.data) {
                // Structure: { success: true, data: {...} }
                edition = response.data.data;
                console.log('SERVICE: Structure détectée: response.data.success.data');
            }
            
            console.log('SERVICE: Édition récupérée:', edition);
            return edition;
        } catch (error: any) {
            console.error('SERVICE: Erreur lors de la récupération de l\'édition:', error);
            console.error('SERVICE: Détails de l\'erreur:', {
                message: error?.message || 'Erreur inconnue',
                status: error?.response?.status,
                data: error?.response?.data
            });
            return null;
        }
    }
}

export default new JournalService(); 