# Étape 1 : build l'app
FROM node:18 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
RUN npm install --save-dev @types/node
COPY . .
RUN npm run build

# Étape 2 : nginx pour servir les fichiers
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]