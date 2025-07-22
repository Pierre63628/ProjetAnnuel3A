import pool from '../config/db.js';

export interface UtilisateurQuartier {
    id?: number;
    utilisateur_id: number;
    quartier_id: number;
    est_principal?: boolean;
    date_ajout?: Date;
    statut?: string;
}

export class UtilisateurQuartierModel {
    // Récupérer tous les quartiers d'un utilisateur
    static async findByUserId(utilisateurId: number): Promise<UtilisateurQuartier[]> {
        try {
            console.log(`Model: Finding quartiers for user ${utilisateurId}`);
            const query = `SELECT uq.*, q.nom_quartier, q.ville, q.code_postal
                FROM "UtilisateurQuartier" uq
                JOIN "Quartier" q ON uq.quartier_id = q.id
                WHERE uq.utilisateur_id = $1 AND uq.statut = 'actif'
                ORDER BY uq.est_principal DESC, q.ville, q.nom_quartier`;
            console.log(`Model: Executing query: ${query} with params: [${utilisateurId}]`);
            const result = await pool.query(query, [utilisateurId]);
            console.log(`Model: Found ${result.rows.length} quartiers for user ${utilisateurId}:`, JSON.stringify(result.rows, null, 2));
            return result.rows;
        } catch (error) {
            console.error('Error finding quartiers for user:', error);
            throw error;
        }
    }

    // Récupérer le quartier principal d'un utilisateur
    static async findPrincipalByUserId(utilisateurId: number): Promise<UtilisateurQuartier | null> {
        try {
            const result = await pool.query(
                `SELECT uq.*, q.nom_quartier, q.ville, q.code_postal
                FROM "UtilisateurQuartier" uq
                JOIN "Quartier" q ON uq.quartier_id = q.id
                WHERE uq.utilisateur_id = $1 AND uq.est_principal = true AND uq.statut = 'actif'`,
                [utilisateurId]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding principal quartier for user:', error);
            throw error;
        }
    }

    // Récupérer tous les utilisateurs d'un quartier
    static async findByQuartierId(quartierId: number): Promise<UtilisateurQuartier[]> {
        try {
            const result = await pool.query(
                `SELECT uq.*, u.nom, u.prenom, u.email
                FROM "UtilisateurQuartier" uq
                JOIN "Utilisateur" u ON uq.utilisateur_id = u.id
                WHERE uq.quartier_id = $1 AND uq.statut = 'actif'
                ORDER BY uq.est_principal DESC, u.nom, u.prenom`,
                [quartierId]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding users for quartier:', error);
            throw error;
        }
    }

    // Ajouter un quartier à un utilisateur
    static async create(data: UtilisateurQuartier): Promise<number> {
        try {
            // Si c'est le quartier principal, on s'assure qu'il n'y a pas d'autre quartier principal
            if (data.est_principal) {
                await pool.query(
                    'UPDATE "UtilisateurQuartier" SET est_principal = false WHERE utilisateur_id = $1',
                    [data.utilisateur_id]
                );
            }

            // Vérifier si la relation existe déjà
            const existingCheck = await pool.query(
                'SELECT id FROM "UtilisateurQuartier" WHERE utilisateur_id = $1 AND quartier_id = $2',
                [data.utilisateur_id, data.quartier_id]
            );

            if (existingCheck.rows.length > 0) {
                // Mettre à jour la relation existante
                await pool.query(
                    'UPDATE "UtilisateurQuartier" SET est_principal = $1, statut = $2 WHERE id = $3',
                    [data.est_principal || false, data.statut || 'actif', existingCheck.rows[0].id]
                );
                return existingCheck.rows[0].id;
            }

            // Créer une nouvelle relation
            const result = await pool.query(
                `INSERT INTO "UtilisateurQuartier"
                (utilisateur_id, quartier_id, est_principal, statut)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [
                    data.utilisateur_id,
                    data.quartier_id,
                    data.est_principal || false,
                    data.statut || 'actif'
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating utilisateur-quartier relation:', error);
            throw error;
        }
    }

    // Mettre à jour une relation utilisateur-quartier
    static async update(id: number, data: Partial<UtilisateurQuartier>): Promise<boolean> {
        try {
            // Si on définit ce quartier comme principal, on s'assure qu'il n'y a pas d'autre quartier principal
            if (data.est_principal) {
                const relation = await pool.query(
                    'SELECT utilisateur_id FROM "UtilisateurQuartier" WHERE id = $1',
                    [id]
                );

                if (relation.rows.length > 0) {
                    await pool.query(
                        'UPDATE "UtilisateurQuartier" SET est_principal = false WHERE utilisateur_id = $1 AND id != $2',
                        [relation.rows[0].utilisateur_id, id]
                    );
                }
            }

            // Préparer les champs à mettre à jour
            const fields: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (data.est_principal !== undefined) {
                fields.push(`est_principal = $${paramIndex++}`);
                values.push(data.est_principal);
            }

            if (data.statut !== undefined) {
                fields.push(`statut = $${paramIndex++}`);
                values.push(data.statut);
            }

            // Si aucun champ à mettre à jour, retourner true
            if (fields.length === 0) {
                return true;
            }

            // Ajouter l'ID à la fin des paramètres
            values.push(id);

            const result = await pool.query(
                `UPDATE "UtilisateurQuartier" SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                values
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating utilisateur-quartier relation:', error);
            throw error;
        }
    }

    // Supprimer une relation utilisateur-quartier
    static async delete(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                'DELETE FROM "UtilisateurQuartier" WHERE id = $1',
                [id]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting utilisateur-quartier relation:', error);
            throw error;
        }
    }

    // Désactiver une relation utilisateur-quartier
    static async deactivate(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "UtilisateurQuartier" SET statut = \'inactif\' WHERE id = $1',
                [id]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error deactivating utilisateur-quartier relation:', error);
            throw error;
        }
    }

    // Définir un quartier comme principal pour un utilisateur
    static async setAsPrincipal(utilisateurId: number, quartierId: number): Promise<boolean> {
        try {
            // D'abord, on met tous les quartiers de l'utilisateur comme non principaux
            await pool.query(
                'UPDATE "UtilisateurQuartier" SET est_principal = false WHERE utilisateur_id = $1',
                [utilisateurId]
            );

            // Ensuite, on définit le quartier spécifié comme principal
            const result = await pool.query(
                'UPDATE "UtilisateurQuartier" SET est_principal = true WHERE utilisateur_id = $1 AND quartier_id = $2',
                [utilisateurId, quartierId]
            );

            // Si la relation n'existe pas encore, on la crée
            if (result.rowCount === 0) {
                await this.create({
                    utilisateur_id: utilisateurId,
                    quartier_id: quartierId,
                    est_principal: true,
                    statut: 'actif'
                });
            }

            // Mettre à jour le quartier_id dans la table Utilisateur
            await pool.query(
                'UPDATE "Utilisateur" SET quartier_id = $1 WHERE id = $2',
                [quartierId, utilisateurId]
            );

            return true;
        } catch (error) {
            console.error('Error setting quartier as principal:', error);
            throw error;
        }
    }
}

export default UtilisateurQuartierModel;
