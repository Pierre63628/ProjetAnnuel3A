import pool from '../config/db.js';

export interface Quartier {
    id?: number;
    nom_quartier: string;
    ville?: string;
    code_postal?: string;
    description?: string;
    created_at?: Date;
    updated_at?: Date;
}

export class QuartierModel {
    // Récupérer tous les quartiers
    static async findAll(): Promise<Quartier[]> {
        try {
            console.log('Model: Finding all quartiers');
            const query = 'SELECT * FROM "Quartier" ORDER BY ville, nom_quartier';
            console.log(`Model: Executing query: ${query}`);
            const result = await pool.query(query);
            console.log(`Model: Found ${result.rows.length} quartiers:`, result.rows);
            return result.rows;
        } catch (error) {
            console.error('Error finding quartiers:', error);
            throw error;
        }
    }

    // Récupérer tous les quartiers par ville
    static async findByVille(ville: string): Promise<Quartier[]> {
        try {
            const result = await pool.query(
                'SELECT * FROM "Quartier" WHERE ville = $1 ORDER BY nom_quartier',
                [ville]
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding quartiers by ville:', error);
            throw error;
        }
    }

    // Récupérer un quartier par ID
    static async findById(id: number): Promise<Quartier | null> {
        try {
            const result = await pool.query(
                'SELECT * FROM "Quartier" WHERE id = $1',
                [id]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding quartier by id:', error);
            throw error;
        }
    }

    // Créer un nouveau quartier
    static async create(quartierData: Quartier): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "Quartier"
                (nom_quartier, ville, code_postal, description)
                VALUES ($1, $2, $3, $4) RETURNING id`,
                [
                    quartierData.nom_quartier,
                    quartierData.ville || null,
                    quartierData.code_postal || null,
                    quartierData.description || null
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating quartier:', error);
            throw error;
        }
    }

    // Mettre à jour un quartier
    static async update(id: number, quartierData: Partial<Quartier>): Promise<boolean> {
        try {
            // Préparer les champs à mettre à jour
            const fields: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            // Ajouter chaque champ non-null à la requête
            if (quartierData.nom_quartier !== undefined) {
                fields.push(`nom_quartier = $${paramIndex++}`);
                values.push(quartierData.nom_quartier);
            }

            if (quartierData.ville !== undefined) {
                fields.push(`ville = $${paramIndex++}`);
                values.push(quartierData.ville);
            }

            if (quartierData.code_postal !== undefined) {
                fields.push(`code_postal = $${paramIndex++}`);
                values.push(quartierData.code_postal);
            }

            if (quartierData.description !== undefined) {
                fields.push(`description = $${paramIndex++}`);
                values.push(quartierData.description);
            }



            // Si aucun champ à mettre à jour, retourner true
            if (fields.length === 0) {
                return true;
            }

            // Ajouter l'ID à la fin des paramètres
            values.push(id);

            const result = await pool.query(
                `UPDATE "Quartier" SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                values
            );

            return result.rowCount > 0;
        } catch (error) {
            console.error('Error updating quartier:', error);
            throw error;
        }
    }

    // Supprimer un quartier
    static async delete(id: number): Promise<boolean> {
        try {
            // Vérifier si des utilisateurs sont rattachés à ce quartier
            const usersCheck = await pool.query(
                'SELECT COUNT(*) FROM "Utilisateur" WHERE quartier_id = $1',
                [id]
            );

            if (parseInt(usersCheck.rows[0].count) > 0) {
                throw new Error('Ce quartier ne peut pas être supprimé car des utilisateurs y sont rattachés');
            }

            // Vérifier si des utilisateurs ont ce quartier comme quartier secondaire
            const secondaryCheck = await pool.query(
                'SELECT COUNT(*) FROM "UtilisateurQuartier" WHERE quartier_id = $1',
                [id]
            );

            if (parseInt(secondaryCheck.rows[0].count) > 0) {
                throw new Error('Ce quartier ne peut pas être supprimé car des utilisateurs y sont rattachés comme quartier secondaire');
            }

            const result = await pool.query(
                'DELETE FROM "Quartier" WHERE id = $1',
                [id]
            );

            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting quartier:', error);
            throw error;
        }
    }

    // Rechercher des quartiers par nom, ville ou code postal
    static async search(query: string): Promise<Quartier[]> {
        try {
            const searchTerm = `%${query}%`;
            const result = await pool.query(
                `SELECT * FROM "Quartier"
                WHERE (nom_quartier ILIKE $1 OR ville ILIKE $1 OR code_postal ILIKE $1)
                ORDER BY ville, nom_quartier`,
                [searchTerm]
            );
            return result.rows;
        } catch (error) {
            console.error('Error searching quartiers:', error);
            throw error;
        }
    }
}

export default QuartierModel;
