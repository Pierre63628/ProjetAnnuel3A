const crypto = require('crypto');

// Fonction pour hasher le mot de passe (même logique que dans le backend)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

// Mot de passe pour l'utilisateur de test
const password = 'TestUser123!';
const hashedPassword = hashPassword(password);

console.log('Mot de passe:', password);
console.log('Hash généré:', hashedPassword);

// Générer le script SQL
const sqlScript = `-- Script pour créer un utilisateur de test avec le rôle "user"
-- Mot de passe: ${password}

INSERT INTO "Utilisateur" (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id, role)
VALUES (
    'Test',
    'User',
    'testuser@example.com',
    '${hashedPassword}',
    '123 Rue de Test, 75001 Paris',
    '1990-01-01',
    '0123456789',
    1,
    'user'
);

-- Afficher l'utilisateur créé
SELECT id, nom, prenom, email, role, quartier_id FROM "Utilisateur" WHERE email = 'testuser@example.com';
`;

console.log('\n=== SCRIPT SQL ===');
console.log(sqlScript); 