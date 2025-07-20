import pool from '../config/db.js';
import crypto from 'crypto';

export interface EmailVerification {
    id?: number;
    user_id: number;
    verification_code: string;
    expires_at: Date;
    attempts: number;
    created_at?: Date;
    used_at?: Date;
    is_used: boolean;
}

export class EmailVerificationModel {
    /**
     * Create a new email verification record
     */
    static async create(data: Omit<EmailVerification, 'id' | 'created_at' | 'used_at' | 'attempts' | 'is_used'>): Promise<number> {
        try {
            const result = await pool.query(
                `INSERT INTO "EmailVerification" 
                (user_id, verification_code, expires_at) 
                VALUES ($1, $2, $3) 
                RETURNING id`,
                [data.user_id, data.verification_code, data.expires_at]
            );
            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating email verification:', error);
            throw error;
        }
    }

    /**
     * Find verification record by user ID and code
     */
    static async findByUserAndCode(userId: number, code: string): Promise<EmailVerification | null> {
        try {
            const result = await pool.query(
                `SELECT * FROM "EmailVerification" 
                WHERE user_id = $1 AND verification_code = $2 AND is_used = FALSE
                ORDER BY created_at DESC 
                LIMIT 1`,
                [userId, code]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding verification by user and code:', error);
            throw error;
        }
    }

    /**
     * Find latest verification record for a user
     */
    static async findLatestByUser(userId: number): Promise<EmailVerification | null> {
        try {
            const result = await pool.query(
                `SELECT * FROM "EmailVerification" 
                WHERE user_id = $1 
                ORDER BY created_at DESC 
                LIMIT 1`,
                [userId]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding latest verification by user:', error);
            throw error;
        }
    }

    /**
     * Mark verification code as used
     */
    static async markAsUsed(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `UPDATE "EmailVerification" 
                SET is_used = TRUE, used_at = NOW() 
                WHERE id = $1`,
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error marking verification as used:', error);
            throw error;
        }
    }

    /**
     * Increment attempt count
     */
    static async incrementAttempts(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                `UPDATE "EmailVerification" 
                SET attempts = attempts + 1 
                WHERE id = $1`,
                [id]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('Error incrementing verification attempts:', error);
            throw error;
        }
    }

    /**
     * Check if code is expired
     */
    static isExpired(verification: EmailVerification): boolean {
        return new Date() > new Date(verification.expires_at);
    }

    /**
     * Check if maximum attempts reached
     */
    static isMaxAttemptsReached(verification: EmailVerification): boolean {
        const MAX_ATTEMPTS = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '3');
        return verification.attempts >= MAX_ATTEMPTS;
    }

    /**
     * Delete expired verification codes
     */
    static async deleteExpired(): Promise<number> {
        try {
            const result = await pool.query(
                `DELETE FROM "EmailVerification" 
                WHERE expires_at < NOW() AND is_used = FALSE`
            );
            return result.rowCount || 0;
        } catch (error) {
            console.error('Error deleting expired verifications:', error);
            throw error;
        }
    }

    /**
     * Count verification attempts in last hour for a user
     */
    static async countRecentAttempts(userId: number): Promise<number> {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) as count FROM "EmailVerification" 
                WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
                [userId]
            );
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error counting recent verification attempts:', error);
            throw error;
        }
    }

    /**
     * Generate a secure 6-digit verification code
     */
    static generateVerificationCode(): string {
        // Generate a cryptographically secure 6-digit code
        const buffer = crypto.randomBytes(3);
        const code = parseInt(buffer.toString('hex'), 16) % 1000000;
        return code.toString().padStart(6, '0');
    }

    /**
     * Calculate expiration time (15 minutes from now)
     */
    static calculateExpirationTime(): Date {
        const expiryMinutes = parseInt(process.env.VERIFICATION_CODE_EXPIRY || '15');
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + expiryMinutes);
        return expirationTime;
    }

    /**
     * Delete all verification codes for a user (cleanup after successful verification)
     */
    static async deleteAllForUser(userId: number): Promise<boolean> {
        try {
            await pool.query(
                `DELETE FROM "EmailVerification" WHERE user_id = $1`,
                [userId]
            );
            return true;
        } catch (error) {
            console.error('Error deleting verifications for user:', error);
            throw error;
        }
    }
}
