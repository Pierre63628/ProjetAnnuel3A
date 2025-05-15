import app from './app.js';
import pool from './config/db.js';
import { TokenModel } from './models/token.model.js';

const PORT = process.env.PORT || 3000;

// Test de connexion DB
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err);
    } else {
        console.log('✅ Connexion à la base de données établie');
    }
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

// Lancer le serveur
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
