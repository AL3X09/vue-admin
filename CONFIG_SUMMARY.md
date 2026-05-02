# 📋 Resumen de Configuración de Variables de Entorno

## 🎯 Objetivo
Configurar todas las variables de entorno necesarias para el correcto funcionamiento del frontend Vue.js (vue-admin) con soporte para diferentes entornos (desarrollo, producción).

## ✅ Archivos Creados/Modificados

### 1. `.env` (PRINCIPAL)
**Ubicación:** `/var/www/vue/vue-admin/.env`

**Descripción:** Archivo principal con todas las variables de entorno configuradas para desarrollo local.

**Variables incluidas:**
- **Vite Configuration** (6 variables)
  - `VITE_BASE_URL` - URL base de la aplicación
  - `VITE_APP_NAME` - Nombre de la app
  - `VITE_APP_VERSION` - Versión
  - `VITE_APP_DEBUG` - Modo debug

- **API Configuration** (2 variables)
  - `VITE_API_BASE_URL` - URL del backend FastAPI
  - `VITE_API_TIMEOUT` - Timeout de peticiones

- **Authentication** (5 variables)
  - `VITE_TOKEN_EXPIRATION_MINUTES` - Expiración JWT
  - `VITE_REMEMBER_ME_DAYS` - Recordar sesión
  - `VITE_TOKEN_STORAGE_KEY` - Clave token localStorage
  - `VITE_USER_STORAGE_KEY` - Clave usuario localStorage
  - `VITE_PASSWORD_CHANGE_STORAGE_KEY` - Clave cambio password

- **Notifications** (2 variables)
  - `VITE_TOAST_DURATION` - Duración notificaciones
  - `VITE_TOAST_POSITION` - Posición notificaciones

- **Pagination** (2 variables)
  - `VITE_DEFAULT_ITEMS_PER_PAGE` - Items por página
  - `VITE_ITEMS_PER_PAGE_OPTIONS` - Opciones paginación

- **Files** (3 variables)
  - `VITE_MAX_FILE_SIZE_MB` - Tamaño máximo archivos
  - `VITE_ALLOWED_IMAGE_TYPES` - Tipos de imágenes
  - `VITE_ALLOWED_DOCUMENT_TYPES` - Tipos de documentos

- **Security** (5 variables)
  - `VITE_PROTECTED_REDIRECT_URLS` - URLs protegidas
  - `VITE_MIN_PASSWORD_LENGTH` - Longitud mínima password
  - `VITE_PASSWORD_PATTERN` - Patrón password (regex)
  - `VITE_MAX_LOGIN_ATTEMPTS` - Máximo intentos fallidos
  - `VITE_LOGIN_LOCKOUT_MINUTES` - Tiempo bloqueo

- **Feature Flags** (6 variables)
  - `VITE_ENABLE_REGISTRATION` - Registro usuarios
  - `VITE_ENABLE_PASSWORD_CHANGE` - Cambio password
  - `VITE_ENABLE_DARK_MODE` - Modo oscuro
  - `VITE_ENABLE_NOTIFICATIONS` - Notificaciones
  - `VITE_ENABLE_DEBUG_LOGS` - Logs debug
  - `VITE_ENABLE_DATA_EXPORT` - Exportación datos

- **Analytics** (2 variables)
  - `VITE_GA_TRACKING_ID` - Google Analytics
  - `VITE_MATOMO_URL` - Matomo/Piwik

- **Sentry** (1 variable)
  - `VITE_SENTRY_DSN` - Monitoreo errores

- **Extras** (3 variables)
  - `VITE_CORS_ALLOWED_ORIGINS` - Orígenes CORS
  - `VITE_EXTERNAL_API_KEY` - API keys externas
  - `VITE_WS_URL` - WebSockets

### 2. `.env.example` (PLANTILLA)
**Ubicación:** `/var/www/vue/vue-admin/.env.example`

**Descripción:** Plantilla para que otros desarrolladores configuren su entorno.

**Diferencias con `.env`:**
- Mismas variables pero con valores de ejemplo
- Comentarios explicativos
- Sin valores sensibles

### 3. `ENVIRONMENT.md` (DOCUMENTACIÓN)
**Ubicación:** `/var/www/vue/vue-admin/ENVIRONMENT.md`

**Descripción:** Documentación completa del sistema de variables de entorno.

**Contenido:**
- Tabla de todas las variables con descripciones
- Ejemplos de uso en código
- Guía de configuración por entorno
- Buenas prácticas de seguridad
- Solución de problemas comunes

### 4. `src/stores/conf.js` (MODIFICADO)
**Ubicación:** `/var/www/vue/vue-admin/src/stores/conf.js`

**Cambios realizados:**
```javascript
// ANTES (hardcoded):
baseURL: 'http://127.0.0.1:8000',
timeout: 10000,

// DESPUÉS (configurable):
baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
```

**Beneficios:**
- Configuración centralizada
- Fácil cambio de entorno
- Sin necesidad de modificar código

### 5. `test-env.js` (PRUEBA)
**Ubicación:** `/var/www/vue/vue-admin/test-env.js`

**Descripción:** Script para verificar que las variables de entorno están correctamente configuradas.

## 🔧 Uso

### Para Desarrolladores

1. **Configuración inicial:**
```bash
cd /var/www/vue/vue-admin
cp .env.example .env
# Editar .env con los valores locales
```

2. **Iniciar desarrollo:**
```bash
npm run dev
```

3. **Verificar configuración:**
```bash
# Las variables se cargan automáticamente con Vite
# Ver consola del navegador para logs de inicialización
```

### Para Producción

1. **Crear archivo de producción:**
```bash
cp .env.example .env.production
```

2. **Configurar variables:**
```env
VITE_BASE_URL=/admin-one-vue-tailwind/
VITE_API_BASE_URL=https://api.tudominio.com
VITE_APP_DEBUG=false
VITE_ENABLE_DEBUG_LOGS=false
```

3. **Construir:**
```bash
npm run build
```

## 📊 Variables por Entorno

### Desarrollo (.env)
```env
VITE_BASE_URL=/
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_APP_DEBUG=true
VITE_ENABLE_DEBUG_LOGS=true
```

### Producción (.env.production)
```env
VITE_BASE_URL=/admin-one-vue-tailwind/
VITE_API_BASE_URL=https://api.tudominio.com
VITE_APP_DEBUG=false
VITE_ENABLE_DEBUG_LOGS=false
```

## 🔐 Seguridad

### Variables Sensibles (NO incluidas)
- API Keys secretas
- Contraseñas
- Tokens de acceso
- Credenciales de bases de datos

### Recomendaciones
1. Mantener `.env` en `.gitignore`
2. Usar `.env.example` como plantilla
3. Configurar secrets en CI/CD
4. No exponer variables sensibles al cliente

## 🎯 Beneficios

1. **Centralización:** Todas las configuraciones en un solo lugar
2. **Flexibilidad:** Fácil cambio entre entornos
3. **Mantenibilidad:** Sin modificar código para cambiar configuración
4. **Documentación:** Variables auto-documentadas
5. **Seguridad:** Separación de configuración y código
6. **Escalabilidad:** Fácil agregar nuevas variables
7. **Colaboración:** Plantilla para nuevos desarrolladores

## 📝 Notas Importantes

- Las variables con prefijo `VITE_` son accesibles desde el navegador
- Las variables sin `VITE_` son solo para tiempo de build (Node.js)
- Requiere reiniciar el servidor después de modificar `.env`
- Valores por defecto proporcionados para todas las variables
- Compatible con Vite 4.x y superiores

## 🚀 Próximos Pasos

1. Configurar CI/CD con variables de entorno
2. Implementar validación de variables al iniciar
3. Agregar monitoreo con Sentry (si se desea)
4. Configurar Google Analytics (si se desea)
5. Implementar WebSockets (si se necesita)

## 📞 Soporte

Para preguntas o problemas:
- Revisar `ENVIRONMENT.md` para documentación detallada
- Ver ejemplos en `.env.example`
- Consultar la documentación de Vite sobre variables de entorno

---

**Fecha:** 2026-05-01
**Versión:** 1.0.0
**Autor:** Configuración Automatizada