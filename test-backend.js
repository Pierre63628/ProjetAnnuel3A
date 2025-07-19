const http = require('http');

console.log('=== TEST BACKEND CONNECTION ===');

// Test 1: Vérifier si le serveur backend répond
const testBackendConnection = () => {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/upload/test',
            method: 'GET',
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('✅ Backend répond sur le port 3000');
                console.log('Status:', res.statusCode);
                console.log('Response:', data);
                resolve(true);
            });
        });

        req.on('error', (error) => {
            console.log('❌ Backend ne répond pas sur le port 3000');
            console.log('Erreur:', error.message);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log('❌ Timeout - Backend ne répond pas');
            req.destroy();
            resolve(false);
        });

        req.end();
    });
};

// Test 2: Vérifier les ports utilisés
const testPorts = () => {
    console.log('\n=== TEST PORTS ===');
    const ports = [3000, 3001, 8080, 5000];
    
    ports.forEach(port => {
        const req = http.request({
            hostname: 'localhost',
            port: port,
            path: '/',
            method: 'GET',
            timeout: 2000
        }, (res) => {
            console.log(`✅ Port ${port} est utilisé (status: ${res.statusCode})`);
        });

        req.on('error', () => {
            // Port non utilisé, pas d'erreur
        });

        req.on('timeout', () => {
            req.destroy();
        });

        req.end();
    });
};

// Exécuter les tests
const runTests = async () => {
    console.log('Démarrage des tests...\n');
    
    const backendOk = await testBackendConnection();
    
    if (!backendOk) {
        console.log('\n🔧 SOLUTIONS:');
        console.log('1. Démarrer le serveur backend: cd backend && npm run dev');
        console.log('2. Vérifier que le port 3000 n\'est pas utilisé par un autre service');
        console.log('3. Vérifier les logs du serveur backend');
    }
    
    setTimeout(() => {
        testPorts();
        console.log('\n=== TESTS TERMINÉS ===');
    }, 1000);
};

runTests(); 