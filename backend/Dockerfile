# Utiliser une image Node.js officielle
FROM node:18-bullseye

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Supprimer le node_modules s'il existe
RUN rm -rf node_modules

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

EXPOSE 3000

# Start the server in development mode
CMD ["npm", "run", "dev"]
