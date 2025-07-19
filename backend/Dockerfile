# Utiliser une image Node.js officielle
FROM node:18-bullseye

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Supprimer le node_modules s'il existe
RUN rm -rf node_modules

# Installer les dépendances et nodemon globalement
RUN npm install
RUN npm install -g nodemon

# Copier le reste des fichiers
COPY . .

# Donner les permissions nécessaires
RUN chmod +x node_modules/.bin/nodemon

EXPOSE 3000

# Start the server in development mode
CMD ["npm", "run", "dev"]
