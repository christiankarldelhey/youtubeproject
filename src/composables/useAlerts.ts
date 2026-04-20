import { useWeatherRealtime } from '@/features/weather-realtime'

export function useAlerts() {
  const realtime = useWeatherRealtime()

  return {
    weather: realtime.weather,
    loading: realtime.loading,
    error: realtime.error,
    lastFetchedAt: realtime.lastFetchedAt,
    mqttStatus: realtime.mqttStatus,
    fetchCurrentWeather: realtime.fetchCurrentWeather,
    connectRealtime: realtime.connectRealtime,
    disconnectRealtime: realtime.disconnectRealtime,
  }
}
