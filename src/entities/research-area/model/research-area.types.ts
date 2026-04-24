export type TravelType = 'city' | 'rural' | null

export interface ResearchArea {
  id: string
  name: string
  bbox: [number, number, number, number]
  zoomLevel: number
  active: boolean
  videos: string[]
  pois: string[]
  travelType: TravelType
  category: string
  createdAt: string
  updatedAt: string
}

export interface CreateResearchAreaInput {
  name: string
  bbox: [number, number, number, number]
  zoomLevel: number
  travelType: TravelType
  category: string
}

export interface UpdateResearchAreaInput {
  name?: string
  active?: boolean
  videos?: string[]
  pois?: string[]
}
