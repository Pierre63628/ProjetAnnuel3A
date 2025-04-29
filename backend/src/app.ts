import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import quartierRoutes from './routes/quartier.routes.js';
import utilisateurQuartierRoutes from './routes/utilisateur-quartier.routes.js';
import evenementRoutes from './routes/evenement.routes.js';

// Charger les variables d'environnement
dotenv.config();

// Créer l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quartiers', quartierRoutes);
app.use('/api/users-quartiers', utilisateurQuartierRoutes);
app.use('/api/evenements', evenementRoutes);

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (_, res) => {
    res.send('API NextDoorBuddy fonctionne correctement!');
});

export default app;
