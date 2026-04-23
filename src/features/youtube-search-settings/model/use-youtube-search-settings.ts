import { ref } from 'vue'
import { Hotel, Landmark, Plane, Trees, Utensils, Wallet } from 'lucide-vue-next'
import type { SearchOption } from '@/entities/youtube-video'

const searchOptions: SearchOption[] = [
  {
    value: '"travel vlog"|"travel guide"|trip|viaje|"city guide" -shorts -music -reaction -podcast',
    name: 'Travel',
    icon: 'plane'
  },
  {
    value: '"food tour"|"where to eat"|"street food"|"local food"|gastronomia|comida -shorts -music -recipe -cooking',
    name: 'Gastronomy',
    icon: 'utensils'
  },
  {
    value: 'hotel|hostel|"where to stay"|"best area to stay"|alojamiento -"hotel california" -music -podcast',
    name: 'Accomodation',
    icon: 'hotel'
  },
  {
    value: 'hiking|trekking|senderismo|"day hike"|"nature walk"|outdoor -music -game -workout',
    name: 'Hiking',
    icon: 'trees'
  },
  {
    value: '"budget travel"|backpacking|"cheap travel"|"travel on a budget"|mochilero|lowcost -music -podcast -finance',
    name: 'Travel on a budget',
    icon: 'wallet'
  },
  {
    value: '"history of"|"historic center"|"old town"|historia|historico|heritage|"cultural guide" -music -movie -documentary',
    name: 'History',
    icon: 'landmark'
  },
];

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
