import pool from '../config/db.js';

export interface Evenement {
    id?: number;
    organisateur_id: number;
    nom: string;
    description?: string;
    date_evenement: Date;
    lieu: string;
    type_evenement?: string;
    photo_url?: string;
    quartier_id?: number;
    created_at?: Date;
    updated_at?: Date;
}

export class EvenementModel {
    // Récupérer tous les événements
    static async findAll(): Promise<Evenement[]> {
        try {
            const query = `
                SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom 
                FROM "Evenement" e
                LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                ORDER BY e.date_evenement DESC
            `;
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error finding all events:', error);
            throw error;
        }
    }

    // Récupérer un événement par ID
    static async findById(id: number, quartierId: number): Promise<Evenement | null> {
        try {
            const query = `
                SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom
                FROM "Evenement" e
                         LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                WHERE e.id = $1 AND e.quartier_id = $2
            `;
            const result = await pool.query(query, [id, quartierId]);
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            throw error;
        }
    }


    static async findByOrganisateurId(organisateurId: number, quartierId: number): Promise<Evenement[]> {
        try {
            const query = `
                SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom
                FROM "Evenement" e
                         LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                WHERE e.organisateur_id = $1 AND e.quartier_id = $2
                ORDER BY e.date_evenement DESC
            `;
            const result = await pool.query(query, [organisateurId, quartierId]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }


    // Créer un nouvel événement
    static async create(evenementData: Evenement): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "Evenement"
                (organisateur_id, nom, description, date_evenement, lieu, type_evenement, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                [
                    evenementData.organisateur_id,
                    evenementData.nom,
                    evenementData.description || null,
                    evenementData.date_evenement,
                    evenementData.lieu,
                    evenementData.type_evenement || null,
                    evenementData.photo_url || null
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }

    // Mettre à jour un événement
    static async update(id: number, evenementData: Partial<Evenement>): Promise<boolean> {
        try {
            // Préparer les champs à mettre à jour
            const fields: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            // Ajouter chaque champ non-null à la requête
            if (evenementData.nom !== undefined) {
                fields.push(`nom = $${paramIndex++}`);
                values.push(evenementData.nom);
            }

            if (evenementData.description !== undefined) {
                fields.push(`description = $${paramIndex++}`);
                values.push(evenementData.description);
            }

            if (evenementData.date_evenement !== undefined) {
                fields.push(`date_evenement = $${paramIndex++}`);
                values.push(evenementData.date_evenement);
            }

            if (evenementData.lieu !== undefined) {
                fields.push(`lieu = $${paramIndex++}`);
                values.push(evenementData.lieu);
            }

            if (evenementData.type_evenement !== undefined) {
                fields.push(`type_evenement = $${paramIndex++}`);
                values.push(evenementData.type_evenement);
            }

            if (evenementData.photo_url !== undefined) {
                fields.push(`photo_url = $${paramIndex++}`);
                values.push(evenementData.photo_url);
            }

            // Si aucun champ à mettre à jour, retourner true
            if (fields.length === 0) {
                return true;
            }

            // Ajouter l'ID à la fin des paramètres
            values.push(id);

            const result = await pool.query(
                `UPDATE "Evenement" SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                values
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error;
        }
    }

    // Supprimer un événement
    static async delete(id: number): Promise<boolean> {
        try {
            // Supprimer d'abord les participations associées
            await pool.query(
                'DELETE FROM "Participation" WHERE evenement_id = $1',
                [id]
            );

            // Puis supprimer l'événement
            const result = await pool.query(
                'DELETE FROM "Evenement" WHERE id = $1',
                [id]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }

    static async search(query: string, quartierId: number): Promise<Evenement[]> {
        try {
            const searchTerm = `%${query}%`;
            const result = await pool.query(
                `SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom
                 FROM "Evenement" e
                          LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                 WHERE (e.nom ILIKE $1 OR e.description ILIKE $1 OR e.lieu ILIKE $1 OR e.type_evenement ILIKE $1)
                   AND e.quartier_id = $2
                 ORDER BY e.date_evenement DESC`,
                [searchTerm, quartierId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error searching events by quartier:', error);
            throw error;
        }
    }


    // Récupérer les événements à venir
    static async findUpcoming(quartierId: number): Promise<Evenement[]> {
        try {
            const query = `
                SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom
                FROM "Evenement" e
                         LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                WHERE e.date_evenement >= NOW() AND e.quartier_id = $1
                ORDER BY e.date_evenement ASC
            `;
            const result = await pool.query(query, [quartierId]);
            return result.rows;
        } catch (error) {
            console.error('Error finding upcoming events by quartier:', error);
            throw error;
        }
    }


    // Récupérer les événements passés
    static async findPast(quartierId: number): Promise<Evenement[]> {
        try {
            const query = `
                SELECT e.*, u.nom as organisateur_nom, u.prenom as organisateur_prenom
                FROM "Evenement" e
                         LEFT JOIN "Utilisateur" u ON e.organisateur_id = u.id
                WHERE e.date_evenement < NOW() AND e.quartier_id = $1
                ORDER BY e.date_evenement DESC
            `;
            const result = await pool.query(query, [quartierId]);
            return result.rows;
        } catch (error) {
            console.error('Error finding past events by quartier:', error);
            throw error;
        }
    }

    // Récupérer les participants d'un événement
    static async getParticipants(evenementId: number): Promise<any[]> {
        try {
            const query = `
                SELECT u.id, u.nom, u.prenom, u.email, p.date_inscription
                FROM "Participation" p
                JOIN "Utilisateur" u ON p.utilisateur_id = u.id
                WHERE p.evenement_id = $1
                ORDER BY p.date_inscription ASC
            `;
            const result = await pool.query(query, [evenementId]);
            return result.rows;
        } catch (error) {
            console.error('Error getting event participants:', error);
            throw error;
        }
    }

    // Ajouter un participant à un événement
    static async addParticipant(evenementId: number, utilisateurId: number): Promise<number> {
        try {
            // Vérifier si l'utilisateur participe déjà
            const checkQuery = `
                SELECT id FROM "Participation"
                WHERE evenement_id = $1 AND utilisateur_id = $2
            `;
            const checkResult = await pool.query(checkQuery, [evenementId, utilisateurId]);
            
            if (checkResult.rows.length > 0) {
                return checkResult.rows[0].id; // Déjà inscrit
            }

            // Ajouter la participation
            const result = await pool.query(
                `INSERT INTO "Participation"
                (evenement_id, utilisateur_id, date_inscription)
                VALUES ($1, $2, NOW()) RETURNING id`,
                [evenementId, utilisateurId]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error adding participant to event:', error);
            throw error;
        }
    }

    // Supprimer un participant d'un événement
    static async removeParticipant(evenementId: number, utilisateurId: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `DELETE FROM "Participation"
                WHERE evenement_id = $1 AND utilisateur_id = $2`,
                [evenementId, utilisateurId]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error removing participant from event:', error);
            throw error;
        }
    }

    // Vérifier si un utilisateur participe à un événement
    static async isParticipant(evenementId: number, utilisateurId: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `SELECT id FROM "Participation"
                WHERE evenement_id = $1 AND utilisateur_id = $2`,
                [evenementId, utilisateurId]
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking if user is participant:', error);
            throw error;
        }
    }
}

export default EvenementModel;
