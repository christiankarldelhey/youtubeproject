import { defineStore } from 'pinia'
import type { CityWeatherCurrent } from '@/entities/weather'
import { fetchCurrentWeather } from '@/entities/weather'
import { createRealtimeClient, type RealtimeStatus } from '@/shared/api/realtime-client'

function upsertWeather(records: CityWeatherCurrent[], incoming: CityWeatherCurrent): CityWeatherCurrent[] {
  const next = records.filter((item) => item.cityKey !== incoming.cityKey)
  next.push(incoming)
  next.sort((a, b) => a.cityName.localeCompare(b.cityName))
  return next
}

export const useWeatherRealtimeStore = defineStore('weather-realtime', {
  state: () => ({
    weather: [] as CityWeatherCurrent[],
    loading: false,
    error: null as string | null,
    lastFetchedAt: null as string | null,
    mqttStatus: 'disconnected' as RealtimeStatus,
  }),
  actions: {
    async fetchCurrentWeather() {
      this.loading = true
      this.error = null

      try {
        const data = await fetchCurrentWeather()
        this.weather = data.weather
        this.lastFetchedAt = new Date().toISOString()
      } catch (err) {
        this.weather = []
        this.error = err instanceof Error ? err.message : 'Failed to fetch current weather'
      } finally {
        this.loading = false
      }
    },

    connectRealtime() {
      if ((window as { __weatherRealtimeClient?: unknown }).__weatherRealtimeClient) {
        return
      }

      const topicPrefix = import.meta.env.VITE_MQTT_TOPIC_PREFIX ?? 'weather'
      const topic = `${topicPrefix}/+/current`

      this.mqttStatus = 'connecting'

      const client = createRealtimeClient({
        onConnect: () => {
          this.mqttStatus = 'connected'
          client.subscribe(topic, (subscribeError?: Error | null) => {
            if (subscribeError) {
              this.mqttStatus = 'error'
              this.error = `MQTT subscribe error: ${subscribeError.message}`
            }
          })
        },
        onReconnect: () => {
          this.mqttStatus = 'connecting'
        },
        onClose: () => {
          this.mqttStatus = 'disconnected'
        },
        onError: (mqttError) => {
          this.mqttStatus = 'error'
          this.error = `MQTT connection error: ${mqttError.message}`
        },
        onMessage: (_topic, payload) => {
          try {
            const incoming = JSON.parse(payload.toString()) as CityWeatherCurrent
            this.weather = upsertWeather(this.weather, incoming)
            this.lastFetchedAt = new Date().toISOString()
          } catch {
            this.error = 'Failed to parse MQTT weather message'
          }
        },
      })

      client.connect()
      ;(window as { __weatherRealtimeClient?: ReturnType<typeof createRealtimeClient> }).__weatherRealtimeClient = client
    },

    disconnectRealtime() {
      const globalWindow = window as { __weatherRealtimeClient?: ReturnType<typeof createRealtimeClient> }
      if (!globalWindow.__weatherRealtimeClient) {
        return
      }

      globalWindow.__weatherRealtimeClient.disconnect()
      globalWindow.__weatherRealtimeClient = undefined
      this.mqttStatus = 'disconnected'
    },
  },
})
