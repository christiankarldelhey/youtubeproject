import { pool } from '../pool.js'

export type ResearchAreaRecord = {
  id: string
  name: string
  bbox: number[]
  zoomLevel: number | null
  active: boolean
  videos: string[] | null
  pois: string[] | null
  travelType: string | null
  category: string | null
  createdAt: string
  updatedAt: string
}

export type CreateResearchAreaInput = {
  name: string
  bbox: number[]
  zoomLevel: number | null
  travelType: string | null
  category: string | null
}

export type UpdateResearchAreaInput = {
  name?: string
  active?: boolean
  videos?: string[] | null
  pois?: string[] | null
}

type ResearchAreaRow = {
  id: string
  name: string
  bbox: number[]
  zoom_level: number | null
  active: boolean
  videos: string[] | null
  pois: string[] | null
  travel_type: string | null
  category: string | null
  created_at: Date | string
  updated_at: Date | string
}

function toIso(value: Date | string | null): string | null {
  if (value === null) {
    return null
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return null
  }

  return new Date(parsed).toISOString()
}

function mapRow(row: ResearchAreaRow): ResearchAreaRecord {
  return {
    id: row.id,
    name: row.name,
    bbox: row.bbox,
    zoomLevel: row.zoom_level,
    active: row.active,
    videos: row.videos,
    pois: row.pois,
    travelType: row.travel_type,
    category: row.category,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString(),
  }
}

export async function createResearchArea(
  input: CreateResearchAreaInput,
): Promise<ResearchAreaRecord> {
  const result = await pool.query<ResearchAreaRow>(
    `
      INSERT INTO research_areas (
        name,
        bbox,
        zoom_level,
        travel_type,
        category
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [input.name, input.bbox, input.zoomLevel, input.travelType, input.category],
  )

  return mapRow(result.rows[0])
}

export async function listResearchAreas(): Promise<ResearchAreaRecord[]> {
  const result = await pool.query<ResearchAreaRow>(
    `
      SELECT *
      FROM research_areas
      ORDER BY created_at DESC
    `,
  )

  return result.rows.map(mapRow)
}

export async function getResearchAreaById(id: string): Promise<ResearchAreaRecord | null> {
  const result = await pool.query<ResearchAreaRow>(
    `
      SELECT *
      FROM research_areas
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  )

  if (result.rows.length === 0) {
    return null
  }

  return mapRow(result.rows[0])
}

export async function updateResearchArea(
  id: string,
  input: UpdateResearchAreaInput,
): Promise<ResearchAreaRecord | null> {
  const updates: string[] = []
  const values: any[] = []
  let paramIndex = 1

  if (input.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(input.name)
  }

  if (input.active !== undefined) {
    updates.push(`active = $${paramIndex++}`)
    values.push(input.active)
  }

  if (input.videos !== undefined) {
    updates.push(`videos = $${paramIndex++}`)
    values.push(input.videos)
  }

  if (input.pois !== undefined) {
    updates.push(`pois = $${paramIndex++}`)
    values.push(input.pois)
  }

  if (updates.length === 0) {
    return getResearchAreaById(id)
  }

  updates.push(`updated_at = NOW()`)
  values.push(id)

  const result = await pool.query<ResearchAreaRow>(
    `
      UPDATE research_areas
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `,
    values,
  )

  if (result.rows.length === 0) {
    return null
  }

  return mapRow(result.rows[0])
}

export async function deleteResearchArea(id: string): Promise<boolean> {
  const result = await pool.query(
    `
      DELETE FROM research_areas
      WHERE id = $1
    `,
    [id],
  )

  return (result.rowCount ?? 0) > 0
}
