# Backend Node.js + Express + PostgreSQL/PostGIS

Backend API para el proyecto YouTravel con capacidades GIS.

## Setup

### Requisitos
- Node.js 18+
- PostgreSQL 12+ con PostGIS 3.0+

### Carpetas

- `migrations/` - Scripts SQL para crear y actualizar el esquema de base de datos
- `src/` - Código fuente del backend (próximamente)

## Migrations

### 000_verify_postgis.sql
Script de verificación que prueba:
- Instalación de PostGIS
- Diferencia entre GEOMETRY y GEOGRAPHY
- Cálculos de distancia correctos
- Índices GIST
- Funciones espaciales básicas

**Ejecutar**:
```bash
psql -U tu_usuario -d youtravel_gis -f migrations/000_verify_postgis.sql
```

## Próximos Pasos

1. Crear estructura del backend (Plan 2)
2. Implementar modelos y servicios
3. Crear endpoints REST
