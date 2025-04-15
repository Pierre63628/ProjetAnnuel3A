import pool from '../config/db';

export interface RefreshToken {
    id?: number;
    user_id: number;
    token: string;
    expires_at: Date;
    created_at?: Date;
    revoked?: boolean;
}

export class TokenModel {
    // Créer un nouveau token de rafraîchissement
    static async create(tokenData: RefreshToken): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "RefreshToken"
                (user_id, token, expires_at)
                VALUES ($1, $2, $3) RETURNING id`,
                [
                    tokenData.user_id,
                    tokenData.token,
                    tokenData.expires_at
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating refresh token:', error);
            throw error;
        }
    }

    // Trouver un token par sa valeur
    static async findByToken(token: string): Promise<RefreshToken | null> {
        try {
            const result = await pool.query(
                'SELECT * FROM "RefreshToken" WHERE token = $1 AND revoked = FALSE',
                [token]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding token:', error);
            throw error;
        }
    }

    // Révoquer un token
    static async revokeToken(token: string): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "RefreshToken" SET revoked = TRUE WHERE token = $1',
                [token]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error revoking token:', error);
            throw error;
        }
    }

    // Révoquer tous les tokens d'un utilisateur
    static async revokeAllUserTokens(userId: number): Promise<boolean> {
        try {
            const result = await pool.query(
                'UPDATE "RefreshToken" SET revoked = TRUE WHERE user_id = $1',
                [userId]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error revoking user tokens:', error);
            throw error;
        }
    }

    // Supprimer les tokens expirés
    static async deleteExpiredTokens(): Promise<boolean> {
        try {
            const result = await pool.query(
                'DELETE FROM "RefreshToken" WHERE expires_at < NOW() OR revoked = TRUE'
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting expired tokens:', error);
            throw error;
        }
    }
}

export default TokenModel;
