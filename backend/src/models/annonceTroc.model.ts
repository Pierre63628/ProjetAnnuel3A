import pool from '../config/db.js';

export interface AnnonceTroc {
    id?: number;
    titre: string;
    description: string;
    objet_propose: string;
    objet_recherche: string;
    images?: string[];
    date_publication: Date;
    quartier_id: number;
    utilisateur_id: number;
    statut: 'active' | 'inactive';
    type_annonce: 'offre' | 'demande';
    prix?: number;
    budget_max?: number;
    etat_produit?: string;
    categorie?: string;
    urgence?: string;
    mode_echange?: 'vente' | 'troc' | 'don';
    criteres_specifiques?: string;
    disponibilite?: string;
}

export class AnnonceTrocModel {
    static async create(data: AnnonceTroc): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "AnnonceTroc"
            (titre, description, objet_propose, objet_recherche, images, date_publication, quartier_id, utilisateur_id, statut, type_annonce, prix, budget_max, etat_produit, categorie, urgence, mode_echange, criteres_specifiques, disponibilite)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING id`,
                [
                    data.titre,
                    data.description,
                    data.objet_propose,
                    data.objet_recherche,
                    data.images || [],
                    data.date_publication,
                    data.quartier_id,
                    data.utilisateur_id,
                    data.statut,
                    data.type_annonce,
                    data.prix || null,
                    data.budget_max || null,
                    data.etat_produit || null,
                    data.categorie || null,
                    data.urgence || null,
                    data.mode_echange || null,
                    data.criteres_specifiques || null,
                    data.disponibilite || null
                ]
            );
            return result.rows[0].id;
        } catch (error) {
            console.error('Erreur lors de la création de l\'annonce de troc :', error);
            throw error;
        }
    }

    static async findByQuartier(quartierId: number): Promise<AnnonceTroc[]> {
        try {
            const result = await pool.query(
                `SELECT * FROM "AnnonceTroc"
             WHERE quartier_id = $1 AND statut = 'active'
             ORDER BY date_publication DESC`,
                [quartierId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces :', error);
            throw error;
        }
    }

    static async findByQuartierWithUser(quartierId: number): Promise<any[]> {
        try {
            const result = await pool.query(
                `SELECT a.*, u.nom, u.prenom
                 FROM "AnnonceTroc" a
                 JOIN "Utilisateur" u ON a.utilisateur_id = u.id
                 WHERE a.quartier_id = $1 AND a.statut = 'active'
                 ORDER BY a.date_publication DESC`,
                [quartierId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces avec utilisateur :', error);
            throw error;
        }
    }

    static async findByUser(utilisateurId: number): Promise<AnnonceTroc[]> {
        try {
            const result = await pool.query(
                `SELECT * FROM "AnnonceTroc"
                 WHERE utilisateur_id = $1
                 ORDER BY date_publication DESC`,
                [utilisateurId]
            );
            return result.rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des annonces de l\'utilisateur :', error);
            throw error;
        }
    }

    static async findById(id: number): Promise<AnnonceTroc | null> {
        try {
            const result = await pool.query(
                `SELECT * FROM "AnnonceTroc" WHERE id = $1`,
                [id]
            );
            return result.rows.length > 0 ? result.rows[0] : null;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'annonce par ID :', error);
            throw error;
        }
    }

    static async update(id: number, data: Partial<AnnonceTroc>): Promise<boolean> {
        try {
            const result = await pool.query(
                `UPDATE "AnnonceTroc"
                 SET titre = $1, description = $2, objet_propose = $3,
                     objet_recherche = $4, images = $5, type_annonce = $6,
                     prix = $7, budget_max = $8, etat_produit = $9, categorie = $10,
                     urgence = $11, mode_echange = $12, criteres_specifiques = $13,
                     disponibilite = $14, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $15`,
                [
                    data.titre,
                    data.description,
                    data.objet_propose,
                    data.objet_recherche,
                    data.images || [],
                    data.type_annonce,
                    data.prix || null,
                    data.budget_max || null,
                    data.etat_produit || null,
                    data.categorie || null,
                    data.urgence || null,
                    data.mode_echange || null,
                    data.criteres_specifiques || null,
                    data.disponibilite || null,
                    id
                ]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'annonce :', error);
            throw error;
        }
    }

    static async delete(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `DELETE FROM "AnnonceTroc" WHERE id = $1`,
                [id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'annonce :', error);
            throw error;
        }
    }

    // Méthodes admin
    static async findAll(): Promise<AnnonceTroc[]> {
        try {
            const result = await pool.query(`
                SELECT at.*, u.nom, u.prenom, u.email, q.nom_quartier
                FROM "AnnonceTroc" at
                LEFT JOIN "Utilisateur" u ON at.utilisateur_id = u.id
                LEFT JOIN "Quartier" q ON at.quartier_id = q.id
                ORDER BY at.date_publication DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error finding all trocs:', error);
            throw error;
        }
    }

    static async updateStatus(id: number, statut: 'active' | 'inactive'): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "AnnonceTroc" SET statut = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [statut, id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating troc status:', error);
            throw error;
        }
    }

    static async updateImages(id: number, images: string[]): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "AnnonceTroc" SET images = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [images, id]
            );
            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating troc images:', error);
            throw error;
        }
    }

    static async getStats(): Promise<{
        total: number;
        active: number;
        inactive: number;
        byCategory: Record<string, number>;
        byType: Record<string, number>;
    }> {
        try {
            const [totalResult, statusResult, categoryResult, typeResult] = await Promise.all([
                pool.query('SELECT COUNT(*) as count FROM "AnnonceTroc"'),
                pool.query('SELECT statut, COUNT(*) as count FROM "AnnonceTroc" GROUP BY statut'),
                pool.query('SELECT categorie, COUNT(*) as count FROM "AnnonceTroc" WHERE categorie IS NOT NULL GROUP BY categorie'),
                pool.query('SELECT type_annonce, COUNT(*) as count FROM "AnnonceTroc" GROUP BY type_annonce')
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
                acc[row.type_annonce] = parseInt(row.count);
                return acc;
            }, {});

            return {
                total,
                active: statusStats.active || 0,
                inactive: statusStats.inactive || 0,
                byCategory,
                byType
            };
        } catch (error) {
            console.error('Error getting troc stats:', error);
            throw error;
        }
    }

}