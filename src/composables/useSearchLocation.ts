import { ref } from 'vue';
import axios from 'axios';

export interface GeoFeature {
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

  const searchLocation = async (term: string): Promise<void> => {
    loading.value = true;
    error.value = null;
    console.log('go to location');
    const endpoint = 'https://api.geoapify.com/v1/geocode/search';

    //https://api.geoapify.com/v1/geocode/search?text=38%20Upper%20Montagu%20Street%2C%20Westminster%20W1H%201LJ%2C%20United%20Kingdom&apiKey=ef183bad23254db38d2cd383eb89925b
  };

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
    //https://api.geoapify.com/v1/geocode/autocomplete?text=Mosco&apiKey=ef183bad23254db38d2cd383eb89925b
  };

  return {
    loading,
    error,
    currentLocation,
    autocompleteSearchLocation,
    searchLocation
  };
}