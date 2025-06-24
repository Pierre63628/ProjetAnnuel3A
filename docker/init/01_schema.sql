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

create table if not exists "ChatRoom"
(
    id          serial
        primary key,
    name        varchar(255) not null,
    description text,
    quartier_id integer      not null,
    room_type   varchar(50) default 'group'::character varying,
    created_by  integer
                             references "Utilisateur"
                                 on delete set null,
    created_at  timestamp   default CURRENT_TIMESTAMP,
    updated_at  timestamp   default CURRENT_TIMESTAMP,
    is_active   boolean     default true
);

alter table "ChatRoom"
    owner to "user";

create index if not exists idx_chatroom_quartier
    on "ChatRoom" (quartier_id);

create trigger update_chatroom_updated_at
    before update
    on "ChatRoom"
    for each row
execute procedure update_updated_at_column();

create table if not exists "ChatRoomMember"
(
    id           serial
        primary key,
    chat_room_id integer
        references "ChatRoom"
            on delete cascade,
    user_id      integer
        references "Utilisateur"
            on delete cascade,
    role         varchar(50) default 'member'::character varying,
    joined_at    timestamp   default CURRENT_TIMESTAMP,
    last_read_at timestamp   default CURRENT_TIMESTAMP,
    is_muted     boolean     default false,
    unique (chat_room_id, user_id)
);

alter table "ChatRoomMember"
    owner to "user";

create index if not exists idx_chatroom_member_room
    on "ChatRoomMember" (chat_room_id);

create index if not exists idx_chatroom_member_user
    on "ChatRoomMember" (user_id);

create table if not exists "Message"
(
    id           serial
        primary key,
    chat_room_id integer
        references "ChatRoom"
            on delete cascade,
    sender_id    integer
                      references "Utilisateur"
                          on delete set null,
    content      text not null,
    message_type varchar(50) default 'text'::character varying,
    reply_to_id  integer
                      references "Message"
                          on delete set null,
    created_at   timestamp   default CURRENT_TIMESTAMP,
    updated_at   timestamp   default CURRENT_TIMESTAMP,
    is_edited    boolean     default false,
    is_deleted   boolean     default false,
    deleted_at   timestamp
);

alter table "Message"
    owner to "user";

create index if not exists idx_message_room
    on "Message" (chat_room_id);

create index if not exists idx_message_sender
    on "Message" (sender_id);

create index if not exists idx_message_created
    on "Message" (created_at desc);

create trigger update_message_updated_at
    before update
    on "Message"
    for each row
execute procedure update_updated_at_column();

create table if not exists "MessageReaction"
(
    id         serial
        primary key,
    message_id integer
        references "Message"
            on delete cascade,
    user_id    integer
        references "Utilisateur"
            on delete cascade,
    reaction   varchar(50) not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    unique (message_id, user_id, reaction)
);

alter table "MessageReaction"
    owner to "user";

create table if not exists "UserPresence"
(
    id         serial
        primary key,
    user_id    integer
        unique
        references "Utilisateur"
            on delete cascade,
    status     varchar(50) default 'offline'::character varying,
    last_seen  timestamp   default CURRENT_TIMESTAMP,
    socket_id  varchar(255),
    updated_at timestamp   default CURRENT_TIMESTAMP
);

alter table "UserPresence"
    owner to "user";

create index if not exists idx_user_presence_user
    on "UserPresence" (user_id);

create trigger update_user_presence_updated_at
    before update
    on "UserPresence"
    for each row
execute procedure update_updated_at_column();

create table if not exists "TypingIndicator"
(
    id           serial
        primary key,
    chat_room_id integer
        references "ChatRoom"
            on delete cascade,
    user_id      integer
        references "Utilisateur"
            on delete cascade,
    started_at   timestamp default CURRENT_TIMESTAMP,
    unique (chat_room_id, user_id)
);

alter table "TypingIndicator"
    owner to "user";

create index if not exists idx_typing_room
    on "TypingIndicator" (chat_room_id);

create table if not exists "MessageDelivery"
(
    id         serial
        primary key,
    message_id integer
        references "Message"
            on delete cascade,
    user_id    integer
        references "Utilisateur"
            on delete cascade,
    status     varchar(50) default 'sent'::character varying,
    timestamp  timestamp   default CURRENT_TIMESTAMP,
    unique (message_id, user_id)
);

alter table "MessageDelivery"
    owner to "user";

create index if not exists idx_message_delivery_message
    on "MessageDelivery" (message_id);

create table if not exists "BlockedUser"
(
    id         serial
        primary key,
    blocker_id integer
        references "Utilisateur"
            on delete cascade,
    blocked_id integer
        references "Utilisateur"
            on delete cascade,
    reason     text,
    created_at timestamp default CURRENT_TIMESTAMP,
    unique (blocker_id, blocked_id)
);

alter table "BlockedUser"
    owner to "user";

create index if not exists idx_blocked_user_blocker
    on "BlockedUser" (blocker_id);

create table if not exists "AnnonceTroc"
(
    id                   serial
        primary key,
    titre                varchar(255) not null,
    description          text,
    objet_propose        varchar(255) not null,
    objet_recherche      varchar(255) not null,
    image_url            text,
    date_publication     timestamp   default CURRENT_TIMESTAMP,
    quartier_id          integer
        references "Quartier",
    utilisateur_id       integer
        references "Utilisateur",
    statut               varchar(20) default 'active'::character varying
        constraint "AnnonceTroc_statut_check"
            check ((statut)::text = ANY ((ARRAY ['active'::character varying, 'inactive'::character varying])::text[])),
    type_annonce         varchar(20) default 'offre'::character varying
        constraint "AnnonceTroc_type_annonce_check"
            check ((type_annonce)::text = ANY
                   ((ARRAY ['offre'::character varying, 'demande'::character varying])::text[])),
    prix                 numeric(10, 2),
    budget_max           numeric(10, 2),
    etat_produit         varchar(50),
    categorie            varchar(100),
    urgence              varchar(50),
    mode_echange         varchar(50) default 'vente'::character varying
        constraint "AnnonceTroc_mode_echange_check"
            check ((mode_echange)::text = ANY
                   ((ARRAY ['vente'::character varying, 'troc'::character varying, 'don'::character varying])::text[])),
    criteres_specifiques text,
    disponibilite        varchar(100),
    created_at           timestamp   default CURRENT_TIMESTAMP,
    updated_at           timestamp   default CURRENT_TIMESTAMP
);

alter table "AnnonceTroc"
    owner to "user";

