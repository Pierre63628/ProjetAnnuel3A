import pool from '../config/db';
import bcrypt from 'bcrypt';

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
            // Hachage du mot de passe
            const hashedPassword = await bcrypt.hash(userData.password!, 10);

            const result = await pool.query(
                `INSERT INTO "Utilisateur"
                (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                [
                    userData.nom,
                    userData.prenom,
                    userData.email,
                    hashedPassword,
                    userData.adresse || null,
                    userData.date_naissance || null,
                    userData.telephone || null,
                    userData.quartier_id || null
                ]
            );

            return result.rows[0].id;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Vérifier le mot de passe
    static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

export default UserModel;
