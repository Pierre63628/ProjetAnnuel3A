-- Ajouter les colonnes latitude et longitude à la table Utilisateur
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Ajouter une colonne pour stocker l'adresse complète formatée
ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS adresse_complete TEXT;
