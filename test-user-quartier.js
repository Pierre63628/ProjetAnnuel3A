import fetch from 'node-fetch';

async function testUserQuartier() {
    try {
        // Simuler une requête pour récupérer les informations utilisateur
        const response = await fetch('http://localhost:5174/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Ajoutez ici le token d'authentification si nécessaire
            }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log('=== INFORMATIONS UTILISATEUR ===');
            console.log('User data:', userData);
            console.log('Quartier ID:', userData.quartier_id);
            console.log('User ID:', userData.id);
        } else {
            console.log('Erreur lors de la récupération des données utilisateur:', response.status);
        }
    } catch (error) {
        console.error('Erreur:', error.message);
    }
}

testUserQuartier(); 