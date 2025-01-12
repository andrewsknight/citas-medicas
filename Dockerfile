# Etapa 1: Construcción de la aplicación
FROM node:18 AS build

# Instalar Bun globalmente
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios
COPY package.json bun.lockb ./

# Instalar dependencias con Bun
RUN bun install --production

# Copiar el resto de los archivos del proyecto
COPY . .

# Construir la aplicación (si aplica)
RUN bun build

# Etapa 2: Servidor web (Nginx)
FROM nginx:stable

# Copiar los archivos construidos al servidor
COPY --from=build /app/dist /usr/share/nginx/html

# Exponer el puerto de Nginx
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
