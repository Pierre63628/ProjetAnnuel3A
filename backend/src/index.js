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
    host: process.env.DB_HOST || 'db',
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

// Données de test pour les quartiers (puisque la base de données n'est pas accessible)
const quartiersTest = [
    { id: 1, nom_quartier: 'Centre', ville: 'Paris', code_postal: '75001' },
    { id: 2, nom_quartier: 'Montmartre', ville: 'Paris', code_postal: '75018' },
    { id: 3, nom_quartier: 'Le Marais', ville: 'Paris', code_postal: '75004' },
    { id: 4, nom_quartier: 'Saint-Germain-des-Prés', ville: 'Paris', code_postal: '75006' },
    { id: 5, nom_quartier: 'Belleville', ville: 'Paris', code_postal: '75020' }
];

// Route pour récupérer tous les quartiers
app.get('/api/quartiers', (_, res) => {
    try {
        // Utiliser les données de test au lieu de la base de données
        res.status(200).json(quartiersTest);
    } catch (error) {
        console.error('Erreur lors de la récupération des quartiers:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des quartiers.' });
    }
});

// Route pour récupérer un quartier par ID
app.get('/api/quartiers/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const quartier = quartiersTest.find(q => q.id === id);

        if (!quartier) {
            return res.status(404).json({ message: 'Quartier non trouvé.' });
        }

        res.status(200).json(quartier);
    } catch (error) {
        console.error('Erreur lors de la récupération du quartier:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération du quartier.' });
    }
});

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (_, res) => {
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
