-- Quartiers
INSERT INTO "Quartier" (nom_quartier, ville, code_postal)
VALUES
  ('Centre', 'Paris', '75001'),
  ('Montmartre', 'Paris', '75018');

-- Utilisateurs (mot de passe: 'password123' haché avec bcrypt)
INSERT INTO "Utilisateur" (nom, prenom, email, password, adresse, date_naissance, telephone, quartier_id, role)
VALUES
  ('Dupont', 'Jean', 'jean@example.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsrx/6x.nQgP1Jl.K7GVJ2.9EJbHe', '10 rue de Rivoli', '1990-04-15', '0601020304', 1, 'user'),
  ('Yuri', 'Claire', 'claire@example.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsrx/6x.nQgP1Jl.K7GVJ2.9EJbHe', '3 avenue Junot', '1985-06-20', '0605060708', 2, 'user'),
  ('Verrecchia', 'Lucas', 'lucas.verrecchia@gmail.com', '$2b$10$3euPcmQFCiblsZeEu5s7p.9wVsrx/6x.nQgP1Jl.K7GVJ2.9EJbHe', '37 avenue du val de beauté', '1995-03-27', '0629463796', 1, 'admin');


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
