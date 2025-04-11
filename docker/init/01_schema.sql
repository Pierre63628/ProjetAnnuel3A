-- Quartier
CREATE TABLE Quartier (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom_quartier VARCHAR(100) NOT NULL,
  ville VARCHAR(100),
  code_postal VARCHAR(10)
);

-- Utilisateur
CREATE TABLE Utilisateur (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  adresse TEXT,
  date_naissance DATE,
  telephone VARCHAR(15),
  quartier_id INT,
  FOREIGN KEY (quartier_id) REFERENCES Quartier(id)
);

-- Evenement
CREATE TABLE Evenement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  organisateur_id INT,
  nom VARCHAR(255),
  description TEXT,
  date_evenement DATETIME,
  lieu VARCHAR(255),
  type_evenement VARCHAR(100),
  FOREIGN KEY (organisateur_id) REFERENCES Utilisateur(id)
);

-- Participation
CREATE TABLE Participation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT,
  evenement_id INT,
  date_inscription DATETIME,
  FOREIGN KEY (utilisateur_id) REFERENCES Utilisateur(id),
  FOREIGN KEY (evenement_id) REFERENCES Evenement(id)
);

-- Relation (type: ami, voisin, etc.)
CREATE TABLE Relation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur1_id INT,
  utilisateur2_id INT,
  type_relation VARCHAR(100),
  date_debut DATE,
  FOREIGN KEY (utilisateur1_id) REFERENCES Utilisateur(id),
  FOREIGN KEY (utilisateur2_id) REFERENCES Utilisateur(id)
);
