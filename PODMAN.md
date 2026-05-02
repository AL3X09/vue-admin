# 1. Construir imagen
(ruta local WSL)
podman build -t vue-admin:latest \\wsl.localhost\Ubuntu-24.04\var\www\vue\admin-one-vue-tailwind\

Después (desde GitHub)
podman build -t vue-admin:latest https://github.com/USER/admin-one-vue-tailwind.git
# 2. Crear red
podman network create app-network

# 3. Crear pod
podman pod create \
  --name vue-admin-pod \
  --network app-network \
 
 ## powershell
 podman pod create --name vue-admin-pod --network app-network -p 8000:80

# 4. Ejecutar contenedor
podman run -d \
  --name vue-admin-app \
  --network app-network \
  --restart unless-stopped \
  -p 80:8001 \
  vue-admin-frontend:latest

## powershell
 podman run -d --name vue-admin --pod vue-admin-pod vue-admin:latest

# Opción 1: Actualización en Producción (reconstruir imagen)
1- podman build -t vue-admin:latest \\wsl.localhost\Ubuntu-24.04\var\www\vue\admin-one-vue-tailwind\
 
 ## 2. Detener y eliminar el contenedor actual (el pod se mantiene)
podman stop vue-app
podman rm vue-app

## 3. Crear nuevo contenedor con la imagen actualizada
podman run -d \
  --name vue-app \
  --pod vue-frontend-pod \
  vue-admin-frontend:latest

## powershell
 podman run -d --name vue-admin --pod vue-admin-pod vue-admin:latest

## 4. Verificar que está corriendo
podman logs -f vue-admin