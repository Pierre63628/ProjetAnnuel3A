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

create table "Utilisateur"
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

create table "RefreshToken"
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

create table "Evenement"
(
    id              serial
        primary key,
    organisateur_id integer
        references "Utilisateur",
    nom             varchar(255),
    description     text,
    date_evenement  timestamp,
    lieu            varchar(255),
    type_evenement  varchar(100),
    photo_url       text,
    created_at      timestamp default CURRENT_TIMESTAMP,
    updated_at      timestamp default CURRENT_TIMESTAMP
);

alter table "Evenement"
    owner to "user";

create table "Participation"
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

create table "Relation"
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

create table spatial_ref_sys
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

