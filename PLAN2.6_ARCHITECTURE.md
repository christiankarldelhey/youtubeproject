# ✅ Plan 2.6: Refactorización de Arquitectura - COMPLETADO

## 🏗️ Nueva Arquitectura con Capa de Services

Se ha refactorizado completamente el backend para seguir las mejores prácticas de arquitectura en capas.

---

## 📁 Estructura Actual

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuración PostgreSQL
│   ├── models/
│   │   └── Video.ts             # Acceso directo a base de datos
│   ├── services/                # ✨ NUEVO - Lógica de negocio
│   │   ├── youtubeService.ts    # Llamadas a YouTube API
│   │   ├── videoService.ts      # Lógica de videos + cache
│   │   └── osmService.ts        # Llamadas a Overpass API (OSM)
│   ├── routes/
│   │   ├── videos.ts            # Endpoints de videos (refactorizado)
│   │   ├── users.ts             # Endpoints de usuarios
│   │   └── pois.ts              # ✨ NUEVO - Endpoints de POIs
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── server.ts                # Express server
```

---

## 🎯 Services Creados

### 1. `youtubeService.ts` - YouTube API

**Responsabilidad**: Comunicación con YouTube API

```typescript
class YouTubeService {
  // Buscar videos geolocalizados
  async searchVideos(params: {
    latitude, longitude, radius, maxResults, apiKey
  }): Promise<YouTubeVideo[]>

  // Obtener detalles de un video
  async getVideoDetails(videoId, apiKey): Promise<YouTubeVideo | null>
}
```

**Características**:
- Maneja llamadas a YouTube Data API v3
- Parsea respuestas de YouTube
- Filtra videos con geolocalización
- Extrae: título, descripción, thumbnail, coordenadas, etc.

---

### 2. `videoService.ts` - Lógica de Videos

**Responsabilidad**: Lógica de negocio de videos + cache PostgreSQL

```typescript
class VideoService {
  // Buscar videos (PostgreSQL + YouTube API)
  async searchVideos(params, youtubeApiKey?): Promise<Video[]>
  
  // Guardar video en PostgreSQL
  async saveVideo(videoData): Promise<Video>
  
  // Obtener videos cercanos (solo PostgreSQL)
  async getVideosNearby(lon, lat, radius, limit): Promise<Video[]>
  
  // Obtener todos los videos
  async getAllVideos(filters): Promise<Video[]>
  
  // Calcular densidad de videos (videos/km²)
  async calculateVideoDensity(lon, lat, radius): Promise<number>
}
```

**Flujo de `searchVideos()`**:
1. Busca en PostgreSQL primero (cache)
2. Si no hay suficientes, consulta YouTube API
3. Guarda nuevos videos en PostgreSQL
4. Retorna resultados combinados

**Ventajas**:
- Cache automático en PostgreSQL
- Reduce llamadas a YouTube API
- Datos persistentes para análisis GIS

---

### 3. `osmService.ts` - OpenStreetMap / Overpass API

**Responsabilidad**: Obtener POIs de OpenStreetMap

```typescript
class OSMService {
  // Obtener POIs de Overpass API
  async getPOIsNearLocation(
    lat, lon, radius, categories
  ): Promise<OSMPoi[]>
  
  // Guardar POIs en PostgreSQL
  async savePOIs(pois): Promise<number>
  
  // Obtener POIs de PostgreSQL
  async getPOIsFromDB(lon, lat, radius, category?): Promise<POI[]>
  
  // Contar POIs cercanos
  async countPOIsNearLocation(lon, lat, radius, category?): Promise<number>
}
```

**Categorías de POIs**:
- `tourism`: atracciones, hoteles, museos
- `amenity`: restaurantes, cafés, bancos
- `leisure`: parques, deportes
- `natural`: playas, montañas, ríos

**Ejemplo de query Overpass**:
```
Buscar todos los POIs turísticos en 5km de Oviedo
→ Retorna: hoteles, museos, monumentos, etc.
→ Se guardan en tabla osm_pois
```

---

## 🔌 Endpoints Actualizados

### Videos

#### GET /api/videos?lat=43.36&lon=-5.84&radius=5000
**Nuevo comportamiento**:
1. Busca en PostgreSQL (cache)
2. Si faltan videos, consulta YouTube API
3. Guarda nuevos videos en PostgreSQL
4. Retorna videos combinados

**Parámetros**:
- `lat`, `lon`: Coordenadas
- `radius`: Radio en metros (default: 5000)
- `limit`: Máximo de resultados (default: 50)
- `useCache`: Usar cache PostgreSQL (default: true)

#### GET /api/videos/nearby/:lon/:lat
Videos cercanos (solo PostgreSQL)

#### GET /api/videos/:id
Video por ID

#### POST /api/videos
Crear video manualmente

---

### POIs (Nuevo)

#### GET /api/pois/nearby/:lon/:lat?fetchNew=true
Obtener POIs cercanos

**Parámetros**:
- `radius`: Radio en metros (default: 5000)
- `category`: Filtrar por categoría (tourism, amenity, etc.)
- `fetchNew`: Si true, consulta Overpass API y guarda en PostgreSQL

**Ejemplo**:
```bash
# Obtener POIs de PostgreSQL
GET /api/pois/nearby/-5.84/43.36?radius=5000

# Fetch nuevos POIs de OSM y guardar
GET /api/pois/nearby/-5.84/43.36?radius=5000&fetchNew=true&category=tourism
```

#### GET /api/pois/count/:lon/:lat
Contar POIs cercanos

---

## 🔄 Flujo Completo de Búsqueda

**Usuario busca videos en Oviedo**:

```
1. Frontend
   GET /api/videos?lat=43.36&lon=-5.84&radius=5000

2. Backend (routes/videos.ts)
   → videoService.searchVideos()

3. videoService
   a) Busca en PostgreSQL (VideoModel.findNearby)
      → Encuentra 2 videos en cache
   
   b) Faltan videos, llama a youtubeService
      → youtubeService.searchVideos()
      → Llama a YouTube API
      → Retorna 15 videos nuevos
   
   c) Guarda nuevos videos en PostgreSQL
      → VideoModel.create() x15
   
   d) Retorna 17 videos totales (2 cache + 15 nuevos)

4. Frontend recibe videos
```

---

## 📊 Ventajas de la Nueva Arquitectura

### 1. Separación de Responsabilidades
- **Routes**: Solo manejan HTTP requests/responses
- **Services**: Lógica de negocio
- **Models**: Acceso a base de datos

### 2. Reutilización de Código
```typescript
// Antes: Duplicar código en cada ruta
router.get('/videos', async () => {
  // Llamar YouTube API aquí
  // Parsear respuesta aquí
  // Guardar en DB aquí
});

// Ahora: Reutilizar service
router.get('/videos', async () => {
  const videos = await videoService.searchVideos(params);
  res.json(videos);
});
```

### 3. Testing Más Fácil
```typescript
// Testear service independientemente
describe('VideoService', () => {
  it('should cache videos in PostgreSQL', async () => {
    const videos = await videoService.searchVideos(...);
    expect(videos.length).toBeGreaterThan(0);
  });
});
```

### 4. Cache Automático
- Videos de YouTube se guardan automáticamente
- Reduce llamadas a APIs externas
- Datos persistentes para análisis

### 5. Preparado para Métricas GIS
```typescript
// Fácil agregar nuevas funcionalidades
async calculateDestinationType(lon, lat, radius) {
  const videoCount = await videoService.getVideosNearby(...);
  const poiCount = await osmService.countPOIsNearLocation(...);
  const ratio = videoCount / poiCount;
  
  if (ratio < 0.1) return "Hidden but Active";
  if (ratio > 2) return "Well Documented";
  // etc.
}
```

---

## 🆚 Antes vs Ahora

### Antes (Incorrecto)
```
Frontend (useYouTube.ts)
    ↓
YouTube API directamente
    ↓
Parsear en frontend
    ↓
Mostrar videos
```

**Problemas**:
- Lógica de negocio en frontend
- No hay cache
- Difícil de testear
- Límites de YouTube API

### Ahora (Correcto)
```
Frontend (useBackendApi.ts)
    ↓
Backend API (/api/videos)
    ↓
videoService
    ├→ PostgreSQL (cache)
    └→ youtubeService → YouTube API
    ↓
Retorna videos combinados
```

**Ventajas**:
- Lógica en backend
- Cache automático
- Fácil de testear
- Menos llamadas a YouTube API
- Datos persistentes para GIS

---

## 📦 Dependencias Agregadas

```json
{
  "dependencies": {
    "axios": "^1.6.0"  // Para llamadas HTTP a YouTube y Overpass API
  }
}
```

---

## 🚀 Próximos Pasos

Con esta arquitectura limpia, ahora podemos:

### Plan 3: Métricas GIS Avanzadas
- Calcular densidad de videos
- Ratio videos/POIs
- Clasificación de destinos
- Discovery score

### Plan 4: Integración Frontend
- Actualizar `useYouTube.ts` para usar backend
- Eliminar llamadas directas a YouTube API
- Usar `useBackendApi.getVideos()`

### Plan 5: Optimizaciones
- Vistas materializadas
- Triggers para actualización automática
- Funciones SQL personalizadas

---

## ✅ Checklist

- [x] Crear carpeta `services/`
- [x] Crear `youtubeService.ts`
- [x] Crear `videoService.ts`
- [x] Crear `osmService.ts`
- [x] Refactorizar `routes/videos.ts`
- [x] Crear `routes/pois.ts`
- [x] Actualizar `server.ts`
- [x] Instalar `axios`
- [x] Documentar arquitectura

---

**Estado**: ✅ COMPLETADO  
**Arquitectura**: Profesional y escalable  
**Listo para**: Métricas GIS y análisis avanzado

🎉 Backend refactorizado con arquitectura en capas!
