export const calculateRadiusFromZoom = (zoomLevel: number): string => {
  const reductionFactor = 0.7
  const radiusKm = (40075 / Math.pow(2, zoomLevel)) * reductionFactor
  const limitedRadius = Math.min(Math.ceil(radiusKm), 1000)
  return `${limitedRadius}km`
}
