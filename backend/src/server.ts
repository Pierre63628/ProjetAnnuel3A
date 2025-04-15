import app from './app.js';
import pool from './config/db.js';
import { TokenModel } from './models/token.model.js';

const PORT = process.env.PORT || 3000;

// Vérifier la connexion à la base de données
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connexion à la base de données établie avec succès');
    }
});

// Nettoyage périodique des tokens expirés (toutes les 24 heures)
setInterval(async () => {
    try {
        await TokenModel.deleteExpiredTokens();
        console.log('Nettoyage des tokens expirés effectué');
    } catch (error) {
        console.error('Erreur lors du nettoyage des tokens expirés:', error);
    }
}, 24 * 60 * 60 * 1000);

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
