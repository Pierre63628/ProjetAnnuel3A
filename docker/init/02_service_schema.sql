-- Service System Database Schema
-- Table pour le système de services (offres et demandes de services entre voisins)

-- Types ENUM pour les services
DO $$ BEGIN
    CREATE TYPE service_type AS ENUM ('offre', 'demande');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_recurrence AS ENUM ('ponctuel', 'hebdomadaire', 'mensuel', 'permanent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_urgence AS ENUM ('faible', 'normale', 'elevee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE service_statut AS ENUM ('active', 'inactive', 'complete');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table principale des services
CREATE TABLE IF NOT EXISTS "Service" (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type_service service_type NOT NULL,
    categorie VARCHAR(100) NOT NULL, -- baby-sitting, jardinage, bricolage, ménage, cours, etc.
    
    -- Dates et horaires
    date_debut TIMESTAMP NULL,
    date_fin TIMESTAMP NULL,
    horaires VARCHAR(255) NULL, -- "9h-17h", "flexible", etc.
    recurrence service_recurrence DEFAULT 'ponctuel',
    
    -- Prix et budget
    prix NUMERIC(10, 2) NULL, -- pour les offres
    budget_max NUMERIC(10, 2) NULL, -- pour les demandes
    
    -- Localisation
    lieu VARCHAR(255) NULL, -- adresse ou zone spécifique
    
    -- Critères et exigences
    competences_requises TEXT NULL,
    materiel_fourni BOOLEAN DEFAULT false,
    experience_requise VARCHAR(255) NULL,
    age_min INTEGER NULL,
    age_max INTEGER NULL,
    nombre_personnes INTEGER DEFAULT 1, -- nombre de personnes recherchées
    
    -- Urgence et contact
    urgence service_urgence DEFAULT 'normale',
    contact_info VARCHAR(255) NULL,
    
    -- Métadonnées
    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quartier_id INTEGER NOT NULL REFERENCES "Quartier"(id) ON DELETE CASCADE,
    utilisateur_id INTEGER NOT NULL REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    statut service_statut DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Propriétaire de la table
ALTER TABLE "Service" OWNER TO "user";

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_service_quartier ON "Service" (quartier_id);
CREATE INDEX IF NOT EXISTS idx_service_utilisateur ON "Service" (utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_service_type ON "Service" (type_service);
CREATE INDEX IF NOT EXISTS idx_service_categorie ON "Service" (categorie);
CREATE INDEX IF NOT EXISTS idx_service_statut ON "Service" (statut);
CREATE INDEX IF NOT EXISTS idx_service_date_publication ON "Service" (date_publication DESC);
CREATE INDEX IF NOT EXISTS idx_service_date_debut ON "Service" (date_debut);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_service_updated_at
    BEFORE UPDATE ON "Service"
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Table pour les inscriptions aux services (qui s'inscrit pour quel service)
CREATE TABLE IF NOT EXISTS "ServiceInscription" (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES "Service"(id) ON DELETE CASCADE,
    utilisateur_id INTEGER NOT NULL REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
    message TEXT NULL, -- message d'accompagnement lors de l'inscription
    statut VARCHAR(50) DEFAULT 'en_attente', -- en_attente, accepte, refuse
    date_inscription TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reponse TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Un utilisateur ne peut s'inscrire qu'une fois par service
    UNIQUE(service_id, utilisateur_id)
);

-- Propriétaire de la table
ALTER TABLE "ServiceInscription" OWNER TO "user";

-- Index pour les inscriptions
CREATE INDEX IF NOT EXISTS idx_service_inscription_service ON "ServiceInscription" (service_id);
CREATE INDEX IF NOT EXISTS idx_service_inscription_utilisateur ON "ServiceInscription" (utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_service_inscription_statut ON "ServiceInscription" (statut);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE TRIGGER update_service_inscription_updated_at
    BEFORE UPDATE ON "ServiceInscription"
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Contraintes de validation
ALTER TABLE "Service" ADD CONSTRAINT check_service_dates 
    CHECK (date_fin IS NULL OR date_debut IS NULL OR date_fin >= date_debut);

ALTER TABLE "Service" ADD CONSTRAINT check_service_ages 
    CHECK (age_max IS NULL OR age_min IS NULL OR age_max >= age_min);

ALTER TABLE "Service" ADD CONSTRAINT check_service_prix_budget 
    CHECK (
        (type_service = 'offre' AND budget_max IS NULL) OR 
        (type_service = 'demande' AND prix IS NULL) OR
        (type_service = 'offre' AND prix IS NOT NULL) OR
        (type_service = 'demande' AND budget_max IS NOT NULL)
    );

-- Commentaires pour la documentation
COMMENT ON TABLE "Service" IS 'Table des services offerts et demandés par les utilisateurs dans leur quartier';
COMMENT ON COLUMN "Service".type_service IS 'Type de service: offre (je propose) ou demande (je cherche)';
COMMENT ON COLUMN "Service".categorie IS 'Catégorie du service: baby-sitting, jardinage, bricolage, ménage, cours, etc.';
COMMENT ON COLUMN "Service".recurrence IS 'Fréquence du service: ponctuel, hebdomadaire, mensuel, permanent';
COMMENT ON COLUMN "Service".prix IS 'Prix proposé pour une offre de service';
COMMENT ON COLUMN "Service".budget_max IS 'Budget maximum pour une demande de service';
COMMENT ON COLUMN "Service".nombre_personnes IS 'Nombre de personnes recherchées pour effectuer le service';

COMMENT ON TABLE "ServiceInscription" IS 'Table des inscriptions des utilisateurs aux services';
COMMENT ON COLUMN "ServiceInscription".statut IS 'Statut de l inscription: en_attente, accepte, refuse';
