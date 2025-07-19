// Script de test pour l'API journal
import fetch from 'node-fetch';

async function testJournalAPI() {
    try {
        console.log('🧪 Test de l\'API journal...');
        
        // Test 1: Récupérer les articles publics
        console.log('\n1. Test GET /api/journal/');
        const response1 = await fetch('http://localhost:3000/api/journal/');
        const data1 = await response1.json();
        console.log('Status:', response1.status);
        console.log('Response:', JSON.stringify(data1, null, 2));
        
        // Test 2: Récupérer les statistiques
        console.log('\n2. Test GET /api/journal/stats');
        const response2 = await fetch('http://localhost:3000/api/journal/stats');
        const data2 = await response2.json();
        console.log('Status:', response2.status);
        console.log('Response:', JSON.stringify(data2, null, 2));
        
        // Test 3: Test avec paramètre weekStart
        console.log('\n3. Test GET /api/journal/?weekStart=2024-01-15');
        const response3 = await fetch('http://localhost:3000/api/journal/?weekStart=2024-01-15');
        const data3 = await response3.json();
        console.log('Status:', response3.status);
        console.log('Response:', JSON.stringify(data3, null, 2));
        
    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testJournalAPI(); 