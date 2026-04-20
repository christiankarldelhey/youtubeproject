export type Zoom = number
export type Center = [number, number]
export type Bbox = [number, number, number, number] | null

export type GoToLocationOptions = {
  coordinates: [number, number]
  bbox?: [number, number, number, number]
  zoom?: number
}

export type MapStoreState = {
  zoom: Zoom
  center: Center
  flyToTarget: { center: Center; zoom?: Zoom; bbox?: Bbox } | null
}
