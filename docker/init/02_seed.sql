-- Quartiers
INSERT INTO "Quartier" (id, nom_quartier, ville, code_postal)
VALUES
  (1, 'Centre', 'Paris', '75001'),
  (2, 'Montmartre', 'Paris', '75018'),
  (3, 'Le Marais', 'Paris', '75004'),
  (4, 'Saint-Germain-des-Prés', 'Paris', '75006'),
  (5, 'Belleville', 'Paris', '75020')
ON CONFLICT (id) DO NOTHING;

-- Utilisateurs (mot de passe: 'Admin123!' pour l'admin et 'User123!' pour l'utilisateur)
-- Format du mot de passe hashé avec crypto: salt:hash
INSERT INTO "Utilisateur" (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id, role)
VALUES
  ('Dupont', 'Jean', 'jean@example.com', '5a9c1a0e9a0f1c0e5a9c1a0e9a0f1c0e:3c8727e019a42b444667a587b6001251becadabbb36bfed8087a92c18882d65c32f5c709b39fad4c09e9e5c9151b15191ade8aa7fd1605785dfd87d7bb0d46b0', '10 rue de Rivoli', '1990-04-15', '0601020304', 1, 'user'),
  ('Yuri', 'Claire', 'claire@example.com', '5a9c1a0e9a0f1c0e5a9c1a0e9a0f1c0e:3c8727e019a42b444667a587b6001251becadabbb36bfed8087a92c18882d65c32f5c709b39fad4c09e9e5c9151b15191ade8aa7fd1605785dfd87d7bb0d46b0', '3 avenue Junot', '1985-06-20', '0605060708', 2, 'user'),
  ('Verrecchia', 'Lucas', 'lucas.verrecchia@gmail.com', 'e4bb35f038b4ffdad9a55bbad57f243a:ff4d689138b7baf27715c456a21ed5e580b5f0177ebb84e23814f80dd7c868fc22fadc5884dd87144c2c37f6deb43fda95f854a227a9a209ee2aa75288d90a64', '37 avenue du val de beauté', '1995-03-27', '0629463796', 1, 'admin');


-- Événements
INSERT INTO "Evenement" (organisateur_id, nom, description, date_evenement, lieu, type_evenement)
VALUES
  (1, 'Fête de voisins', 'Rencontre entre voisins du quartier', '2025-06-15 18:00:00', 'Place du marché', 'fête'),
  (2, 'Atelier compost', 'Atelier découverte du compost', '2025-06-20 14:00:00', 'Jardin partagé', 'atelier');

-- Participations
INSERT INTO "Participation" (utilisateur_id, evenement_id, date_inscription)
VALUES
  (1, 2, NOW()),
  (2, 1, NOW());

-- Relations
INSERT INTO "Relation" (utilisateur1_id, utilisateur2_id, type_relation, date_debut)
VALUES
  (1, 2, 'voisin', '2024-10-01'),
  (2, 1, 'voisin', '2024-10-01');
