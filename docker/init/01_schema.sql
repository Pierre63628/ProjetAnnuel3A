create table if not exists "Utilisateur"
(
    id             serial
        primary key,
    nom            varchar(100) not null,
    prenom         varchar(100),
    email          varchar(255)
        unique,
    password       varchar(255) not null,
    adresse        text,
    date_naissance date,
    telephone      varchar(15),
    quartier_id    integer,
    role           user_role default 'user'::user_role,
    created_at     timestamp default CURRENT_TIMESTAMP,
    updated_at     timestamp default CURRENT_TIMESTAMP
);

alter table "Utilisateur"
    owner to "user";

create trigger update_utilisateur_updated_at
    before update
    on "Utilisateur"
    for each row
execute procedure update_updated_at_column();

create table if not exists "RefreshToken"
(
    id         serial
        primary key,
    user_id    integer      not null
        references "Utilisateur"
            on delete cascade,
    token      varchar(255) not null,
    expires_at timestamp    not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    revoked    boolean   default false
);

alter table "RefreshToken"
    owner to "user";

create table if not exists "Evenement"
(
    id               serial
        primary key,
    organisateur_id  integer
        references "Utilisateur",
    nom              varchar(255),
    description      text,
    date_evenement   timestamp,
    lieu             varchar(255),
    type_evenement   varchar(100),
    photo_url        text,
    created_at       timestamp default CURRENT_TIMESTAMP,
    updated_at       timestamp default CURRENT_TIMESTAMP,
    quartier_id      integer,
    detailed_address text,
    source           varchar(500),
    url              text
        unique
);

alter table "Evenement"
    owner to "user";

create table if not exists "Participation"
(
    id               serial
        primary key,
    utilisateur_id   integer
        references "Utilisateur",
    evenement_id     integer
        references "Evenement",
    date_inscription timestamp
);

alter table "Participation"
    owner to "user";

create table if not exists "Relation"
(
    id              serial
        primary key,
    utilisateur1_id integer
        references "Utilisateur",
    utilisateur2_id integer
        references "Utilisateur",
    type_relation   varchar(100),
    date_debut      date
);

alter table "Relation"
    owner to "user";

create table if not exists spatial_ref_sys
(
    srid      integer not null
        primary key
        constraint spatial_ref_sys_srid_check
            check ((srid > 0) AND (srid <= 998999)),
    auth_name varchar(256),
    auth_srid integer,
    srtext    varchar(2048),
    proj4text varchar(2048)
);

alter table spatial_ref_sys
    owner to "user";

grant select on spatial_ref_sys to public;

create table if not exists "Quartier"
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
Table des annonces de troc
CREATE TABLE "AnnonceTroc" (
                               id SERIAL PRIMARY KEY,
                               titre VARCHAR(255) NOT NULL,
                               description TEXT,
                               objet_propose VARCHAR(255) NOT NULL,
                               objet_recherche VARCHAR(255) NOT NULL,
                               image_url TEXT,
                               date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               quartier_id INTEGER REFERENCES "Quartier"(id),
                               utilisateur_id INTEGER REFERENCES "Utilisateur"(id),
                               statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'inactive')),
                               type_annonce VARCHAR(20) DEFAULT 'offre' CHECK (type_annonce IN ('offre', 'demande')),
                               prix DECIMAL(10,2),
                               budget_max DECIMAL(10,2),
                               etat_produit VARCHAR(50),
                               categorie VARCHAR(100),
                               urgence VARCHAR(50),
                               mode_echange VARCHAR(50) DEFAULT 'vente' CHECK (mode_echange IN ('vente', 'troc', 'don')),
                               criteres_specifiques TEXT,
                               disponibilite VARCHAR(100),
                               created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                               updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);