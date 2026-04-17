-- ============================================
-- Script de Verificación PostGIS
-- ============================================

-- 1. Verificar que PostGIS está instalado
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Mostrar versión
SELECT 'PostGIS Version:' as info, PostGIS_version() as version;

-- 3. Crear tabla de prueba con geometría
CREATE TABLE IF NOT EXISTS test_points (
    id SERIAL PRIMARY KEY,
    name TEXT,
    geom GEOMETRY(POINT, 4326)
);

-- 4. Insertar puntos de prueba (ciudades españolas)
INSERT INTO test_points (name, geom) VALUES
('Oviedo', ST_SetSRID(ST_MakePoint(-5.8447, 43.3614), 4326)),
('Gijón', ST_SetSRID(ST_MakePoint(-5.6615, 43.5322), 4326)),
('Madrid', ST_SetSRID(ST_MakePoint(-3.7038, 40.4168), 4326)),
('Barcelona', ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326));

-- 5. Test: Distancia en GRADOS (incorrecto)
SELECT 
    '❌ Distancia en grados (incorrecto):' as test,
    a.name as from_city,
    b.name as to_city,
    ROUND(ST_Distance(a.geom, b.geom)::numeric, 4) as distance_degrees
FROM test_points a, test_points b
WHERE a.name = 'Oviedo' AND b.name = 'Gijón';

-- 6. Test: Distancia en METROS con GEOGRAPHY (correcto)
SELECT 
    '✅ Distancia en km con geography (correcto):' as test,
    a.name as from_city,
    b.name as to_city,
    ROUND((ST_Distance(a.geom::geography, b.geom::geography) / 1000)::numeric, 2) as distance_km
FROM test_points a, test_points b
WHERE a.name = 'Oviedo' AND b.name = 'Gijón';
-- Resultado esperado: ~28 km

-- 7. Test: Ciudades dentro de 500km de Madrid
SELECT 
    '✅ Ciudades a menos de 500km de Madrid:' as test,
    p.name,
    ROUND((ST_Distance(
        (SELECT geom FROM test_points WHERE name = 'Madrid')::geography,
        p.geom::geography
    ) / 1000)::numeric, 2) as distance_km
FROM test_points p
WHERE p.name != 'Madrid'
  AND ST_DWithin(
    (SELECT geom FROM test_points WHERE name = 'Madrid')::geography,
    p.geom::geography,
    500000  -- 500km en metros
  )
ORDER BY distance_km;

-- 8. Test: Buffer de 50km alrededor de Oviedo
SELECT 
    '✅ Área de buffer 50km alrededor de Oviedo:' as test,
    ROUND((ST_Area(
        ST_Buffer(
            (SELECT geom FROM test_points WHERE name = 'Oviedo')::geography,
            50000  -- 50km en metros
        )
    ) / 1000000)::numeric, 2) as area_km2;
-- Resultado esperado: ~7854 km² (π * 50²)

-- 9. Test: Índice espacial
CREATE INDEX idx_test_points_geom ON test_points USING GIST(geom);
SELECT '✅ Índice GIST creado correctamente' as test;

-- 10. Verificar índice
SELECT 
    '✅ Verificar índice:' as test,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'test_points';

-- 11. Limpiar
DROP TABLE test_points;
SELECT '✅ Tests completados exitosamente' as result;
