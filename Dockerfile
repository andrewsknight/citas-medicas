# build environment
FROM oven/bun:latest as builder
RUN mkdir -p /app
WORKDIR /app
COPY package.json /app
RUN bun install
COPY . /app
RUN bun run build


# production environment
FROM nginx:1.13.9-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80