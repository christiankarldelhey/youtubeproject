import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { checkDbConnection, pool } from './db/pool.js';
import { fetchMeteoalarmPreview } from './providers/meteoalarm/client.js';

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

app.get('/meteoalarm/config', (_req, res) => {
  return res.status(200).json({
    provider: 'meteoalarm',
    feedUrl: env.METEOALARM_FEED_URL,
  });
});

app.get('/meteoalarm/preview', async (req, res) => {
  const limit = Number(req.query.limit ?? 10);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 25) : 10;

  try {
    const preview = await fetchMeteoalarmPreview(safeLimit);

    return res.status(200).json(preview);
  } catch (error) {
    return res.status(502).json({
      error: 'Failed to fetch Meteoalarm feed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

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
    console.error('PostgreSQL connection failed on startup', error);
  }
});
