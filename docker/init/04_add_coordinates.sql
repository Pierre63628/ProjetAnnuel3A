-- Ajouter les colonnes latitude et longitude à la table Utilisateur
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Ajouter une colonne pour stocker l'adresse complète formatée
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS adresse_complete TEXT;

ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS url TEXT UNIQUE;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS detailed_address TEXT;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS source varchar(500);
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS description varchar(500);


SELECT id, nom, url, photo_url, date_evenement, source, detailed_address,
       created_at, updated_at
FROM "Evenement"
ORDER BY date DESC



