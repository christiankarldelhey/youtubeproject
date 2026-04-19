import axios from 'axios';
import { ref } from 'vue';
import type { AlertsResponse, WeatherAlert } from '../types/Alert';

const DEFAULT_BACKEND_URL = 'http://localhost:4000';

export function useAlerts() {
  const alerts = ref<WeatherAlert[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastFetchedAt = ref<string | null>(null);

  const fetchAlerts = async (limit = 100): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? DEFAULT_BACKEND_URL;
      const { data } = await axios.get<AlertsResponse>(`${backendUrl}/alerts`, {
        params: {
          limit,
          offset: 0,
        },
      });

      alerts.value = data.alerts;
      lastFetchedAt.value = new Date().toISOString();
    } catch (err) {
      alerts.value = [];
      if (axios.isAxiosError(err)) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch alerts';
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    alerts,
    loading,
    error,
    lastFetchedAt,
    fetchAlerts,
  };
}
