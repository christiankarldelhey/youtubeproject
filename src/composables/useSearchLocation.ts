import { ref } from 'vue';
import axios from 'axios';

export interface GeoFeature {
  bbox?: [number, number, number, number];
  properties: {
    formatted: string;
    place_id: string;
    [key: string]: any;
  };
  geometry: {
    coordinates: [number, number];
  };
  type: string;
}

export function useSearchLocation() {
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const currentLocation = ref<[number, number] | null>(null);

  const autocompleteSearchLocation = async (term: string): Promise<GeoFeature[] | undefined> => {
    console.log('autocomplete location', term);
    loading.value = true;
    error.value = null;
    console.log('autocomplete location')
    const endpoint = 'https://api.geoapify.com/v1/geocode/autocomplete';
    const params = {
      text: term,
      apiKey: import.meta.env.VITE_GEOAPIFY_API_KEY
    };
    try {
      const { data } = await axios.get(endpoint, { params });
      return data.features;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error.value = err;
      } else {
        error.value = new Error('An unexpected error occurred.');
      }
      return undefined;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    currentLocation,
    autocompleteSearchLocation,
  };
}