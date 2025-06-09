-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Quartier
create table "Quartier"
(
    id           integer default nextval('quartiers_id_seq'::regclass) not null
        constraint quartiers_pkey
            primary key,
    nom_quartier varchar(255),
    ville        varchar(255),
    geom         geometry(MultiPolygon, 4326),
    code_postal  varchar(255),
    description  varchar(255)
);

alter table "Quartier"
    owner to "user";



-- Utilisateur
CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TABLE "Utilisateur" (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  adresse TEXT,
  date_naissance DATE,
  telephone VARCHAR(15),
  quartier_id INT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quartier_id) REFERENCES "Quartier"(id)
);

-- RefreshToken pour l'authentification
CREATE TABLE "RefreshToken" (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES "Utilisateur"(id) ON DELETE CASCADE
);

-- Evenement
CREATE TABLE "Evenement" (
  id SERIAL PRIMARY KEY,
  organisateur_id INT,
  nom VARCHAR(255),
  description TEXT,
  date_evenement TIMESTAMP,
  lieu VARCHAR(255),
  type_evenement VARCHAR(100),
  FOREIGN KEY (organisateur_id) REFERENCES "Utilisateur"(id)
);

-- Participation
CREATE TABLE "Participation" (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT,
  evenement_id INT,
  date_inscription TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES "Utilisateur"(id),
  FOREIGN KEY (evenement_id) REFERENCES "Evenement"(id)
);

-- Relation (type: ami, voisin, etc.)
CREATE TABLE "Relation" (
  id SERIAL PRIMARY KEY,
  utilisateur1_id INT,
  utilisateur2_id INT,
  type_relation VARCHAR(100),
  date_debut DATE,
  FOREIGN KEY (utilisateur1_id) REFERENCES "Utilisateur"(id),
  FOREIGN KEY (utilisateur2_id) REFERENCES "Utilisateur"(id)
);

-- Relation Utilisateur-Quartier (pour les quartiers secondaires)
CREATE TABLE "UtilisateurQuartier" (
  id SERIAL PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  quartier_id INT NOT NULL,
  est_principal BOOLEAN DEFAULT FALSE,
  date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(20) DEFAULT 'actif',
  FOREIGN KEY (utilisateur_id) REFERENCES "Utilisateur"(id) ON DELETE CASCADE,
  FOREIGN KEY (quartier_id) REFERENCES "Quartier"(id) ON DELETE CASCADE,
  UNIQUE(utilisateur_id, quartier_id)
);

-- Fonction pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le champ updated_at dans la table Utilisateur
CREATE TRIGGER update_utilisateur_updated_at
BEFORE UPDATE ON "Utilisateur"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour mettre à jour le champ updated_at dans la table Quartier
CREATE TRIGGER update_quartier_updated_at
BEFORE UPDATE ON "Quartier"
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
