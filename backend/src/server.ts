import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { checkDbConnection, pool } from './db/pool.js';
import { searchVideos } from './services/youtube-ingestion.service.js';
import {
  createResearchArea,
  listResearchAreas,
  getResearchAreaById,
  updateResearchArea,
  deleteResearchArea,
} from './db/repositories/research-areas.repository.js';

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

// Research Areas endpoints
app.post('/api/research-areas', async (req, res) => {
  try {
    const { name, bbox, zoomLevel, travelType, category } = req.body;

    if (!name || !bbox) {
      return res.status(400).json({
        error: 'Missing required fields: name, bbox',
      });
    }

    const researchArea = await createResearchArea({
      name,
      bbox,
      zoomLevel,
      travelType,
      category,
    });

    return res.status(201).json(researchArea);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to create research area',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/research-areas', async (_req, res) => {
  try {
    const researchAreas = await listResearchAreas();
    return res.status(200).json(researchAreas);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to list research areas',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.get('/api/research-areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const researchArea = await getResearchAreaById(id);

    if (!researchArea) {
      return res.status(404).json({
        error: 'Research area not found',
      });
    }

    return res.status(200).json(researchArea);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to get research area',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.put('/api/research-areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, active, videos, pois } = req.body;

    const researchArea = await updateResearchArea(id, {
      name,
      active,
      videos,
      pois,
    });

    if (!researchArea) {
      return res.status(404).json({
        error: 'Research area not found',
      });
    }

    return res.status(200).json(researchArea);
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to update research area',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.delete('/api/research-areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteResearchArea(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Research area not found',
      });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to delete research area',
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
