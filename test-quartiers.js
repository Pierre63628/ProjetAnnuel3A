import { Pool } from 'pg';

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'nextdoorbuddy',
    user: 'postgres',
    password: 'postgres'
});

async function testQuartiers() {
    try {
        console.log('=== VÉRIFICATION DES QUARTIERS ===');
        
        const result = await pool.query('SELECT id, nom FROM quartiers ORDER BY id');
        
        console.log('Quartiers disponibles:');
        result.rows.forEach(row => {
            console.log(`  - ID: ${row.id}, Nom: ${row.nom}`);
        });
        
        if (result.rows.length === 0) {
            console.log('⚠️  Aucun quartier trouvé dans la base de données');
        }
        
    } catch (error) {
        console.error('Erreur:', error.message);
    } finally {
        await pool.end();
    }
}

testQuartiers(); 