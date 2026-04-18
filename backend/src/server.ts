import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { checkDbConnection, pool } from './db/pool.js';
import { getMeteoalarmPreview, ingestMeteoalarmAlerts } from './services/alerts-ingestion.service.js';
import { getAlert, getAlerts } from './services/alerts-query.service.js';

const app = express();

function parsePositiveInteger(value: unknown): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.trunc(parsed);
}

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

app.post('/meteoalarm/ingest', async (req, res) => {
  const limitRaw = req.query.limit ?? req.body?.limit;

  if (limitRaw !== undefined && parsePositiveInteger(limitRaw) === null) {
    return res.status(400).json({
      error: 'Invalid limit. It must be a positive integer.',
    });
  }

  try {
    const summary = await ingestMeteoalarmAlerts(limitRaw);

    return res.status(200).json(summary);
  } catch (error) {
    return res.status(502).json({
      error: 'Failed to ingest Meteoalarm alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/alerts', async (req, res) => {
  const limitRaw = req.query.limit;
  const offsetRaw = req.query.offset;

  const limit = limitRaw === undefined ? 50 : parsePositiveInteger(limitRaw);
  const offset = offsetRaw === undefined ? 0 : Number(offsetRaw);

  if (limit === null || !Number.isFinite(offset) || offset < 0 || !Number.isInteger(offset)) {
    return res.status(400).json({
      error: 'Invalid pagination. limit must be positive integer and offset must be non-negative integer.',
    });
  }

  const safeLimit = Math.min(limit, 200);
  const provider = typeof req.query.provider === 'string' ? req.query.provider.trim() || undefined : undefined;

  try {
    const alerts = await getAlerts({
      provider,
      limit: safeLimit,
      offset,
    });

    return res.status(200).json({
      total: alerts.length,
      limit: safeLimit,
      offset,
      provider: provider ?? null,
      alerts,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to read alerts',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/alerts/:id', async (req, res) => {
  const id = parsePositiveInteger(req.params.id);

  if (id === null) {
    return res.status(400).json({
      error: 'Invalid id. It must be a positive integer.',
    });
  }

  try {
    const alert = await getAlert(id);

    if (!alert) {
      return res.status(404).json({
        error: 'Alert not found',
      });
    }

    return res.status(200).json(alert);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to read alert',
      details: error instanceof Error ? error.message : 'Unknown error',
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
  try {
    const preview = await getMeteoalarmPreview(req.query.limit);

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
