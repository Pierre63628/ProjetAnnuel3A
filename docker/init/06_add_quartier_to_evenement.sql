-- Ajouter la colonne quartier_id à la table Evenement
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS quartier_id INT REFERENCES "Quartier"(id);
