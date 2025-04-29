// This file serves as a bridge between the JavaScript and TypeScript code
// It imports the server configuration from app.ts and starts the server

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticateJWT } from './middlewares/auth.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import quartierRoutes from './routes/quartier.routes.js';
import utilisateurQuartierRoutes from './routes/utilisateur-quartier.routes.js';
import evenementRoutes from './routes/evenement.routes.js';

// Import database connection
import './config/db.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

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

// Root route
app.get('/', (_, res) => {
    res.send('API NextDoorBuddy fonctionne correctement!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
