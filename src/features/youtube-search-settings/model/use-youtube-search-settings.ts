import { ref } from 'vue'
import { Hotel, Landmark, Plane, Trees, Utensils, Wallet } from 'lucide-vue-next'
import type { SearchOption } from '@/entities/youtube-video'

const searchOptions: SearchOption[] = [
  { value: 'travel', icon: 'plane' },
  { value: 'food', icon: 'utensils' },
  { value: 'hotel', icon: 'hotel' },
  { value: 'hiking', icon: 'trees' },
  { value: 'budget', icon: 'wallet' },
  { value: 'history', icon: 'landmark' },
]

const searchQuery = ref<SearchOption>(searchOptions[0])

const iconMap = {
  plane: Plane,
  utensils: Utensils,
  hotel: Hotel,
  trees: Trees,
  wallet: Wallet,
  landmark: Landmark,
}

export function useYoutubeSearchSettings() {
  const setSearchQuery = (option: SearchOption) => {
    searchQuery.value = option
  }

  const setSearchQueryByValue = (value: string) => {
    const selected = searchOptions.find((option) => option.value === value)
    if (selected) {
      searchQuery.value = selected
    }
  }

  return {
    searchOptions,
    searchQuery,
    iconMap,
    setSearchQuery,
    setSearchQueryByValue,
  }
}
