import pool from '../config/db.js';

export interface Quartier {
    id?: number;
    nom_quartier: string;
    ville?: string;
    code_postal?: string;
}

export class QuartierModel {
    // Récupérer tous les quartiers
    static async findAll(): Promise<Quartier[]> {
        try {
            const result = await pool.query(
                'SELECT * FROM "Quartier" ORDER BY nom_quartier'
            );
            return result.rows;
        } catch (error) {
            console.error('Error finding quartiers:', error);
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
}

export default QuartierModel;
