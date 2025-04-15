import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Charger les variables d'environnement
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
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'user',
    password: process.env.DB_PASSWORD || 'rootpass',
    database: process.env.DB_NAME || 'nextdoorbuddy',
    max: 20, // Nombre maximum de clients dans le pool
    idleTimeoutMillis: 30000 // Temps d'inactivité avant de fermer un client
});

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
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
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
        let expiryDate = new Date();
        const expiresIn = JWT_REFRESH_EXPIRES_IN;

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

        // Vérifier si l'email existe déjà
        const { rows: existingUsers } = await pool.query('SELECT * FROM "Utilisateur" WHERE email = $1', [email]);
        if (existingUsers.length > 0) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

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
        let expiryDate = new Date();
        const expiresIn = JWT_REFRESH_EXPIRES_IN;

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
                email
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

        // Approche stateless : Vérifier uniquement la validité du token par sa signature
        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Token de rafraîchissement invalide.' });
            }

            const userId = decoded.userId;

            // Vérification optionnelle : vérifier si le token a été révoqué (approche hybride)
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
            const expiresIn = JWT_ACCESS_EXPIRES_IN;
            const newAccessToken = jwt.sign(
                { userId },
                JWT_ACCESS_SECRET,
                { expiresIn }
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

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.send('API NextDoorBuddy fonctionne correctement!');
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
