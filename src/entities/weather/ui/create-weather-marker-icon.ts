import L from 'leaflet'
import type { CityWeatherCurrent } from '@/entities/weather/model/weather.types'
import { resolveWeatherIcon } from '@/entities/weather/lib/weather-icon'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export function createWeatherMarkerIcon(city: CityWeatherCurrent): L.Icon<L.IconOptions> {
  const { iconUrl, key } = resolveWeatherIcon(city.weatherCode, city.cloudCover)
  const temperatureLabel = `${city.temperatureC.toFixed(1)}°C`
  const cityName = escapeHtml(city.cityName)

  return L.divIcon({
    className: 'weather-marker-wrapper',
    html: `
      <div class="weather-marker" title="${cityName}">
        <img class="weather-marker__icon" src="${iconUrl}" alt="${key}" />
        <span class="weather-marker__temp">${temperatureLabel}</span>
      </div>
    `,
    iconSize: [56, 72],
    iconAnchor: [28, 66],
  }) as unknown as L.Icon<L.IconOptions>
}
