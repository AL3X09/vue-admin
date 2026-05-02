# 📄 Configuración de Variables de Entorno

Este documento explica cómo configurar las variables de entorno para el frontend Vue.js.

## 📋 Archivos de Entorno

El proyecto utiliza los siguientes archivos de entorno:

- **`.env`** - Variables de entorno locales (NO commit a git)
- **`.env.example`** - Plantilla con variables de ejemplo (commit a git)
- **`.env.production`** - Variables para producción (opcional)

## 🚀 Variables Disponibles

### Vite Configuration

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_BASE_URL` | URL base de la aplicación | `/` |
| `VITE_APP_NAME` | Nombre de la aplicación | `Fontibón Reservado` |
| `VITE_APP_VERSION` | Versión de la aplicación | `1.0.0` |
| `VITE_APP_DEBUG` | Modo debug/logs | `true` |

### API Configuration

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_API_BASE_URL` | URL del backend FastAPI | `http://127.0.0.1:8000` |
| `VITE_API_TIMEOUT` | Timeout de peticiones (ms) | `10000` |

### Authentication

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_TOKEN_EXPIRATION_MINUTES` | Expiración del token JWT | `60` |
| `VITE_REMEMBER_ME_DAYS` | Días para recordar sesión | `7` |
| `VITE_TOKEN_STORAGE_KEY` | Clave para token en localStorage | `token` |
| `VITE_USER_STORAGE_KEY` | Clave para usuario en localStorage | `user` |
| `VITE_PASSWORD_CHANGE_STORAGE_KEY` | Clave para flag de cambio de contraseña | `mustChangePassword` |

### Notifications

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_TOAST_DURATION` | Duración de notificaciones (ms) | `3000` |
| `VITE_TOAST_POSITION` | Posición de notificaciones | `top-right` |

### Pagination

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_DEFAULT_ITEMS_PER_PAGE` | Items por página por defecto | `10` |
| `VITE_ITEMS_PER_PAGE_OPTIONS` | Opciones de paginación | `5,10,25,50,100` |

### Files

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_MAX_FILE_SIZE_MB` | Tamaño máximo de archivos (MB) | `10` |
| `VITE_ALLOWED_IMAGE_TYPES` | Tipos de imágenes permitidos | `image/jpeg,image/png,image/webp,image/svg+xml` |
| `VITE_ALLOWED_DOCUMENT_TYPES` | Tipos de documentos permitidos | `application/pdf,application/msword,...` |

### Security

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_PROTECTED_REDIRECT_URLS` | URLs protegidas (no redirigir) | `/login,/registro,/forgot-password` |
| `VITE_MIN_PASSWORD_LENGTH` | Longitud mínima de contraseña | `8` |
| `VITE_PASSWORD_PATTERN` | Patrón de contraseña (regex) | `^(?=.*[a-z])(?=.*[A-Z])...` |
| `VITE_MAX_LOGIN_ATTEMPTS` | Máximo de intentos fallidos | `5` |
| `VITE_LOGIN_LOCKOUT_MINUTES` | Tiempo de bloqueo (minutos) | `15` |

### Feature Flags

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `VITE_ENABLE_REGISTRATION` | Habilitar registro de usuarios | `true` |
| `VITE_ENABLE_PASSWORD_CHANGE` | Habilitar cambio de contraseña | `true` |
| `VITE_ENABLE_DARK_MODE` | Habilitar modo oscuro | `true` |
| `VITE_ENABLE_NOTIFICATIONS` | Habilitar notificaciones | `true` |
| `VITE_ENABLE_DEBUG_LOGS` | Habilitar logs de debug | `true` |
| `VITE_ENABLE_DATA_EXPORT` | Habilitar exportación de datos | `true` |

## 🔧 Uso en el Código

### Leer Variables de Entorno

```javascript
// En cualquier archivo .js o .vue
const apiUrl = import.meta.env.VITE_API_BASE_URL
const appName = import.meta.env.VITE_APP_NAME
const debugMode = import.meta.env.VITE_APP_DEBUG === 'true'
```

### Ejemplo en conf.js

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
})
```

## 📦 Configuración por Entorno

### Desarrollo Local

1. Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Editar `.env` con tus valores locales

3. Iniciar el servidor:
```bash
npm run dev
```

### Producción

1. Crear `.env.production`:
```bash
cp .env.example .env.production
```

2. Configurar variables de producción:
```env
VITE_BASE_URL=/admin-one-vue-tailwind/
VITE_API_BASE_URL=https://api.tudominio.com
VITE_APP_DEBUG=false
```

3. Construir para producción:
```bash
npm run build
```

## ⚠️ Seguridad

### Variables Sensibles

**NUNCA** incluir en este archivo:
- API Keys secretas
- Contraseñas
- Tokens de acceso
- Credenciales de bases de datos

### Buenas Prácticas

1. **`.env` en `.gitignore`**: Asegúrate de que `.env` esté en tu `.gitignore`
2. **Usar `.env.example`**: Mantén una plantilla con variables de ejemplo
3. **Documentar**: Comenta cada variable explicando su propósito
4. **Validar**: Valida las variables de entorno al iniciar la aplicación
5. **Defaults**: Siempre proporciona valores por defecto seguros

## 🔍 Validación de Variables

Puedes validar las variables de entorno al iniciar la aplicación:

```javascript
// En main.js o un archivo de configuración
const requiredEnvVars = [
  'VITE_API_BASE_URL',
  'VITE_APP_NAME'
]

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    console.warn(`⚠️ Variable de entorno faltante: ${varName}`)
  }
})
```

## 📚 Referencias

- [Documentación Vite - Variables de Entorno](https://vitejs.dev/guide/env-and-mode.html)
- [Especificación de Variables de Entorno](https://github.com/motdotla/dotenv#readme)

## 🆘 Solución de Problemas

### Las variables no se actualizan

**Solución**: Reinicia el servidor de desarrollo después de modificar `.env`

### Error "Variable is not defined"

**Solución**: Asegúrate de que:
1. La variable comienza con `VITE_`
2. Reiniciaste el servidor
3. No hay errores de sintaxis en el archivo `.env`

### Valores undefined

**Solución**: Usa el operador OR para proporcionar valores por defecto:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
```

## 🔄 Actualizaciones Recientes

### v1.0.0 - Configuración Inicial
- Configuración base de Vite
- Variables de API y autenticación
- Feature flags
- Configuración de seguridad
- Documentación completa

---

**Nota**: Este archivo se mantiene en el repositorio para referencia. Las variables reales deben configurarse en `.env` (local) o en el servidor de producción.