-- Desconectar todas las conexiones activas
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'weather-db'
  AND pid <> pg_backend_pid();

-- Renombrar base de datos
ALTER DATABASE "weather-db" RENAME TO "travel-db";
