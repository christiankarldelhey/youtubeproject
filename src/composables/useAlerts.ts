import axios from 'axios';
import mqtt, { type MqttClient } from 'mqtt';
import { ref } from 'vue';
import type { CityWeatherCurrent, WeatherCurrentResponse } from '../types/Alert';

const DEFAULT_BACKEND_URL = 'http://localhost:4000';
const DEFAULT_MQTT_WS_URL = 'ws://localhost:9001';

type MqttConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

function upsertWeather(records: CityWeatherCurrent[], incoming: CityWeatherCurrent): CityWeatherCurrent[] {
  const next = records.filter((item) => item.cityKey !== incoming.cityKey);
  next.push(incoming);
  next.sort((a, b) => a.cityName.localeCompare(b.cityName));
  return next;
}

export function useAlerts() {
  const weather = ref<CityWeatherCurrent[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<string | null>(null);
  const mqttStatus = ref<MqttConnectionStatus>('disconnected');
  let mqttClient: MqttClient | null = null;

  const fetchCurrentWeather = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL;
      const { data } = await axios.get<WeatherCurrentResponse>(`${backendUrl}/weather/current`);

      weather.value = data.weather;
      lastFetchedAt.value = new Date().toISOString();
    } catch (err) {
      weather.value = [];
      if (axios.isAxiosError(err)) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch current weather';
      }
    } finally {
      loading.value = false;
    }
  };

  const connectRealtime = (): void => {
    if (mqttClient) {
      return;
    }

    const mqttUrl = import.meta.env.VITE_MQTT_WS_URL ?? DEFAULT_MQTT_WS_URL;
    const topicPrefix = import.meta.env.VITE_MQTT_TOPIC_PREFIX ?? 'weather';
    const topic = `${topicPrefix}/+/current`;

    mqttStatus.value = 'connecting';

    mqttClient = mqtt.connect(mqttUrl, {
      reconnectPeriod: 1000,
      connectTimeout: 10000,
      username: import.meta.env.VITE_MQTT_USERNAME || undefined,
      password: import.meta.env.VITE_MQTT_PASSWORD || undefined,
    });

    mqttClient.on('connect', () => {
      mqttStatus.value = 'connected';

      mqttClient?.subscribe(topic, { qos: 1 }, (subscribeError?: Error | null) => {
        if (subscribeError) {
          mqttStatus.value = 'error';
          error.value = `MQTT subscribe error: ${subscribeError.message}`;
        }
      });
    });

    mqttClient.on('reconnect', () => {
      mqttStatus.value = 'connecting';
    });

    mqttClient.on('close', () => {
      mqttStatus.value = 'disconnected';
    });

    mqttClient.on('error', (mqttError: Error) => {
      mqttStatus.value = 'error';
      error.value = `MQTT connection error: ${mqttError.message}`;
    });

    mqttClient.on('message', (_topic: string, payload: Uint8Array) => {
      try {
        const incoming = JSON.parse(payload.toString()) as CityWeatherCurrent;
        weather.value = upsertWeather(weather.value, incoming);
        lastFetchedAt.value = new Date().toISOString();
      } catch {
        error.value = 'Failed to parse MQTT weather message';
      }
    });
  };

  const disconnectRealtime = (): void => {
    if (!mqttClient) {
      return;
    }

    mqttClient.end();
    mqttClient = null;
    mqttStatus.value = 'disconnected';
  };

  return {
    weather,
    loading,
    error,
    lastFetchedAt,
    mqttStatus,
    fetchCurrentWeather,
    connectRealtime,
    disconnectRealtime,
  };
}
