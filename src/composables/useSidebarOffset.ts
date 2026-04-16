import { useMapStore } from '../store/mapStore';
import { useMobile } from './useMobile';
import L from 'leaflet';

/**
 * Composable para calcular el offset del sidebar y ajustar coordenadas del mapa
 */
export function useSidebarOffset() {
  const mapStore = useMapStore();
  const { isMobile } = useMobile();

  /**
   * Calcula el ancho del sidebar en píxeles
   */
  const getSidebarWidth = (): number => {
    if (isMobile.value || !mapStore.selectedOption.expanded) {
      return 0;
    }
    // Sidebar: 35rem ≈ 560px + 50px íconos = 610px
    return 35 * 16 + 50;
  };

  /**
   * Ajusta un punto lat/lng para compensar el sidebar
   * @param map - Instancia de Leaflet map
   * @param latLng - Coordenadas a ajustar
   * @returns Coordenadas ajustadas
   */
  const adjustCenterForSidebar = (map: L.Map, latLng: L.LatLng): L.LatLng => {
    const sidebarWidth = getSidebarWidth();
    
    if (sidebarWidth === 0) {
      return latLng;
    }

    // Convertir lat/lng a píxeles
    const centerPoint = map.latLngToContainerPoint(latLng);
    
    // Offset: mitad del sidebar hacia la izquierda (oeste)
    const offsetX = sidebarWidth / 2;
    
    // Mover el punto hacia la izquierda para compensar el sidebar
    const adjustedPoint = L.point(centerPoint.x - offsetX, centerPoint.y);
    
    // Convertir de vuelta a lat/lng
    return map.containerPointToLatLng(adjustedPoint);
  };

  /**
   * Ajusta coordenadas [lat, lng] para compensar el sidebar
   * @param map - Instancia de Leaflet map
   * @param center - Array [lat, lng]
   * @returns Array ajustado [lat, lng]
   */
  const adjustCoordinatesForSidebar = (map: L.Map, center: [number, number]): [number, number] => {
    const latLng = L.latLng(center[0], center[1]);
    const adjusted = adjustCenterForSidebar(map, latLng);
    return [adjusted.lat, adjusted.lng];
  };

  return {
    getSidebarWidth,
    adjustCenterForSidebar,
    adjustCoordinatesForSidebar,
  };
}
