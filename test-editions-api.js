const axios = require('axios');

async function testEditionsAPI() {
    try {
        console.log('=== Test de l\'API des éditions ===');
        
        // URL de base (ajustez selon votre configuration)
        const baseURL = 'http://localhost:3001';
        
        // Test sans token (devrait échouer avec 401)
        console.log('\n1. Test sans token...');
        try {
            const response = await axios.get(`${baseURL}/journal/editions`);
            console.log('❌ Erreur: La requête devrait échouer sans token');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correct: 401 Unauthorized (token requis)');
            } else {
                console.log('❌ Erreur inattendue:', error.response?.status, error.response?.data);
            }
        }
        
        // Test avec un token invalide
        console.log('\n2. Test avec token invalide...');
        try {
            const response = await axios.get(`${baseURL}/journal/editions`, {
                headers: {
                    'Authorization': 'Bearer invalid-token'
                }
            });
            console.log('❌ Erreur: La requête devrait échouer avec un token invalide');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Correct: 401 Unauthorized (token invalide)');
            } else {
                console.log('❌ Erreur inattendue:', error.response?.status, error.response?.data);
            }
        }
        
        // Test de la route avec un token valide (vous devrez ajuster le token)
        console.log('\n3. Test avec token valide...');
        console.log('⚠️  Pour tester avec un token valide, vous devez:');
        console.log('   - Vous connecter via l\'interface web');
        console.log('   - Copier le token depuis localStorage');
        console.log('   - L\'ajouter dans ce script');
        
        // Exemple avec un token (à remplacer par un vrai token)
        /*
        const validToken = 'votre-token-ici';
        try {
            const response = await axios.get(`${baseURL}/journal/editions`, {
                headers: {
                    'Authorization': `Bearer ${validToken}`
                }
            });
            console.log('✅ Succès:', response.status);
            console.log('📊 Données:', response.data);
        } catch (error) {
            console.log('❌ Erreur:', error.response?.status, error.response?.data);
        }
        */
        
    } catch (error) {
        console.error('❌ Erreur générale:', error.message);
    }
}

testEditionsAPI(); 