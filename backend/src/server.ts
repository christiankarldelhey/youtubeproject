import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { checkDbConnection, pool } from './db/pool.js';
import { searchVideos } from './services/youtube-ingestion.service.js';

const app = express();

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

app.post('/api/videos/search', async (req, res) => {
  try {
    const { apiKey, currentMapPosition, currentZoom, searchQuery, category } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'Missing required field: apiKey',
      });
    }

    const result = await searchVideos({
      apiKey,
      currentMapPosition,
      currentZoom,
      searchQuery,
      category,
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(502).json({
      error: 'Failed to search videos',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Weather endpoints temporarily disabled
// app.post('/weather/ingest', async (_req, res) => { ... });
// app.get('/weather/current', async (_req, res) => { ... });

const shutdown = async () => {
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

app.listen(env.PORT, async () => {
  try {
    await checkDbConnection();
    console.log(`Backend running on http://localhost:${env.PORT}`);
    console.log('PostgreSQL connection: OK');
  } catch (error) {
    console.error('Backend startup checks failed', error);
  }
});
