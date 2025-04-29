-- Ajouter la colonne photo_url à la table Evenement
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Ajouter les colonnes created_at et updated_at à la table Evenement
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Evenement" ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Créer un trigger pour mettre à jour le champ updated_at dans la table Evenement
CREATE TRIGGER IF NOT EXISTS update_evenement_updated_at
BEFORE UPDATE ON "Evenement"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
