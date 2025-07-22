import { createServer } from 'http';
import app from './app.js';
import pool from './config/db.js';
import { connectToMongoDB } from './config/mongodb.js';
import { TokenModel } from './models/token.model.js';
import { WebSocketService } from './services/websocket.service.js';
import VerificationService from './services/verification.service.js';
import emailService from './services/email.service.js';

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = createServer(app);

// Test de connexion DB PostgreSQL
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('❌ Erreur de connexion à PostgreSQL:', err);
    } else {
        console.log('✅ Connexion à PostgreSQL établie');
    }
});

// Test de connexion MongoDB
connectToMongoDB()
    .then(() => {
        console.log('✅ Connexion à MongoDB établie');
    })
    .catch((error) => {
        console.error('❌ Erreur de connexion à MongoDB:', error);
    });

// Nettoyage des tokens expirés toutes les 24h
setInterval(async () => {
    try {
        await TokenModel.deleteExpiredTokens();
        console.log('🧹 Nettoyage des tokens expirés effectué');
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des tokens expirés:', error);
    }
}, 24 * 60 * 60 * 1000);

// Nettoyage des codes de vérification expirés toutes les heures
setInterval(async () => {
    try {
        await VerificationService.cleanupExpiredCodes();
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage des codes de vérification expirés:', error);
    }
}, 60 * 60 * 1000);

// Test email configuration at startup
emailService.testConnection().then(isValid => {
    if (isValid) {
        console.log('✅ Service email configuré et prêt');
    } else {
        console.warn('⚠️ Service email non configuré - les emails de vérification ne seront pas envoyés');
    }
}).catch(error => {
    console.error('❌ Erreur lors du test de configuration email:', error);
});

// Initialize WebSocket service
const webSocketService = new WebSocketService(server);


// Lancer le serveur
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`💬 WebSocket service initialized`);
});
