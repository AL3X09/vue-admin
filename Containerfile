# ============================================================
# Stage 1: Build
# ============================================================
FROM node:20-alpine AS builder

# VITE_API_BASE_URL se pasa en tiempo de build con --build-arg
# Ejemplo: podman build --build-arg VITE_API_BASE_URL=http://192.168.100.4:8001 ...
ARG VITE_API_BASE_URL=http://localhost:8001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN apk add --no-cache git

WORKDIR /app

# Clonar el repositorio (igual que el backend)
RUN git clone https://github.com/AL3X09/vue-admin.git .

# Instalar dependencias
RUN npm ci

# Build — Vite lee VITE_API_BASE_URL del entorno en este momento
RUN node node_modules/vite/bin/vite.js build

# ============================================================
# Stage 2: Producción con Nginx
# ============================================================
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Configuración de nginx con proxy hacia el backend
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]