import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer le dossier uploads/images s'il n'existe pas
const uploadsDir = path.join(__dirname, 'uploads');
const imagesDir = path.join(uploadsDir, 'images');

console.log('=== INITIALISATION DES DOSSIERS UPLOADS ===');

// Créer le dossier uploads s'il n'existe pas
if (!fs.existsSync(uploadsDir)) {
    console.log('Création du dossier uploads...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Dossier uploads créé');
} else {
    console.log('✅ Dossier uploads existe déjà');
}

// Créer le dossier uploads/images s'il n'existe pas
if (!fs.existsSync(imagesDir)) {
    console.log('Création du dossier uploads/images...');
    fs.mkdirSync(imagesDir, { recursive: true });
    console.log('✅ Dossier uploads/images créé');
} else {
    console.log('✅ Dossier uploads/images existe déjà');
}

// Créer un fichier .gitkeep dans le dossier images pour le garder dans git
const gitkeepFile = path.join(imagesDir, '.gitkeep');
if (!fs.existsSync(gitkeepFile)) {
    fs.writeFileSync(gitkeepFile, '');
    console.log('✅ Fichier .gitkeep créé dans uploads/images');
}

console.log('=== STRUCTURE DES DOSSIERS ===');
console.log('uploads:', fs.existsSync(uploadsDir) ? '✅' : '❌');
console.log('uploads/images:', fs.existsSync(imagesDir) ? '✅' : '❌');

console.log('=== INITIALISATION TERMINÉE ==='); 