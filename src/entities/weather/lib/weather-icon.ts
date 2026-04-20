import clearDayIcon from '@/assets/weather-icons/meteocons/clear-day.svg'
import fogIcon from '@/assets/weather-icons/meteocons/fog.svg'
import overcastIcon from '@/assets/weather-icons/meteocons/overcast.svg'
import partlyCloudyDayIcon from '@/assets/weather-icons/meteocons/partly-cloudy-day.svg'
import rainIcon from '@/assets/weather-icons/meteocons/rain.svg'
import snowIcon from '@/assets/weather-icons/meteocons/snow.svg'
import thunderstormIcon from '@/assets/weather-icons/meteocons/thunderstorm.svg'

export type WeatherIconKey =
  | 'clear-day'
  | 'partly-cloudy-day'
  | 'overcast'
  | 'fog'
  | 'rain'
  | 'snow'
  | 'thunderstorm'

const iconByKey: Record<WeatherIconKey, string> = {
  'clear-day': clearDayIcon,
  'partly-cloudy-day': partlyCloudyDayIcon,
  overcast: overcastIcon,
  fog: fogIcon,
  rain: rainIcon,
  snow: snowIcon,
  thunderstorm: thunderstormIcon,
}

function isCodeIn(code: number, values: number[]): boolean {
  return values.includes(code)
}

function normalizeCloudCover(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.trunc(value)))
}

function pickByCloudCover(cloudCover: number): WeatherIconKey {
  if (cloudCover <= 20) {
    return 'clear-day'
  }

  if (cloudCover <= 65) {
    return 'partly-cloudy-day'
  }

  return 'overcast'
}

function resolveKey(weatherCode: number, cloudCover: number): WeatherIconKey {
  const normalizedCloudCover = normalizeCloudCover(cloudCover)

  if (isCodeIn(weatherCode, [95, 96, 99])) {
    return 'thunderstorm'
  }

  if (isCodeIn(weatherCode, [71, 73, 75, 77, 85, 86])) {
    return 'snow'
  }

  if (isCodeIn(weatherCode, [45, 48])) {
    return 'fog'
  }

  if (isCodeIn(weatherCode, [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82])) {
    return 'rain'
  }

  if (isCodeIn(weatherCode, [0, 1, 2, 3])) {
    if (weatherCode === 3) {
      return 'overcast'
    }

    return pickByCloudCover(normalizedCloudCover)
  }

  return pickByCloudCover(normalizedCloudCover)
}

export function resolveWeatherIcon(weatherCode: number, cloudCover: number) {
  const key = resolveKey(weatherCode, cloudCover)

  return {
    key,
    iconUrl: iconByKey[key],
  }
}
