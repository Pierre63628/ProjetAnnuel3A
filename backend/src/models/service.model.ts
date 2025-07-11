import pool from '../config/db.js';

export interface Service {
    id?: number;
    titre: string;
    description: string;
    type_service: 'offre' | 'demande';
    categorie: string; // baby-sitting, jardinage, bricolage, ménage, cours, etc.
    date_debut?: Date;
    date_fin?: Date;
    horaires?: string; // "9h-17h", "flexible", etc.
    recurrence?: 'ponctuel' | 'hebdomadaire' | 'mensuel' | 'permanent';
    prix?: number;
    budget_max?: number;
    lieu?: string; // adresse ou zone
    competences_requises?: string;
    materiel_fourni?: boolean;
    experience_requise?: string;
    age_min?: number;
    age_max?: number;
    nombre_personnes?: number; // nombre de personnes recherchées pour le service
    urgence?: 'faible' | 'normale' | 'elevee';
    contact_info?: string;
    date_publication: Date;
    quartier_id: number;
    utilisateur_id: number;
    statut: 'active' | 'inactive' | 'complete';
    created_at?: Date;
    updated_at?: Date;
}

export class ServiceModel {
    static async create(data: Service): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "Service"
            (titre, description, type_service, categorie, date_debut, date_fin, horaires, recurrence, prix, budget_max, lieu, competences_requises, materiel_fourni, experience_requise, age_min, age_max, nombre_personnes, urgence, contact_info, date_publication, quartier_id, utilisateur_id, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING id`,
                [
                    data.titre,
                    data.description,
                    data.type_service,
                    data.categorie,
                    data.date_debut || null,
                    data.date_fin || null,
                    data.horaires || null,
                    data.recurrence || 'ponctuel',
                    data.prix || null,
                    data.budget_max || null,
                    data.lieu || null,
                    data.competences_requises || null,
                    data.materiel_fourni || false,
                    data.experience_requise || null,
                    data.age_min || null,
                    data.age_max || null,
                    data.nombre_personnes || 1,
                    data.urgence || 'normale',
                    data.contact_info || null,
                    data.date_publication,
                    data.quartier_id,
                    data.utilisateur_id,
                    data.statut
                ]
            );
            return result.rows[0].id;
        } catch (error) {
            console.error('Erreur lors de la création du service :', error);
            throw error;
        }
    }

    static async findByQuartier(quartierId: number): Promise<Service[]> {
        try {
            const result = await pool.query(
                `SELECT s.*, u.nom, u.prenom, u.email, u.telephone
                 FROM "Service" s
                 LEFT JOIN "Utilisateur" u ON s.utilisateur_id = u.id
                 WHERE s.quartier_id = $1 AND s.statut = 'active'
                 ORDER BY s.date_publication DESC`,
                [quartierId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des services :', error);
            throw error;
        }
    }

    static async findByUser(userId: number): Promise<Service[]> {
        try {
            const result = await pool.query(
                `SELECT * FROM "Service"
                 WHERE utilisateur_id = $1
                 ORDER BY date_publication DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des services de l\'utilisateur :', error);
            throw error;
        }
    }

    static async findById(id: number): Promise<Service | null> {
        try {
            const result = await pool.query(
                `SELECT s.*, u.nom, u.prenom, u.email, u.telephone
                 FROM "Service" s
                 LEFT JOIN "Utilisateur" u ON s.utilisateur_id = u.id
                 WHERE s.id = $1`,
                [id]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erreur lors de la récupération du service :', error);
            throw error;
        }
    }

    static async update(id: number, data: Partial<Service>): Promise<boolean> {
        try {
            const result = await pool.query(
                `UPDATE "Service"
                 SET titre = $1, description = $2, type_service = $3, categorie = $4,
                     date_debut = $5, date_fin = $6, horaires = $7, recurrence = $8,
                     prix = $9, budget_max = $10, lieu = $11, competences_requises = $12,
                     materiel_fourni = $13, experience_requise = $14, age_min = $15, age_max = $16,
                     nombre_personnes = $17, urgence = $18, contact_info = $19,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $20`,
                [
                    data.titre,
                    data.description,
                    data.type_service,
                    data.categorie,
                    data.date_debut || null,
                    data.date_fin || null,
                    data.horaires || null,
                    data.recurrence || 'ponctuel',
                    data.prix || null,
                    data.budget_max || null,
                    data.lieu || null,
                    data.competences_requises || null,
                    data.materiel_fourni || false,
                    data.experience_requise || null,
                    data.age_min || null,
                    data.age_max || null,
                    data.nombre_personnes || 1,
                    data.urgence || 'normale',
                    data.contact_info || null,
                    id
                ]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du service :', error);
            throw error;
        }
    }

    static async delete(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                'DELETE FROM "Service" WHERE id = $1',
                [id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression du service :', error);
            throw error;
        }
    }

    // Méthodes admin
    static async findAll(): Promise<Service[]> {
        try {
            const result = await pool.query(`
                SELECT s.*, u.nom, u.prenom, u.email, q.nom_quartier
                FROM "Service" s
                LEFT JOIN "Utilisateur" u ON s.utilisateur_id = u.id
                LEFT JOIN "Quartier" q ON s.quartier_id = q.id
                ORDER BY s.date_publication DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error finding all services:', error);
            throw error;
        }
    }

    static async updateStatus(id: number, statut: 'active' | 'inactive' | 'complete'): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "Service" SET statut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [statut, id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating service status:', error);
            throw error;
        }
    }

    static async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        complete: number;
        byCategory: Record<string, number>;
        byType: Record<string, number>;
    }> {
        try {
            const [totalResult, statusResult, categoryResult, typeResult] = await Promise.all([
                pool.query('SELECT COUNT(*) as count FROM "Service"'),
                pool.query('SELECT statut, COUNT(*) as count FROM "Service" GROUP BY statut'),
                pool.query('SELECT categorie, COUNT(*) as count FROM "Service" WHERE categorie IS NOT NULL GROUP BY categorie'),
                pool.query('SELECT type_service, COUNT(*) as count FROM "Service" GROUP BY type_service')
            ]);

            const total = parseInt(totalResult.rows[0].count);
            const statusStats = statusResult.rows.reduce((acc: any, row: any) => {
                acc[row.statut] = parseInt(row.count);
                return acc;
            }, {});

            const byCategory = categoryResult.rows.reduce((acc: any, row: any) => {
                acc[row.categorie] = parseInt(row.count);
                return acc;
            }, {});

            const byType = typeResult.rows.reduce((acc: any, row: any) => {
                acc[row.type_service] = parseInt(row.count);
                return acc;
            }, {});

            return {
                total,
                active: statusStats.active || 0,
                inactive: statusStats.inactive || 0,
                complete: statusStats.complete || 0,
                byCategory,
                byType
            };
        } catch (error) {
            console.error('Error getting service stats:', error);
            throw error;
        }
    }

    // Recherche avancée
    static async search(quartierId: number, filters: {
        type_service?: 'offre' | 'demande';
        categorie?: string;
        prix_max?: number;
        date_debut?: Date;
        urgence?: string;
    }): Promise<Service[]> {
        try {
            let query = `
                SELECT s.*, u.nom, u.prenom, u.email, u.telephone
                FROM "Service" s
                LEFT JOIN "Utilisateur" u ON s.utilisateur_id = u.id
                WHERE s.quartier_id = $1 AND s.statut = 'active'
            `;
            const params: any[] = [quartierId];
            let paramIndex = 2;

            if (filters.type_service) {
                query += ` AND s.type_service = $${paramIndex}`;
                params.push(filters.type_service);
                paramIndex++;
            }

            if (filters.categorie) {
                query += ` AND s.categorie = $${paramIndex}`;
                params.push(filters.categorie);
                paramIndex++;
            }

            if (filters.prix_max) {
                query += ` AND (s.prix IS NULL OR s.prix <= $${paramIndex})`;
                params.push(filters.prix_max);
                paramIndex++;
            }

            if (filters.date_debut) {
                query += ` AND (s.date_debut IS NULL OR s.date_debut >= $${paramIndex})`;
                params.push(filters.date_debut);
                paramIndex++;
            }

            if (filters.urgence) {
                query += ` AND s.urgence = $${paramIndex}`;
                params.push(filters.urgence);
                paramIndex++;
            }

            query += ' ORDER BY s.date_publication DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la recherche de services :', error);
            throw error;
        }
    }
}
