const bcrypt = require('bcrypt');

async function testPasswordHash() {
  const password = 'password123';
  const storedHash = '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsrx/6x.nQgP1Jl.K7GVJ2.9EJbHe';
  
  console.log('Mot de passe à tester:', password);
  console.log('Hash stocké:', storedHash);
  
  const isMatch = await bcrypt.compare(password, storedHash);
  console.log('Résultat de la comparaison:', isMatch);
}

testPasswordHash();
