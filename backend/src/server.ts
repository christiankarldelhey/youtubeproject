import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { checkDbConnection, pool } from './db/pool.js';
import { createWeatherPublisher } from './mqtt/publisher.js';
import { getCurrentWeather, ingestCurrentWeather } from './services/weather-ingestion.service.js';

const app = express();
const weatherPublisher = createWeatherPublisher();
let weatherJobTimer: NodeJS.Timeout | null = null;
let weatherIngestInProgress = false;

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await checkDbConnection();

    return res.status(200).json({
      status: 'ok',
      db: 'connected',
    });
  } catch {
    return res.status(503).json({
      status: 'degraded',
      db: 'disconnected',
    });
  }
});

async function runWeatherIngest(source: 'manual' | 'scheduler') {
  if (weatherIngestInProgress) {
    return null;
  }

  weatherIngestInProgress = true;

  try {
    const summary = await ingestCurrentWeather((record) => weatherPublisher.publishCurrent(record));
    return {
      source,
      ...summary,
    };
  } catch (error) {
    console.error('[weather] ingestion failed', error);
    throw error;
  } finally {
    weatherIngestInProgress = false;
  }
}

function startWeatherScheduler() {
  const intervalMs = env.WEATHER_INGEST_INTERVAL_SECONDS * 1000;
  weatherJobTimer = setInterval(() => {
    void runWeatherIngest('scheduler');
  }, intervalMs);
}

app.post('/weather/ingest', async (_req, res) => {
  try {
    const summary = await runWeatherIngest('manual');

    if (summary === null) {
      return res.status(202).json({
        status: 'skipped',
        reason: 'ingestion already in progress',
      });
    }

    return res.status(200).json(summary);
  } catch (error) {
    return res.status(502).json({
      error: 'Failed to ingest current weather',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/weather/current', async (_req, res) => {
  try {
    const weather = await getCurrentWeather();

    return res.status(200).json({
      total: weather.length,
      weather,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to read current weather',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const shutdown = async () => {
  if (weatherJobTimer) {
    clearInterval(weatherJobTimer);
    weatherJobTimer = null;
  }

  await weatherPublisher.disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(env.PORT, async () => {
  try {
    await checkDbConnection();
    await weatherPublisher.connect();
    startWeatherScheduler();
    console.log(`Backend running on http://localhost:${env.PORT}`);
    console.log('PostgreSQL connection: OK');
    console.log(`[weather] scheduler interval: ${env.WEATHER_INGEST_INTERVAL_SECONDS}s`);
  } catch (error) {
    console.error('Backend startup checks failed', error);
  }
});
