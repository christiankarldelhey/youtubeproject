import { storeToRefs } from 'pinia'
import { useWeatherRealtimeStore } from './weather-realtime.store'

export function useWeatherRealtime() {
  const store = useWeatherRealtimeStore()
  const { weather, loading, error, lastFetchedAt, mqttStatus } = storeToRefs(store)

  return {
    weather,
    loading,
    error,
    lastFetchedAt,
    mqttStatus,
    fetchCurrentWeather: store.fetchCurrentWeather,
    connectRealtime: store.connectRealtime,
    disconnectRealtime: store.disconnectRealtime,
  }
}
