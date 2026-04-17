import pool from '../config/database';

/**
 * OSM Service - Placeholder for future OpenStreetMap integration
 * 
 * TODO: Implementar integración con Overpass API para obtener POIs
 * - Restaurantes, hoteles, museos, playas, etc.
 * - Calcular métricas videos/POIs
 * - Clasificación de destinos
 */

interface OSMPoi {
  osmId: number;
  osmType: string;
  name?: string;
  category: string;
  subcategory?: string;
  tags: Record<string, any>;
  latitude: number;
  longitude: number;
}

export class OSMService {
  /**
   * Get POIs from OpenStreetMap - PLACEHOLDER
   * TODO: Implementar llamada a Overpass API
   */
  async getPOIsNearLocation(
    latitude: number,
    longitude: number,
    radiusMeters: number,
    categories: string[] = ['tourism', 'amenity', 'leisure', 'natural']
  ): Promise<OSMPoi[]> {
    console.log('OSMService.getPOIsNearLocation - Not implemented yet');
    return [];
  }

  /**
   * Save POIs to PostgreSQL - PLACEHOLDER
   */
  async savePOIs(pois: OSMPoi[]): Promise<number> {
    console.log('OSMService.savePOIs - Not implemented yet');
    return 0;
  }

  /**
   * Get POIs from PostgreSQL near a location
   */
  async getPOIsFromDB(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    category?: string
  ): Promise<any[]> {
    let query = `
      SELECT 
        id,
        osm_id,
        osm_type,
        name,
        category,
        subcategory,
        tags,
        ST_X(geom) as longitude,
        ST_Y(geom) as latitude,
        ST_Distance(
          geom::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance_km
      FROM osm_pois
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const params: any[] = [longitude, latitude, radiusMeters];

    if (category) {
      query += ` AND category = $4`;
      params.push(category);
    }

    query += ` ORDER BY distance_km LIMIT 100`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Count POIs near a location
   */
  async countPOIsNearLocation(
    longitude: number,
    latitude: number,
    radiusMeters: number,
    category?: string
  ): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM osm_pois
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
    `;

    const params: any[] = [longitude, latitude, radiusMeters];

    if (category) {
      query += ` AND category = $4`;
      params.push(category);
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

export const osmService = new OSMService();
