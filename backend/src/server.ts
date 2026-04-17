import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database';
import videosRouter from './routes/videos';
import usersRouter from './routes/users';
import poisRouter from './routes/pois';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW(), PostGIS_version() as postgis_version');
    
    res.json({
      status: 'healthy',
      timestamp: result.rows[0].now,
      database: 'connected',
      postgis: result.rows[0].postgis_version,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// API Routes
app.use('/api/videos', videosRouter);
app.use('/api/users', usersRouter);
app.use('/api/pois', poisRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'YouTravel GIS API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      videos: '/api/videos',
      videosById: '/api/videos/:id',
      videosNearby: '/api/videos/nearby/:lon/:lat',
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 YouTravel GIS API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Server running on: http://localhost:${PORT}
🗄️  Database: ${process.env.POSTGRES_DB}
🌍 PostGIS enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Available endpoints:
  GET  /health
  GET  /api/videos
  GET  /api/videos/:id
  GET  /api/videos/nearby/:lon/:lat
  POST /api/videos
  `);
});

export default app;
