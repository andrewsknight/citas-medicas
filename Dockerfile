# Etapa 1: Construcción de la aplicación React
FROM node:18 AS build

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY package.json yarn.lock ./

# Instalar dependencias
RUN yarn install --frozen-lockfile

# Copiar el resto de los archivos del proyecto
COPY . .

# Construir la aplicación para producción
RUN yarn build

# Etapa 2: Configuración del servidor web
FROM nginx:stable

# Copiar los archivos de la aplicación construida al servidor
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración de Nginx (opcional)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto que usa Nginx
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
