import express, {RequestHandler} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import quartierRoutes from './routes/quartier.routes.js';
import utilisateurQuartierRoutes from './routes/utilisateur-quartier.routes.js';
import evenementRoutes from './routes/evenement.routes.js';

import { errorHandler } from './controllers/errors.controller.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quartiers', quartierRoutes);
app.use('/api/users-quartiers', utilisateurQuartierRoutes);
app.use('/api/evenements', evenementRoutes);

// Route de base
app.get('/', (_, res) => {
    res.send('API NextDoorBuddy fonctionne correctement!');
});

// Middleware de gestion des erreurs (à la fin)
app.use(errorHandler as unknown as RequestHandler);

export default app;
