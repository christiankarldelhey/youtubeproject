<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/shared/ui/shadcn/input'
import { Button } from '@/shared/ui/shadcn/button'
import { MapPin } from 'lucide-vue-next'
import { useSearchLocation } from '@/features/search-location'
import type { GeoFeature } from '@/features/search-location'
import { SearchSettingsDialog, useYoutubeSearchSettings } from '@/features/youtube-search-settings'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/shadcn/popover'
import type { Center, Bbox } from '@/entities/map'
import { useMapStore } from '@/entities/map'
import { useMobile } from '@/shared/composables/use-mobile'

const { isMobile } = useMobile()
const mapStore = useMapStore()
const { searchQuery, iconMap } = useYoutubeSearchSettings()

const { autocompleteSearchLocation } = useSearchLocation()
const term = ref('')
const isPopoverOpen = ref(false)
const settingsDialogOpen = ref(false)

const autocompleteResults = ref<GeoFeature[] | null>(null)

const handleAutocomplete = async () => {
  const results = await autocompleteSearchLocation(term.value)
  autocompleteResults.value = results || null
  if (!results) return
  isPopoverOpen.value = results.length > 0
}

const closeAndGoToLocation = (coordinates: Center, bbox?: Bbox) => {
  term.value = ''
  autocompleteResults.value = null
  isPopoverOpen.value = false
  const [lng, lat] = coordinates
  mapStore.triggerFlyTo([lat, lng], 12, bbox)
}

watch(term, (newVal) => {
  if (!newVal) {
    isPopoverOpen.value = false
  }
})
</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <div
      class="fixed top-5 z-9999 flex items-center"
      :class="isMobile ? 'left-2' : 'right-16'"
    >
      <Button
        class="mr-2 flex h-9 w-9 cursor-pointer items-center gap-2 rounded-md bg-white p-2 text-primary transition-colors hover:bg-white"
        @click="settingsDialogOpen = true"
      >
        <component :is="iconMap[searchQuery.icon as keyof typeof iconMap]" />
      </Button>

      <div class="relative rounded-md bg-white">
        <PopoverTrigger as-child>
          <Input
            v-model="term"
            autocomplete="off"
            id="search"
            type="text"
            :placeholder="$t('search_placeholder')"
            @keyup="handleAutocomplete"
            class="pl-10"
            :class="isMobile ? 'w-50' : 'w-80'"
          />
        </PopoverTrigger>
        <span class="absolute left-3 top-1/2 -translate-y-1/2">
          <MapPin class="h-4 w-4 text-muted-foreground" />
        </span>
      </div>
      <PopoverContent
        v-if="autocompleteResults && autocompleteResults.length > 0"
        class="z-9999 rounded bg-white shadow-lg"
        :class="isMobile ? 'w-60' : 'w-80'"
        side="bottom"
        align="start"
      >
        <div>
          <ul>
            <li
              v-for="result in autocompleteResults"
              :key="result.properties.place_id"
              @click="closeAndGoToLocation(result.geometry.coordinates, result.bbox)"
              class="cursor-pointer rounded p-2 hover:bg-gray-100"
            >
              {{ result.properties.address_line1 }},
              {{ result.properties.city ? result.properties.city + ', ' : '' }}
              {{ result.properties.country ?? '' }}
            </li>
          </ul>
        </div>
      </PopoverContent>
    </div>
  </Popover>

  <SearchSettingsDialog :open="settingsDialogOpen" @close="settingsDialogOpen = false" />
</template>
