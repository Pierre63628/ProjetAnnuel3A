import { Collection, ObjectId } from 'mongodb';
import { getMongoDB, reconnectMongoDB } from '../config/mongodb.js';

export type ArticleStatus = 'brouillon' | 'a_valider' | 'valide' | 'refuse';

// Interfaces pour les éditions
export interface Edition {
    _id?: ObjectId;
    uuid: string; // UUID auto-généré
    title: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateEditionData {
    title: string;
    description?: string;
}

export interface UpdateEditionData {
    title?: string;
    description?: string;
}

export interface JournalArticle {
    _id?: ObjectId;
    title: string;
    content: string;
    authorId: number;
    authorName: string;
    date: Date;
    status: ArticleStatus;
    quartierId: number;
    quartierName: string;
    category: string;
    images?: string[]; // URLs des images
    imageUrl?: string; // URL de l'image principale
    editionId?: string; // Référence vers l'édition (UUID)
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateArticleData {
    title: string;
    content: string;
    authorId: number;
    authorName: string;
    date: Date;
    status?: ArticleStatus;
    quartierId: number;
    quartierName: string;
    category: string;
    images?: string[];
    imageUrl?: string;
}

export interface UpdateArticleData {
    title?: string;
    content?: string;
    date?: Date;
    status?: ArticleStatus;
    quartierId?: number;
    quartierName?: string;
    category?: string;
    images?: string[];
    imageUrl?: string;
}

class JournalModel {
    private collection: Collection<JournalArticle> | null = null;

    private async getCollection(): Promise<Collection<JournalArticle>> {
        try {
            if (!this.collection) {
                this.collection = getMongoDB().collection<JournalArticle>('articles');
            }
            return this.collection;
        } catch (error) {
            await reconnectMongoDB();
            this.collection = getMongoDB().collection<JournalArticle>('articles');
            return this.collection;
        }
    }

    // Créer un nouvel article
    async createArticle(articleData: CreateArticleData): Promise<JournalArticle> {
        const collection = await this.getCollection();
        const now = new Date();
        const article: JournalArticle = {
            ...articleData,
            status: articleData.status || 'brouillon',
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(article);

        return { ...article, _id: result.insertedId };
    }

    // Récupérer tous les articles (pour les admins)
    async getAllArticles(): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();

            const articles = await collection
                .find({})
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getAllArticles:', error);
            throw error;
        }
    }

    // Récupérer tous les articles d'un quartier spécifique (pour les admins)
    async getAllArticlesByQuartier(quartierId: number): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();
            const filter = { quartierId: quartierId };

            const articles = await collection
                .find(filter)
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getAllArticlesByQuartier:', error);
            throw error;
        }
    }

    // Récupérer tous les articles validés (pour la visualisation)
    async getPublicArticles(): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();

            const filter = { status: 'valide' as ArticleStatus };

            const articles = await collection
                .find(filter)
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getPublicArticles:', error);
            throw error;
        }
    }

    // Récupérer les articles d'un utilisateur spécifique
    async getArticlesByAuthor(authorId: number): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();
            const filter = { authorId: authorId };

            const articles = await collection
                .find(filter)
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getArticlesByAuthor:', error);
            throw error;
        }
    }

    // Récupérer les articles validés d'un utilisateur spécifique
    async getPublicArticlesByAuthor(authorId: number): Promise<JournalArticle[]> {
        const collection = await this.getCollection();
        return await collection
            .find({ authorId: authorId, status: 'valide' })
            .sort({ date: -1 })
            .toArray();
    }

    // Récupérer un article par son ID
    async getArticleById(id: string): Promise<JournalArticle | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(id);
        return await collection.findOne({ _id: objectId });
    }

    // Modifier un article
    async updateArticle(id: string, updateData: UpdateArticleData): Promise<JournalArticle | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(id);
        
        const updateDoc = {
            ...updateData,
            updatedAt: new Date()
        };
        
        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { $set: updateDoc },
            { returnDocument: 'after' }
        );
        
        return result;
    }

    // Supprimer un article
    async deleteArticle(id: string): Promise<boolean> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(id);
        const result = await collection.deleteOne({ _id: objectId });
        return result.deletedCount > 0;
    }

    // Vérifier si un utilisateur est l'auteur d'un article
    async isArticleAuthor(articleId: string, authorId: number): Promise<boolean> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(articleId);
        const article = await collection.findOne({ _id: objectId, authorId: authorId });
        return article !== null;
    }

    // Récupérer les articles en attente de validation
    async getArticlesPendingValidation(): Promise<JournalArticle[]> {
        const collection = await this.getCollection();
        return await collection
            .find({ status: 'a_valider' })
            .sort({ date: -1 })
            .toArray();
    }

    // Récupérer les articles en attente de validation par quartier
    async getArticlesPendingValidationByQuartier(quartierId: number): Promise<JournalArticle[]> {
        const collection = await this.getCollection();
        return await collection
            .find({ status: 'a_valider', quartierId: quartierId })
            .sort({ date: -1 })
            .toArray();
    }

    // Récupérer les articles par statut
    async getArticlesByStatus(status: ArticleStatus): Promise<JournalArticle[]> {
        const collection = await this.getCollection();
        return await collection
            .find({ status: status })
            .sort({ date: -1 })
            .toArray();
    }

    // Valider un article
    async validateArticle(articleId: string): Promise<JournalArticle | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(articleId);
        
        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { 
                $set: { 
                    status: 'valide' as ArticleStatus,
                    updatedAt: new Date()
                } 
            },
            { returnDocument: 'after' }
        );
        
        return result;
    }

    // Rejeter un article
    async rejectArticle(articleId: string): Promise<JournalArticle | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(articleId);
        
        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { 
                $set: { 
                    status: 'refuse' as ArticleStatus,
                    updatedAt: new Date()
                } 
            },
            { returnDocument: 'after' }
        );
        
        return result;
    }

    // Soumettre un article pour validation
    async submitForValidation(articleId: string): Promise<JournalArticle | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(articleId);
        
        const result = await collection.findOneAndUpdate(
            { _id: objectId },
            { 
                $set: { 
                    status: 'a_valider' as ArticleStatus,
                    updatedAt: new Date()
                } 
            },
            { returnDocument: 'after' }
        );
        
        return result;
    }

    // Récupérer les statistiques par statut
    async getStatsByStatus(): Promise<Record<ArticleStatus, number>> {
        const collection = await this.getCollection();
        const stats = await collection.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();
        
        const result: Record<ArticleStatus, number> = {
            brouillon: 0,
            a_valider: 0,
            valide: 0,
            refuse: 0
        };
        
        stats.forEach(stat => {
            result[stat._id as ArticleStatus] = stat.count;
        });
        
        return result;
    }

    // Récupérer tous les articles validés (pour les journaux)
    async getValidatedArticles(): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();

            const articles = await collection
                .find({ status: 'valide' })
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getValidatedArticles:', error);
            throw error;
        }
    }

    // Récupérer les articles d'une édition spécifique
    async getArticlesByEdition(editionId: string): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();
            const filter = { editionId: editionId };

            const articles = await collection
                .find(filter)
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getArticlesByEdition:', error);
            throw error;
        }
    }

    // Récupérer les articles validés d'une édition spécifique
    async getValidatedArticlesByEdition(editionId: string): Promise<JournalArticle[]> {
        try {
            const collection = await this.getCollection();
            const filter = { editionId: editionId, status: 'valide' as ArticleStatus };

            const articles = await collection
                .find(filter)
                .sort({ date: -1 })
                .toArray();

            return articles;
        } catch (error) {
            console.error('Erreur dans getValidatedArticlesByEdition:', error);
            throw error;
        }
    }

    // Associer un article à une édition
    async assignArticleToEdition(articleId: string, editionId: string): Promise<JournalArticle | null> {
        try {
            const collection = await this.getCollection();
            const objectId = new ObjectId(articleId);

            const result = await collection.findOneAndUpdate(
                { _id: objectId },
                {
                    $set: {
                        editionId: editionId,
                        updatedAt: new Date()
                    }
                },
                { returnDocument: 'after' }
            );

            return result;
        } catch (error) {
            console.error('Erreur dans assignArticleToEdition:', error);
            throw error;
        }
    }

    // Retirer l'association d'un article avec une édition
    async removeArticleFromEdition(articleId: string): Promise<JournalArticle | null> {
        try {
            const collection = await this.getCollection();
            const objectId = new ObjectId(articleId);

            const result = await collection.findOneAndUpdate(
                { _id: objectId },
                {
                    $unset: { editionId: "" },
                    $set: { updatedAt: new Date() }
                },
                { returnDocument: 'after' }
            );

            return result;
        } catch (error) {
            console.error('Erreur dans removeArticleFromEdition:', error);
            throw error;
        }
    }
}

export default new JournalModel();

// Classe pour gérer les éditions
class EditionCollectionModel {
    private collection: Collection<Edition> | null = null;

    private async getCollection(): Promise<Collection<Edition>> {
        try {
            if (!this.collection) {
                this.collection = getMongoDB().collection<Edition>('editions');
            }
            return this.collection;
        } catch (error) {
            await reconnectMongoDB();
            this.collection = getMongoDB().collection<Edition>('editions');
            return this.collection;
        }
    }

    // Générer un UUID v4
    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Créer une nouvelle édition
    async createEdition(editionData: CreateEditionData): Promise<Edition> {
        const collection = await this.getCollection();
        const now = new Date();
        const edition: Edition = {
            ...editionData,
            uuid: this.generateUUID(),
            createdAt: now,
            updatedAt: now
        };

        const result = await collection.insertOne(edition);

        return { ...edition, _id: result.insertedId };
    }

    // Récupérer toutes les éditions
    async getAllEditions(): Promise<Edition[]> {
        try {
            const collection = await this.getCollection();

            const editions = await collection
                .find({})
                .sort({ createdAt: -1 })
                .toArray();

            return editions;
        } catch (error) {
            console.error('Erreur dans getAllEditions:', error);
            throw error;
        }
    }

    // Récupérer une édition par son UUID
    async getEditionByUUID(uuid: string): Promise<Edition | null> {
        const collection = await this.getCollection();
        return await collection.findOne({ uuid: uuid });
    }

    // Récupérer une édition par son ID MongoDB
    async getEditionById(id: string): Promise<Edition | null> {
        const collection = await this.getCollection();
        const objectId = new ObjectId(id);
        return await collection.findOne({ _id: objectId });
    }

    // Modifier une édition
    async updateEdition(uuid: string, updateData: UpdateEditionData): Promise<Edition | null> {
        const collection = await this.getCollection();
        
        const updateDoc = {
            ...updateData,
            updatedAt: new Date()
        };
        
        const result = await collection.findOneAndUpdate(
            { uuid: uuid },
            { $set: updateDoc },
            { returnDocument: 'after' }
        );
        
        return result;
    }

    // Supprimer une édition
    async deleteEdition(uuid: string): Promise<boolean> {
        const collection = await this.getCollection();
        const result = await collection.deleteOne({ uuid: uuid });
        return result.deletedCount > 0;
    }
}

export const editionCollectionModel = new EditionCollectionModel(); 