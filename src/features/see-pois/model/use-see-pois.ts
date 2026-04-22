import { ref } from 'vue'
import axios from 'axios'
import { fetchPoisInBbox } from '@/entities/poi'
import type { OverpassBbox, PoiMarker } from '@/entities/poi'

const pois = ref<PoiMarker[]>([])
const loadingPois = ref(false)
const poisError = ref<string | null>(null)

export function useSeePois() {
  const fetchPoisByCurrentViewport = async (bbox: OverpassBbox, topic?: string): Promise<void> => {
    loadingPois.value = true
    poisError.value = null

    try {
      pois.value = await fetchPoisInBbox({ bbox, topic })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        poisError.value = err.message
      } else {
        poisError.value = 'An unexpected error occurred while fetching POIs.'
      }
      pois.value = []
    } finally {
      loadingPois.value = false
    }
  }

  const clearPois = () => {
    pois.value = []
  }

  return {
    pois,
    loadingPois,
    poisError,
    fetchPoisByCurrentViewport,
    clearPois,
  }
}
