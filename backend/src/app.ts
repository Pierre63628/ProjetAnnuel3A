import express, { RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import quartierRoutes from './routes/quartier.routes.js';
import utilisateurQuartierRoutes from './routes/utilisateur-quartier.routes.js';
import evenementRoutes from './routes/evenement.routes.js';
import trocRoutes from './routes/troc.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import messagingRoutes from './routes/messaging.routes.js';


import { errorHandler } from './controllers/errors.controller.js';
import { ApiErrors } from "./errors/ApiErrors.js";

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/quartiers', quartierRoutes);
app.use('/api/users-quartiers', utilisateurQuartierRoutes);
app.use('/api/evenements', evenementRoutes);
app.use('/api/troc', trocRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/messaging', messagingRoutes);

app.use((req, res, next) => {
    res.status(404).json({
        status: 404,
        message: "La ressource demandée est introuvable.",
    });
});

// Middleware de gestion des erreurs (à la fin)
app.use(errorHandler as unknown as RequestHandler);

export default app;
