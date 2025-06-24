-- Migration pour supporter plusieurs images par troc
-- Ajouter une colonne pour stocker un tableau d'URLs d'images

-- Ajouter la colonne images (array de text) à la table AnnonceTroc
ALTER TABLE "AnnonceTroc" 
ADD COLUMN images TEXT[] DEFAULT '{}';

-- Migrer les images existantes de image_url vers images
UPDATE "AnnonceTroc" 
SET images = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_url != '';

-- Optionnel: garder image_url pour compatibilité descendante (première image)
-- On peut la supprimer plus tard si on veut
-- ALTER TABLE "AnnonceTroc" DROP COLUMN image_url;

-- Index pour améliorer les performances sur les recherches d'images
CREATE INDEX idx_annonce_troc_images ON "AnnonceTroc" USING GIN(images);

-- Commentaire pour documentation
COMMENT ON COLUMN "AnnonceTroc".images IS 'Array of image URLs for the troc announcement';
