import pool from '../config/db.js';
import { Quartier } from '../models/quartier.model.js';


export class GeoService {

    static async findQuartierByCoordinates(longitude: number, latitude: number): Promise<Quartier | null> {
        try {
            const query = `
                SELECT id, nom_quartier, ville, code_postal, description,
                       ST_AsGeoJSON(geom)::json AS geom
                FROM "Quartier"
                WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
                LIMIT 1
            `;

            const result = await pool.query(query, [longitude, latitude]);

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche du quartier par coordonnées:', error);
            throw error;
        }
    }
}

export default GeoService;
