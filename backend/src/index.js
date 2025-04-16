import express from 'express';
import cors from 'cors';
import pg from 'pg';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Fonctions de hachage et vérification de mot de passe avec crypto
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

const verifyPassword = (password, hashedPassword) => {
    if (hashedPassword.includes(':')) {
        const [salt, storedHash] = hashedPassword.split(':');
        const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
        return storedHash === hash;
    }
    return false;
};

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration JWT
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'nextdoorbuddy_access_secret_key_2024';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'nextdoorbuddy_refresh_secret_key_2024';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// Connexion à la base de données
const { Pool } = pg;
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'rootpass',
    database: process.env.DB_NAME || 'nextdoorbuddy',
    max: 20,
    idleTimeoutMillis: 30000
});

// Vérifier la connexion à la base de données
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    }
});

// Fonction utilitaire pour calculer la date d'expiration
const calculateExpiryDate = (expiresIn) => {
    let expiryDate = new Date();

    if (typeof expiresIn === 'string') {
        const unit = expiresIn.slice(-1);
        const value = parseInt(expiresIn.slice(0, -1));

        switch (unit) {
            case 'd': // jours
                expiryDate.setDate(expiryDate.getDate() + value);
                break;
            case 'h': // heures
                expiryDate.setHours(expiryDate.getHours() + value);
                break;
            case 'm': // minutes
                expiryDate.setMinutes(expiryDate.getMinutes() + value);
                break;
            default:
                // Par défaut, 7 jours
                expiryDate.setDate(expiryDate.getDate() + 7);
        }
    } else {
        // Si c'est un nombre (en secondes)
        expiryDate.setSeconds(expiryDate.getSeconds() + expiresIn);
    }

    return expiryDate;
};

// Middleware d'authentification
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: 'Accès non autorisé. Token manquant.' });
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_ACCESS_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token invalide ou expiré.' });
            }

            // Vérifier si l'utilisateur existe toujours
            const { rows } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [decoded.userId]);
            if (rows.length === 0) {
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            // Ajouter l'utilisateur à la requête
            req.user = rows[0];
            next();
        });
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de l\'authentification.' });
    }
};

// Routes d'authentification
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier si l'utilisateur existe
        const { rows } = await pool.query('SELECT * FROM "Utilisateur" WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
        }

        const user = rows[0];

        // Vérifier le mot de passe
        if (user.password.startsWith('$2')) {
            // Conversion des mots de passe bcrypt vers crypto
            const newHashedPassword = hashPassword(password);
            await pool.query('UPDATE "Utilisateur" SET password = $1 WHERE id = $2', [newHashedPassword, user.id]);
        } else {
            // Vérification normale avec crypto
            const isPasswordValid = verifyPassword(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
            }
        }

        // Générer les tokens
        const accessToken = jwt.sign(
            { userId: user.id },
            JWT_ACCESS_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN }
        );

        // Calculer la date d'expiration du token de rafraîchissement
        const expiryDate = calculateExpiryDate(JWT_REFRESH_EXPIRES_IN);

        // Sauvegarder le token de rafraîchissement dans la base de données
        await pool.query(
            'INSERT INTO "RefreshToken" (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, refreshToken, expiryDate]
        );

        // Retourner les tokens et les informations de l'utilisateur
        res.status(200).json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                email: user.email,
                adresse: user.adresse,
                telephone: user.telephone,
                date_naissance: user.date_naissance,
                quartier_id: user.quartier_id,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la connexion.' });
    }
});

app.post('/api/auth/register', async (req, res) => {
    try {
        const { nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id } = req.body;

        // Validations
        if (!nom || !prenom || !email || !password) {
            return res.status(400).json({ message: 'Nom, prénom, email et mot de passe sont requis.' });
        }

        // Valider l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Format d\'email invalide.' });
        }

        // Valider le mot de passe
        if (password.length < 8) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
        }

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChar = /[\W_]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.' });
        }

        // Valider l'adresse (obligatoire pour une application de quartier)
        if (!adresse) {
            return res.status(400).json({ message: 'L\'adresse est requise pour une application de quartier.' });
        }

        // Valider le téléphone (si fourni)
        if (telephone && !/^[0-9]{10}$/.test(telephone)) {
            return res.status(400).json({ message: 'Le numéro de téléphone doit contenir 10 chiffres.' });
        }

        // Vérifier si l'email existe déjà
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE email = $1', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hacher le mot de passe
        const hashedPassword = hashPassword(password);

        // Créer le nouvel utilisateur
        const result = await pool.query(
            `INSERT INTO "Utilisateur"
            (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
                nom,
                prenom,
                email,
                hashedPassword,
                adresse || null,
                date_naissance ? new Date(date_naissance) : null,
                telephone || null,
                quartier_id || null
            ]
        );

        const userId = result.rows[0].id;

        // Générer les tokens
        const accessToken = jwt.sign(
            { userId },
            JWT_ACCESS_SECRET,
            { expiresIn: JWT_ACCESS_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { userId },
            JWT_REFRESH_SECRET,
            { expiresIn: JWT_REFRESH_EXPIRES_IN }
        );

        // Calculer la date d'expiration du token de rafraîchissement
        const expiryDate = calculateExpiryDate(JWT_REFRESH_EXPIRES_IN);

        // Sauvegarder le token de rafraîchissement dans la base de données
        await pool.query(
            'INSERT INTO "RefreshToken" (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [userId, refreshToken, expiryDate]
        );

        // Retourner les tokens et les informations de l'utilisateur
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            accessToken,
            refreshToken,
            user: {
                id: userId,
                nom,
                prenom,
                email,
                adresse,
                telephone,
                date_naissance,
                quartier_id,
                role: 'user' // Par défaut, les nouveaux utilisateurs ont le rôle 'user'
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'inscription.' });
    }
});

app.post('/api/auth/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Token de rafraîchissement requis.' });
        }

        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token de rafraîchissement invalide.' });
            }

            const userId = decoded.userId;

            // Vérifier si le token a été révoqué
            const { rows: tokenRecords } = await pool.query(
                'SELECT * FROM "RefreshToken" WHERE token = $1 AND revoked = TRUE',
                [refreshToken]
            );

            if (tokenRecords.length > 0) {
                return res.status(403).json({ message: 'Token de rafraîchissement révoqué.' });
            }

            // Vérifier si l'utilisateur existe toujours
            const { rows: users } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [userId]);
            if (users.length === 0) {
                // Marquer le token comme révoqué si l'utilisateur n'existe plus
                await pool.query(
                    'UPDATE "RefreshToken" SET revoked = TRUE WHERE token = $1',
                    [refreshToken]
                );
                return res.status(404).json({ message: 'Utilisateur non trouvé.' });
            }

            // Générer un nouveau token d'accès
            const newAccessToken = jwt.sign(
                { userId },
                JWT_ACCESS_SECRET,
                { expiresIn: JWT_ACCESS_EXPIRES_IN }
            );

            // Retourner le nouveau token d'accès
            res.status(200).json({
                accessToken: newAccessToken
            });
        });
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
        res.status(500).json({ message: 'Erreur serveur lors du rafraîchissement du token.' });
    }
});

app.post('/api/auth/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ message: 'Token de rafraîchissement requis.' });
        }

        // Révoquer le token de rafraîchissement
        await pool.query('UPDATE "RefreshToken" SET revoked = TRUE WHERE token = $1', [refreshToken]);

        res.status(200).json({ message: 'Déconnexion réussie.' });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la déconnexion.' });
    }
});

app.get('/api/auth/me', authenticateJWT, (req, res) => {
    try {
        // L'utilisateur est déjà attaché à la requête par le middleware authenticateJWT
        const user = req.user;

        // Supprimer le mot de passe de la réponse
        const { password, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des informations utilisateur.' });
    }
});

// Route pour récupérer tous les quartiers
app.get('/api/quartiers', async (_, res) => {
    try {
        // Récupérer les quartiers depuis la base de données
        const { rows } = await pool.query('SELECT * FROM "Quartier" ORDER BY nom_quartier');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers.' });
    }
});

// Route pour récupérer un quartier par ID
app.get('/api/quartiers/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { rows } = await pool.query('SELECT * FROM "Quartier" WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du quartier.' });
    }
});

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (_, res) => {
    res.send('API NextDoorBuddy fonctionne correctement!');
});

// Routes pour la gestion des utilisateurs

// Récupérer tous les utilisateurs (admin seulement)
app.get('/api/users', authenticateJWT, async (req, res) => {
    try {
        // Vérifier si l'utilisateur est admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous devez être administrateur.' });
        }

        const { rows } = await pool.query('SELECT * FROM "Utilisateur" ORDER BY nom, prenom');

        // Supprimer les mots de passe de la réponse
        const usersWithoutPasswords = rows.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });

        res.status(200).json(usersWithoutPasswords);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des utilisateurs.' });
    }
});

// Récupérer un utilisateur par ID
app.get('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à accéder à ces informations
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez accéder qu\'à vos propres informations.' });
        }

        const { rows } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const user = rows[0];

        // Supprimer le mot de passe de la réponse
        const { password, ...userWithoutPassword } = user;

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération de l\'utilisateur.' });
    }
});

// Mettre à jour un utilisateur
app.put('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres informations.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [id]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const existingUser = existingUsers[0];

        // Extraire les données à mettre à jour
        const {
            nom, prenom, email, password, adresse,
            date_naissance, telephone, quartier_id, role
        } = req.body;

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email && email !== existingUser.email) {
            const { rows: usersWithEmail } = await pool.query('SELECT * FROM "Utilisateur" WHERE email = $1', [email]);
            if (usersWithEmail.length > 0 && usersWithEmail[0].id !== id) {
                return res.status(409).json({ message: 'Cet email est déjà utilisé par un autre utilisateur.' });
            }
        }

        // Seul un admin peut changer le rôle d'un utilisateur
        if (role !== undefined && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Seul un administrateur peut modifier le rôle d\'un utilisateur.' });
        }

        // Préparer les champs à mettre à jour
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (nom !== undefined) {
            fields.push(`nom = $${paramIndex++}`);
            values.push(nom);
        }

        if (prenom !== undefined) {
            fields.push(`prenom = $${paramIndex++}`);
            values.push(prenom);
        }

        if (email !== undefined) {
            fields.push(`email = $${paramIndex++}`);
            values.push(email);
        }

        if (password !== undefined) {
            fields.push(`password = $${paramIndex++}`);
            values.push(hashPassword(password));
        }

        if (adresse !== undefined) {
            fields.push(`adresse = $${paramIndex++}`);
            values.push(adresse);
        }

        if (date_naissance !== undefined) {
            fields.push(`date_naissance = $${paramIndex++}`);
            values.push(date_naissance ? new Date(date_naissance) : null);
        }

        if (telephone !== undefined) {
            fields.push(`telephone = $${paramIndex++}`);
            values.push(telephone);
        }

        if (quartier_id !== undefined) {
            fields.push(`quartier_id = $${paramIndex++}`);
            values.push(quartier_id);
        }

        if (role !== undefined && req.user.role === 'admin') {
            fields.push(`role = $${paramIndex++}`);
            values.push(role);
        }

        // Si aucun champ à mettre à jour, retourner une erreur
        if (fields.length === 0) {
            return res.status(400).json({ message: 'Aucune donnée à mettre à jour.' });
        }

        // Ajouter l'ID à la fin des paramètres
        values.push(id);

        // Mettre à jour l'utilisateur
        const { rows: updatedUsers } = await pool.query(
            `UPDATE "Utilisateur" SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        if (updatedUsers.length === 0) {
            return res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur.' });
        }

        // Supprimer le mot de passe de la réponse
        const { password: _, ...userWithoutPassword } = updatedUsers[0];

        res.status(200).json({
            message: 'Utilisateur mis à jour avec succès',
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'utilisateur.' });
    }
});

// Supprimer un utilisateur
app.delete('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Vérifier si l'utilisateur est autorisé à supprimer ce compte
        if (req.user.id !== id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez supprimer que votre propre compte.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [id]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Révoquer tous les tokens de l'utilisateur
        await pool.query('UPDATE "RefreshToken" SET revoked = TRUE WHERE user_id = $1', [id]);

        // Supprimer l'utilisateur
        const { rowCount } = await pool.query('DELETE FROM "Utilisateur" WHERE id = $1', [id]);

        if (rowCount === 0) {
            return res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur.' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
});

// Routes pour la gestion des quartiers d'utilisateurs

// Récupérer tous les quartiers d'un utilisateur
app.get('/api/users/:userId/quartiers', authenticateJWT, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        console.log(`Backend: Getting quartiers for user ${userId}`);

        // Vérifier si l'utilisateur est autorisé à voir ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            console.log(`Backend: Access denied for user ${req.user.id} trying to access quartiers of user ${userId}`);
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez voir que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [userId]);
        if (existingUsers.length === 0) {
            console.log(`Backend: User ${userId} not found`);
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Récupérer les quartiers de l'utilisateur
        const { rows: quartiers } = await pool.query(
            `SELECT uq.*, q.nom_quartier, q.ville, q.code_postal
            FROM "UtilisateurQuartier" uq
            JOIN "Quartier" q ON uq.quartier_id = q.id
            WHERE uq.utilisateur_id = $1 AND uq.statut = 'actif'
            ORDER BY uq.est_principal DESC, q.ville, q.nom_quartier`,
            [userId]
        );

        console.log(`Backend: Found ${quartiers.length} quartiers for user ${userId}:`, quartiers);
        res.status(200).json(quartiers);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers de l\'utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers de l\'utilisateur.' });
    }
});

// Ajouter un quartier à un utilisateur
app.post('/api/users/:userId/quartiers', authenticateJWT, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { quartier_id, est_principal } = req.body;

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si le quartier existe
        const { rows: existingQuartiers } = await pool.query('SELECT * FROM "Quartier" WHERE id = $1', [quartier_id]);
        if (existingQuartiers.length === 0) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        // Si c'est le quartier principal, mettre tous les autres quartiers comme non principaux
        if (est_principal) {
            await pool.query(
                'UPDATE "UtilisateurQuartier" SET est_principal = false WHERE utilisateur_id = $1',
                [userId]
            );
        }

        // Vérifier si la relation existe déjà
        const { rows: existingRelations } = await pool.query(
            'SELECT id FROM "UtilisateurQuartier" WHERE utilisateur_id = $1 AND quartier_id = $2',
            [userId, quartier_id]
        );

        let id;
        if (existingRelations.length > 0) {
            // Mettre à jour la relation existante
            await pool.query(
                'UPDATE "UtilisateurQuartier" SET est_principal = $1, statut = \'actif\' WHERE id = $2',
                [est_principal || false, existingRelations[0].id]
            );
            id = existingRelations[0].id;
        } else {
            // Créer une nouvelle relation
            const result = await pool.query(
                `INSERT INTO "UtilisateurQuartier"
                (utilisateur_id, quartier_id, est_principal, statut)
                VALUES ($1, $2, $3, 'actif') RETURNING id`,
                [userId, quartier_id, est_principal || false]
            );
            id = result.rows[0].id;
        }

        // Si c'est le quartier principal, mettre à jour le quartier_id dans la table Utilisateur
        if (est_principal) {
            await pool.query(
                'UPDATE "Utilisateur" SET quartier_id = $1 WHERE id = $2',
                [quartier_id, userId]
            );
        }

        res.status(201).json({
            message: 'Quartier ajouté avec succès à l\'utilisateur.',
            id
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'ajout du quartier.' });
    }
});

// Définir un quartier comme principal pour un utilisateur
app.put('/api/users/:userId/quartiers/:quartierId/principal', authenticateJWT, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const quartierId = parseInt(req.params.quartierId);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si le quartier existe
        const { rows: existingQuartiers } = await pool.query('SELECT * FROM "Quartier" WHERE id = $1', [quartierId]);
        if (existingQuartiers.length === 0) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        // D'abord, on met tous les quartiers de l'utilisateur comme non principaux
        await pool.query(
            'UPDATE "UtilisateurQuartier" SET est_principal = false WHERE utilisateur_id = $1',
            [userId]
        );

        // Ensuite, on définit le quartier spécifié comme principal
        const { rowCount } = await pool.query(
            'UPDATE "UtilisateurQuartier" SET est_principal = true WHERE utilisateur_id = $1 AND quartier_id = $2',
            [userId, quartierId]
        );

        // Si la relation n'existe pas encore, on la crée
        if (rowCount === 0) {
            await pool.query(
                `INSERT INTO "UtilisateurQuartier"
                (utilisateur_id, quartier_id, est_principal, statut)
                VALUES ($1, $2, true, 'actif')`,
                [userId, quartierId]
            );
        }

        // Mettre à jour le quartier_id dans la table Utilisateur
        await pool.query(
            'UPDATE "Utilisateur" SET quartier_id = $1 WHERE id = $2',
            [quartierId, userId]
        );

        res.status(200).json({ message: 'Quartier défini comme principal avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la définition du quartier comme principal:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la définition du quartier comme principal.' });
    }
});

// Supprimer un quartier d'un utilisateur
app.delete('/api/users/:userId/quartiers/:relationId', authenticateJWT, async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const relationId = parseInt(req.params.relationId);

        // Vérifier si l'utilisateur est autorisé à modifier ces informations
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que vos propres quartiers.' });
        }

        // Vérifier si l'utilisateur existe
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE id = $1', [userId]);
        if (existingUsers.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Vérifier si la relation existe et appartient à l'utilisateur
        const { rows: relations } = await pool.query(
            'SELECT * FROM "UtilisateurQuartier" WHERE id = $1 AND utilisateur_id = $2',
            [relationId, userId]
        );

        if (relations.length === 0) {
            return res.status(404).json({ message: 'Relation quartier-utilisateur non trouvée.' });
        }

        const relation = relations[0];

        // Empêcher la suppression du quartier principal
        if (relation.est_principal) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre quartier principal. Définissez d\'abord un autre quartier comme principal.' });
        }

        // Supprimer la relation
        const { rowCount } = await pool.query('DELETE FROM "UtilisateurQuartier" WHERE id = $1', [relationId]);

        if (rowCount === 0) {
            return res.status(500).json({ message: 'Erreur lors de la suppression du quartier.' });
        }

        res.status(200).json({ message: 'Quartier supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression du quartier.' });
    }
});

// Nettoyage périodique des tokens expirés (toutes les 24 heures)
setInterval(async () => {
    try {
        await pool.query('DELETE FROM "RefreshToken" WHERE expires_at < NOW() OR revoked = TRUE');
        console.log('Nettoyage des tokens expirés effectué');
    } catch (error) {
        console.error('Erreur lors du nettoyage des tokens expirés:', error);
    }
}, 24 * 60 * 60 * 1000);

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
