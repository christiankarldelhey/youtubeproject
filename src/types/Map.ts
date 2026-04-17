export type zoom = number;
export type center = [number, number];
export type bbox = [number, number, number, number] | null;

export type GoToLocationOptions = {
  coordinates: [number, number];
  bbox?: [number, number, number, number];
  zoom?: number;
};

export type MapStoreState = { 
  zoom: zoom;
  center: center;
  flyToTarget: { center: center; zoom?: zoom, bbox?: bbox } | null;
};