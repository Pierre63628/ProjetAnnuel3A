# NextDoorBuddy

Application de mise en relation entre voisins pour favoriser l'entraide et la convivialité dans les quartiers.


##Script de creation des table spour la bdd (MAJ le 20/06/2025)

```
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

create table if not exists events
(
    id               serial
        primary key,
    name             varchar(255) not null,
    url              text         not null
        constraint unique_event_url
            unique,
    image_url        text,
    date             varchar(100),
    source           varchar(50),
    detailed_address text,
    created_at       timestamp default CURRENT_TIMESTAMP,
    updated_at       timestamp default CURRENT_TIMESTAMP
);

alter table events
    owner to "user";

create trigger update_events_updated_at
    before update
    on events
    for each row
execute procedure update_modified_column();

```



## Technologies utilisées

- **Frontend** : React, TypeScript, Tailwind CSS
- **Backend** : Node.js, Express
- **Base de données** : PostgreSQL
- **Authentification** : JWT (stateless)

## Structure du projet

```
.
├── backend/                # Code du serveur Node.js/Express
│   ├── src/              # Code source du backend
│   │   ├── config/       # Configuration (base de données, JWT, etc.)
│   │   ├── controllers/  # Contrôleurs pour les routes
│   │   ├── middlewares/  # Middlewares (authentification, validation, etc.)
│   │   ├── models/       # Modèles de données
│   │   └── routes/       # Définition des routes API
│   └── Dockerfile       # Configuration Docker pour le backend
├── docker/                # Fichiers de configuration Docker
│   └── init/           # Scripts d'initialisation de la base de données
├── frontend/              # Code de l'application React
│   └── nextdoorbuddy/   # Application React
│       ├── src/          # Code source du frontend
│       │   ├── components/  # Composants React réutilisables
│       │   ├── contexts/    # Contextes React (authentification, etc.)
│       │   ├── pages/       # Pages de l'application
│       │   └── styles/      # Styles CSS/Tailwind
│       └── Dockerfile    # Configuration Docker pour le frontend
└── docker-compose.yaml    # Configuration Docker Compose
```

## Fonctionnalités

- Authentification sécurisée (JWT)
- Gestion des utilisateurs
- Gestion des événements de quartier
- Mise en relation entre voisins

## Installation et lancement

```bash
# Cloner le dépôt
git clone https://github.com/Pierre63628/ProjetAnnuel3A.git
cd ProjetAnnuel-NextDoorBuddy

# Lancer les conteneurs Docker

## Production
docker-compose up --build -d

## Développement local (si vous avez les fichiers de dev)
docker-compose -f docker-compose.dev.yaml up --build -d
```

## Accès

### Production
- **Application** : https://doorbudy.cloud
- **Backend API** : https://doorbudy.cloud/api

### Développement local
- **Application** : http://localhost
- **Backend API** : http://localhost:3000 (accès direct) ou http://localhost/api (via nginx)

## Utilisateurs de test

- **Administrateur** : lucas.verrecchia@gmail.com / Admin123!
- **Utilisateur** : jean.dupont@example.com / User123!