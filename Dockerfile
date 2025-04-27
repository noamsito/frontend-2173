# Etapa de construcción
FROM node:18 as build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto de los archivos del proyecto
COPY . .

# Variables de entorno para Auth0 y API
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_API_URL

ENV VITE_AUTH0_DOMAIN=dev-ouxdigl1l6bn6n3r.us.auth0.com/
ENV VITE_AUTH0_CLIENT_ID=ioEcob7KVSQ883eYRrY0gnyknMFJDRCt
ENV VITE_API_URL=http://api:3000

# Construir la aplicación
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:stable-alpine

# Copiar los archivos de construcción a la carpeta de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración para SPA
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]