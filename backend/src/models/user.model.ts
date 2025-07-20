import pool from '../config/db.js';
import crypto from 'crypto';

export interface User {
    id?: number;
    nom: string;
    prenom: string;
    email: string;
    password?: string;
    adresse?: string;
    date_naissance?: Date;
    telephone?: string;
    quartier_id?: number;
    role?: string;
    email_verified?: boolean;
    email_verified_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}

export class UserModel {
    // Trouver un utilisateur par email
    static async findByEmail(email: string): Promise<User | null> {
        try {
            const result = await pool.query(
                'SELECT * FROM "Utilisateur" WHERE email = $1',
                [email]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Trouver un utilisateur par ID
    static async findById(id: number): Promise<User | null> {
        try {
            const result = await pool.query(
                'SELECT * FROM "Utilisateur" WHERE id = $1',
                [id]
            );
            return result.rows.length ? result.rows[0] : null;
        } catch (error) {
            console.error('Error finding user by id:', error);
            throw error;
        }
    }

    // Créer un nouvel utilisateur
    static async create(userData: User): Promise<number> {
        try {
            // Hachage du mot de passe avec crypto
            const hashedPassword = this.hashPassword(userData.password!);

            const result = await pool.query(
                `INSERT INTO "Utilisateur"
                (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id, email_verified)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
                [
                    userData.nom,
                    userData.prenom,
                    userData.email,
                    hashedPassword,
                    userData.adresse || null,
                    userData.date_naissance || null,
                    userData.telephone || null,
                    userData.quartier_id || null,
                    userData.email_verified || false
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Hacher un mot de passe avec crypto
    static hashPassword(password: string): string {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return `${salt}:${hash}`;
    }

    // Vérifier le mot de passe avec crypto
    static verifyPassword(plainPassword: string, hashedPassword: string): boolean {
        if (hashedPassword.startsWith('$2')) {
            // Ancien hash bcrypt - ne peut plus être vérifié sans bcrypt
            console.warn('Ancien hash bcrypt détecté. Veuillez mettre à jour le mot de passe.');
            return false;
        }

        if (hashedPassword.includes(':')) {
            // Hash crypto - utiliser crypto pour la vérification
            const [salt, storedHash] = hashedPassword.split(':');
            const hash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
            return storedHash === hash;
        }
        return false;
    }

    // Mettre à jour un utilisateur
    static async update(id: number, userData: Partial<User>): Promise<boolean> {
        try {
            // Préparer les champs à mettre à jour
            const fields: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            // Ajouter chaque champ non-null à la requête
            if (userData.nom !== undefined) {
                fields.push(`nom = $${paramIndex++}`);
                values.push(userData.nom);
            }

            if (userData.prenom !== undefined) {
                fields.push(`prenom = $${paramIndex++}`);
                values.push(userData.prenom);
            }

            if (userData.email !== undefined) {
                fields.push(`email = $${paramIndex++}`);
                values.push(userData.email);
            }

            if (userData.password !== undefined) {
                fields.push(`password = $${paramIndex++}`);
                values.push(this.hashPassword(userData.password));
            }

            if (userData.adresse !== undefined) {
                fields.push(`adresse = $${paramIndex++}`);
                values.push(userData.adresse);
            }


            if (userData.date_naissance !== undefined) {
                fields.push(`date_naissance = $${paramIndex++}`);
                values.push(userData.date_naissance);
            }

            if (userData.telephone !== undefined) {
                fields.push(`telephone = $${paramIndex++}`);
                values.push(userData.telephone);
            }

            if (userData.quartier_id !== undefined) {
                fields.push(`quartier_id = $${paramIndex++}`);
                values.push(userData.quartier_id);
            }

            if (userData.role !== undefined) {
                fields.push(`role = $${paramIndex++}`);
                values.push(userData.role);
            }

            if (userData.email_verified !== undefined) {
                fields.push(`email_verified = $${paramIndex++}`);
                values.push(userData.email_verified);
            }

            // Si aucun champ à mettre à jour, retourner true
            if (fields.length === 0) {
                return true;
            }

            // Ajouter l'ID à la fin des paramètres
            values.push(id);

            const result = await pool.query(
                `UPDATE "Utilisateur" SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
                values
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    // Supprimer un utilisateur
    static async delete(id: number): Promise<boolean> {
        try {
            const result = await pool.query(
                'DELETE FROM "Utilisateur" WHERE id = $1',
                [id]
            );

            return result.rowCount !== null && result.rowCount > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Récupérer tous les utilisateurs
    static async findAll(): Promise<User[]> {
        try {
            const result = await pool.query('SELECT * FROM "Utilisateur" ORDER BY nom, prenom');
            return result.rows;
        } catch (error) {
            console.error('Error finding all users:', error);
            throw error;
        }
    }

    // Récupérer tous les utilisateurs avec leurs informations de quartier
    static async findAllWithQuartier(): Promise<any[]> {
        try {
            const result = await pool.query(`
                SELECT
                    u.id,
                    u.nom,
                    u.prenom,
                    u.email,
                    u.adresse,
                    u.telephone,
                    u.date_naissance,
                    u.role,
                    u.email_verified,
                    u.email_verified_at,
                    u.created_at,
                    u.updated_at,
                    u.quartier_id,
                    q.nom_quartier,
                    q.ville,
                    q.code_postal
                FROM "Utilisateur" u
                LEFT JOIN "Quartier" q ON u.quartier_id = q.id
                ORDER BY
                    CASE WHEN q.nom_quartier IS NULL THEN 1 ELSE 0 END,
                    q.nom_quartier ASC,
                    u.nom ASC,
                    u.prenom ASC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error finding all users with quartier:', error);
            throw error;
        }
    }
}

export default UserModel;
