# 🐛 Guía de Debugging - Página en Blanco

## Problema: La página queda en blanco al cargar

### Pasos para Diagnosticar

#### 1. Abrir la Consola del Navegador
1. Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Option+I` (Mac)
2. Ve a la pestaña "Console"
3. Busca errores en rojo

#### 2. Verificar Errores Comunes

##### Error: "Cannot read property 'isAuthenticated' of undefined"
**Causa**: El auth store no se inicializó correctamente

**Solución**:
```bash
# Limpia el caché y reinicia
cd www/vue/admin-one-vue-tailwind
rm -rf node_modules/.vite
npm run dev
```

##### Error: "Failed to fetch" o "Network Error"
**Causa**: El backend no está corriendo o la URL es incorrecta

**Solución**:
1. Verifica que el backend esté corriendo en `http://127.0.0.1:8000`
2. Verifica la URL en `src/stores/conf.js`

##### Error: "Unexpected token" o "SyntaxError"
**Causa**: Error de sintaxis en el código

**Solución**:
1. Revisa la consola para ver qué archivo tiene el error
2. Verifica que todos los archivos estén guardados correctamente

#### 3. Verificar el Estado de la Aplicación

Abre la consola del navegador y ejecuta:

```javascript
// Verificar si Vue está montado
document.getElementById('app').innerHTML

// Verificar localStorage
console.log('Token:', localStorage.getItem('token'))
console.log('User:', localStorage.getItem('user'))

// Limpiar localStorage si es necesario
localStorage.clear()
```

#### 4. Verificar la Ruta Actual

```javascript
// En la consola del navegador
console.log('Hash actual:', window.location.hash)
console.log('Path actual:', window.location.pathname)
```

### Soluciones Rápidas

#### Solución 1: Limpiar Todo y Reiniciar

```bash
cd www/vue/admin-one-vue-tailwind

# Limpiar caché de Vite
rm -rf node_modules/.vite

# Limpiar dist si existe
rm -rf dist

# Reiniciar el servidor
npm run dev
```

Luego en el navegador:
1. Abre `http://localhost:5173/admin-one-vue-tailwind/`
2. Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac) para recargar sin caché
3. Abre la consola (F12) y verifica si hay errores

#### Solución 2: Verificar que el Router Funciona

Si la página está en blanco, intenta acceder directamente a:
- Login: `http://localhost:5173/admin-one-vue-tailwind/#/login`
- Registro: `http://localhost:5173/admin-one-vue-tailwind/#/registro`

Si estas páginas cargan, el problema es con el guard del router.

#### Solución 3: Deshabilitar Temporalmente el Guard

Si necesitas probar sin autenticación, puedes comentar temporalmente el guard:

```javascript
// En src/router/index.js
router.beforeEach((to, from, next) => {
  // Comentar temporalmente para debugging
  next() // Permitir todas las navegaciones
  return
  
  // ... resto del código
})
```

**IMPORTANTE**: No olvides descomentar esto después de debuggear.

### Verificar que Todo Funciona

#### Test 1: Verificar que Vue está montado

```javascript
// En la consola del navegador
console.log('App montada:', !!document.getElementById('app').__vue_app__)
```

#### Test 2: Verificar que Pinia funciona

```javascript
// En la consola del navegador
import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()
console.log('Auth store:', authStore)
```

#### Test 3: Verificar que el Router funciona

```javascript
// En la consola del navegador
console.log('Ruta actual:', window.location.hash)
// Cambiar de ruta
window.location.hash = '#/login'
```

### Logs Esperados en la Consola

Cuando la aplicación carga correctamente, deberías ver:

```
🚀 Inicializando aplicación...
🔐 Estado de autenticación: No autenticado
🔍 Navegando a: /
🔐 Requiere auth: true
👤 Está autenticado: false
🚫 Acceso denegado. Redirigiendo a login...
🔍 Navegando a: /login
🔐 Requiere auth: false
👤 Está autenticado: false
✅ Navegación permitida
```

### Si Nada Funciona

#### Opción 1: Revertir Cambios Temporalmente

Si necesitas que la aplicación funcione inmediatamente, puedes:

1. Comentar el guard en `src/router/index.js`:
```javascript
router.beforeEach((to, from, next) => {
  next() // Permitir todo temporalmente
})
```

2. Comentar la inicialización del auth en `src/main.js`:
```javascript
// const authStore = useAuthStore(pinia)
// authStore.initialize()
```

#### Opción 2: Usar una Versión Anterior

Si tienes git configurado:
```bash
git status
git diff src/
```

### Contactar Soporte

Si el problema persiste, proporciona:
1. Captura de pantalla de la consola del navegador
2. Captura de pantalla de la pestaña Network
3. Contenido de `localStorage` (ejecuta `console.log(localStorage)` en la consola)
4. Versión de Node.js (`node --version`)
5. Versión de npm (`npm --version`)

### Checklist de Verificación

- [ ] El backend está corriendo en `http://127.0.0.1:8000`
- [ ] El frontend está corriendo en `http://localhost:5173`
- [ ] No hay errores en la consola del navegador
- [ ] El archivo `src/stores/auth.js` existe
- [ ] El archivo `src/stores/conf.js` tiene la URL correcta del backend
- [ ] El archivo `src/router/index.js` tiene el guard configurado
- [ ] El archivo `src/main.js` inicializa el auth store
- [ ] No hay errores de sintaxis en ningún archivo
- [ ] El caché del navegador está limpio (Ctrl+Shift+R)
- [ ] El caché de Vite está limpio (`rm -rf node_modules/.vite`)

### Comandos Útiles

```bash
# Ver logs del servidor de desarrollo
cd www/vue/admin-one-vue-tailwind
npm run dev

# Verificar que no hay errores de sintaxis
npm run build

# Limpiar todo
rm -rf node_modules/.vite dist
npm run dev
```

---

## 🎯 Solución Más Probable

El problema más común es que el router está redirigiendo a `/login` pero la vista no se está cargando. Esto puede ser porque:

1. **El guard se ejecuta antes de que Vue esté listo**
   - Solución: Ya corregido en `main.js` inicializando el auth store antes de montar la app

2. **El hash router no está funcionando correctamente**
   - Solución: Ya corregido en `conf.js` usando `window.location.hash` en lugar de `window.location.href`

3. **Hay un error de JavaScript que detiene la ejecución**
   - Solución: Abre la consola del navegador y busca errores en rojo

### Prueba Esto Ahora

1. Abre `http://localhost:5173/admin-one-vue-tailwind/`
2. Presiona `F12` para abrir la consola
3. Busca mensajes que empiecen con 🚀, 🔐, 🔍
4. Si ves "🚫 Acceso denegado. Redirigiendo a login...", la aplicación está funcionando
5. Deberías ser redirigido automáticamente a `http://localhost:5173/admin-one-vue-tailwind/#/login`
6. Si ves el formulario de login, ¡todo funciona!

Si no ves nada, copia y pega los errores de la consola para ayudarte mejor.
