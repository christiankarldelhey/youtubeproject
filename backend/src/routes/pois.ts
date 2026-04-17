import { Router, Request, Response } from 'express';
import { osmService } from '../services/osmService';
import { ApiResponse } from '../types';

const router = Router();

/**
 * GET /api/pois/nearby/:lon/:lat
 * Get POIs near a location (fetches from OSM and saves to PostgreSQL)
 */
router.get('/nearby/:lon/:lat', async (req: Request, res: Response) => {
  try {
    const lon = parseFloat(req.params.lon);
    const lat = parseFloat(req.params.lat);
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;
    const category = req.query.category as string | undefined;
    const fetchNew = req.query.fetchNew === 'true';

    let pois: any[] = [];

    if (fetchNew) {
      // Fetch from Overpass API and save to PostgreSQL
      const categories = category ? [category] : ['tourism', 'amenity', 'leisure', 'natural'];
      const osmPois = await osmService.getPOIsNearLocation(lat, lon, radius, categories);
      await osmService.savePOIs(osmPois);
      pois = osmPois;
    } else {
      // Get from PostgreSQL
      pois = await osmService.getPOIsFromDB(lon, lat, radius, category);
    }

    const response: ApiResponse<any> = {
      success: true,
      data: pois,
      count: pois.length,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching POIs:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

/**
 * GET /api/pois/count/:lon/:lat
 * Count POIs near a location
 */
router.get('/count/:lon/:lat', async (req: Request, res: Response) => {
  try {
    const lon = parseFloat(req.params.lon);
    const lat = parseFloat(req.params.lat);
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 5000;
    const category = req.query.category as string | undefined;

    const count = await osmService.countPOIsNearLocation(lon, lat, radius, category);

    const response: ApiResponse<any> = {
      success: true,
      data: { count },
    };

    res.json(response);
  } catch (error) {
    console.error('Error counting POIs:', error);
    const response: ApiResponse<any> = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    res.status(500).json(response);
  }
});

export default router;
