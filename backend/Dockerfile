# Utiliser une image Node.js officielle avec les outils de compilation
FROM node:18-bullseye

WORKDIR /app

# Installer les dépendances nécessaires pour compiler bcrypt
RUN apt-get update && apt-get install -y build-essential python3

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Supprimer le node_modules s'il existe et le package-lock.json
RUN rm -rf node_modules

# Installer les dépendances avec --force pour réinstaller bcrypt
RUN npm install --force

# Reconstruire bcrypt spécifiquement
RUN npm rebuild bcrypt --build-from-source

# Copier le reste des fichiers
COPY . .

EXPOSE 3000

# Start the server in development mode
CMD ["npm", "run", "dev"]
