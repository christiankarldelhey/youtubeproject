import mqtt, { type MqttClient } from 'mqtt'

const DEFAULT_MQTT_WS_URL = 'ws://localhost:9001'

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

type RealtimeHandlers = {
  onConnect?: () => void
  onReconnect?: () => void
  onClose?: () => void
  onError?: (error: Error) => void
  onMessage?: (topic: string, payload: Uint8Array) => void
}

export function createRealtimeClient(handlers: RealtimeHandlers = {}) {
  let client: MqttClient | null = null

  const connect = () => {
    if (client) {
      return client
    }

    const mqttUrl = import.meta.env.VITE_MQTT_WS_URL ?? DEFAULT_MQTT_WS_URL

    client = mqtt.connect(mqttUrl, {
      reconnectPeriod: 1000,
      connectTimeout: 10000,
      username: import.meta.env.VITE_MQTT_USERNAME || undefined,
      password: import.meta.env.VITE_MQTT_PASSWORD || undefined,
    })

    if (handlers.onConnect) client.on('connect', handlers.onConnect)
    if (handlers.onReconnect) client.on('reconnect', handlers.onReconnect)
    if (handlers.onClose) client.on('close', handlers.onClose)
    if (handlers.onError) client.on('error', handlers.onError)
    if (handlers.onMessage) client.on('message', handlers.onMessage)

    return client
  }

  const subscribe = (topic: string, callback?: (error?: Error | null) => void) => {
    client?.subscribe(topic, { qos: 1 }, callback)
  }

  const disconnect = () => {
    client?.end()
    client = null
  }

  return {
    connect,
    subscribe,
    disconnect,
  }
}
