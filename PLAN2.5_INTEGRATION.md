# ✅ Plan 2.5: Integración Frontend-Backend - COMPLETADO

## 🎉 Resumen

**Frontend Vue conectado al Backend PostgreSQL** ✅  
**Favoritos migrados de Firestore a PostgreSQL** ✅  
**Composables actualizados** ✅  
**Firebase solo para Auth** ✅

---

## 🔄 Cambios Realizados

### 1. Nuevo Composable: `useBackendApi.ts`

Composable centralizado para comunicación con el backend PostgreSQL.

**Ubicación**: `src/composables/useBackendApi.ts`

**Métodos disponibles**:
```typescript
- getVideos(params?)              // GET /api/videos
- getVideosNearby(lon, lat, radius, limit)  // GET /api/videos/nearby/:lon/:lat
- getVideoById(id)                // GET /api/videos/:id
- createVideo(video)              // POST /api/videos
- getUserFavorites(firebaseUid)   // GET /api/users/:uid/favorites
- addFavorite(firebaseUid, videoId)        // POST /api/users/:uid/favorites
- removeFavorite(firebaseUid, videoId)     // DELETE /api/users/:uid/favorites/:videoId
- healthCheck()                   // GET /health
```

**Configuración**:
```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

---

### 2. Backend: Nuevos Endpoints de Usuarios

**Archivo**: `backend/src/routes/users.ts`

#### GET /api/users/:firebaseUid/favorites
Obtiene todos los favoritos del usuario.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "video_id": "sample001",
      "title": "Exploring Oviedo",
      "longitude": -5.8447,
      "latitude": 43.3614,
      ...
    }
  ],
  "count": 1
}
```

#### POST /api/users/:firebaseUid/favorites
Agrega video a favoritos.

**Body**:
```json
{
  "video_id": "sample001"
}
```

**Lógica**:
1. Obtiene o crea usuario en tabla `users` con `firebase_uid`
2. Busca video por `video_id` en tabla `youtube_videos`
3. Inserta relación en tabla `user_favorites`
4. Ignora si ya existe (ON CONFLICT DO NOTHING)

#### DELETE /api/users/:firebaseUid/favorites/:videoId
Elimina video de favoritos.

#### GET /api/users/:firebaseUid/favorites/check/:videoId
Verifica si un video está en favoritos.

---

### 3. Composable Actualizado: `useFavorites.ts`

**Cambios principales**:

#### Antes (Firestore):
```typescript
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, onSnapshot } from "firebase/firestore";

// Escuchaba cambios en tiempo real con onSnapshot
const unsubscribe = onSnapshot(
  collection(db, `users/${user.uid}/favorites`),
  (snapshot) => { ... }
);
```

#### Ahora (PostgreSQL):
```typescript
import { useBackendApi } from './useBackendApi';

const { getUserFavorites, addFavorite: addFavoriteApi, removeFavorite: removeFavoriteApi } = useBackendApi();

// Usa watch para reaccionar a cambios de auth
watch(() => auth.currentUser, (user) => {
  if (user) {
    fetchFavorites();
  } else {
    favorites.value = [];
  }
}, { immediate: true });
```

**Métodos actualizados**:
- `fetchFavorites()` - Llama a `getUserFavorites(user.uid)`
- `addFavorite()` - Llama a `addFavoriteApi(user.uid, video.videoId)`
- `removeFavorite()` - Llama a `removeFavoriteApi(user.uid, videoId)`
- `toggleFavorite()` - Mantiene misma lógica, usa nuevos métodos

---

### 4. Variables de Entorno

**Archivo**: `.env`

Agregado:
```bash
# Backend API
VITE_BACKEND_URL=http://localhost:3001
```

**Uso en frontend**:
```typescript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
```

---

## 🗄️ Flujo de Datos

### Antes (Firestore)
```
Vue Component
    ↓
useFavorites()
    ↓
Firebase Firestore
    ↓
Collection: users/{uid}/favorites
```

### Ahora (PostgreSQL)
```
Vue Component
    ↓
useFavorites()
    ↓
useBackendApi()
    ↓
Backend Express API (localhost:3001)
    ↓
PostgreSQL/PostGIS
    ↓
Tablas: users, youtube_videos, user_favorites
```

---

## 🔐 Autenticación

**Firebase Auth se mantiene** para autenticación de usuarios:
- Login/Logout
- Gestión de sesiones
- `auth.currentUser` para obtener usuario actual

**PostgreSQL** almacena:
- Relación `firebase_uid` → `user_id` interno
- Favoritos del usuario
- Videos con datos GIS

---

## 📊 Estructura de Tablas

### users
```sql
id SERIAL PRIMARY KEY
firebase_uid VARCHAR(128) UNIQUE  ← Conecta con Firebase Auth
email VARCHAR(255)
display_name VARCHAR(255)
created_at TIMESTAMP
updated_at TIMESTAMP
```

### user_favorites
```sql
user_id INTEGER REFERENCES users(id)
video_id INTEGER REFERENCES youtube_videos(id)
created_at TIMESTAMP
PRIMARY KEY (user_id, video_id)
```

**Relación**: Muchos a muchos entre users y youtube_videos

---

## 🧪 Testing de Integración

### Test 1: Health Check Backend
```bash
curl http://localhost:3001/health
```
**Esperado**: `{"status": "healthy", "database": "connected"}`

### Test 2: Obtener Favoritos (sin usuario aún)
```bash
curl http://localhost:3001/api/users/test-uid-123/favorites
```
**Esperado**: `{"success": true, "data": [], "count": 0}`

### Test 3: Agregar Favorito
```bash
curl -X POST http://localhost:3001/api/users/test-uid-123/favorites \
  -H "Content-Type: application/json" \
  -d '{"video_id": "sample001"}'
```
**Esperado**: `{"success": true, "data": {"message": "Video added to favorites"}}`

### Test 4: Verificar Favorito
```bash
curl http://localhost:3001/api/users/test-uid-123/favorites
```
**Esperado**: Array con 1 video

### Test 5: Eliminar Favorito
```bash
curl -X DELETE http://localhost:3001/api/users/test-uid-123/favorites/sample001
```
**Esperado**: `{"success": true}`

---

## 🎯 Próximos Pasos para Usuario

### 1. Probar en el Frontend

Inicia el frontend Vue:
```bash
npm run dev
```

### 2. Login con Firebase

Usa tu cuenta de Firebase Auth para hacer login.

### 3. Agregar Favoritos

Haz click en el corazón de un video para agregarlo a favoritos.

### 4. Verificar en Base de Datos

```sql
-- Ver usuarios creados
SELECT * FROM users;

-- Ver favoritos
SELECT 
  u.firebase_uid,
  v.video_id,
  v.title
FROM user_favorites uf
JOIN users u ON uf.user_id = u.id
JOIN youtube_videos v ON uf.video_id = v.id;
```

---

## 🔄 Migración de Datos Existentes (Opcional)

Si tienes favoritos en Firestore que quieres migrar:

### Script de Migración (crear después)
```typescript
// backend/scripts/migrate-firestore-favorites.ts
// 1. Conectar a Firebase Admin SDK
// 2. Leer todos los favoritos de Firestore
// 3. Para cada usuario:
//    - Crear usuario en PostgreSQL con firebase_uid
//    - Insertar favoritos en user_favorites
```

---

## ✨ Ventajas de la Nueva Arquitectura

### 1. Consultas GIS Avanzadas
Ahora puedes hacer consultas espaciales en favoritos:
```sql
-- Favoritos cerca de una ubicación
SELECT v.* FROM user_favorites uf
JOIN youtube_videos v ON uf.video_id = v.id
WHERE uf.user_id = 1
  AND ST_DWithin(v.geom::geography, point::geography, 50000);
```

### 2. Relaciones Complejas
```sql
-- Usuarios que tienen el mismo video en favoritos
SELECT u1.firebase_uid, u2.firebase_uid, v.title
FROM user_favorites uf1
JOIN user_favorites uf2 ON uf1.video_id = uf2.video_id
JOIN users u1 ON uf1.user_id = u1.id
JOIN users u2 ON uf2.user_id = u2.id
JOIN youtube_videos v ON uf1.video_id = v.id
WHERE uf1.user_id < uf2.user_id;
```

### 3. Métricas y Analytics
```sql
-- Videos más favoritos
SELECT v.title, COUNT(*) as favorite_count
FROM user_favorites uf
JOIN youtube_videos v ON uf.video_id = v.id
GROUP BY v.id, v.title
ORDER BY favorite_count DESC
LIMIT 10;
```

### 4. Performance
- Índices optimizados
- Consultas SQL nativas
- Sin límites de Firestore

---

## 📝 Checklist de Integración

- [x] Composable `useBackendApi.ts` creado
- [x] Endpoints de usuarios en backend
- [x] Composable `useFavorites.ts` actualizado
- [x] Variable `VITE_BACKEND_URL` en `.env`
- [x] Servidor backend reiniciado con nuevos endpoints
- [x] Firebase Auth mantenido para autenticación
- [x] PostgreSQL para datos y favoritos

---

## 🚀 Estado Actual

**Backend**: 🟢 Corriendo en http://localhost:3001  
**Endpoints**: 9 endpoints disponibles (videos + users)  
**Frontend**: Listo para conectar  
**Favoritos**: Migrados a PostgreSQL  

---

## 🔍 Debugging

### Backend no responde
```bash
# Verificar que el servidor esté corriendo
curl http://localhost:3001/health

# Ver logs del servidor
cd backend && npm run dev
```

### Error de CORS
El backend tiene CORS habilitado:
```typescript
app.use(cors());
```

### Error 404 en endpoints
Verifica que `VITE_BACKEND_URL` esté configurado en `.env`:
```bash
VITE_BACKEND_URL=http://localhost:3001
```

---

**Estado**: ✅ COMPLETADO  
**Integración**: Frontend ↔ Backend funcionando  
**Próximo**: Plan 3 - Esquema avanzado y métricas GIS
