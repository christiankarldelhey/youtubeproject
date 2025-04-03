<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-vue-next';
import { useSearchLocation } from '../composables/useSearchLocation';
import type { GeoFeature } from '../composables/useSearchLocation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { center, bbox } from '../types/Map';
import { useMapStore } from '../store/mapStore';

const mapStore = useMapStore();
const emit = defineEmits(['fetch-videos']);

const { autocompleteSearchLocation, currentLocation, loading } = useSearchLocation();
const term = ref('');
const isPopoverOpen = ref(false);

const autocompleteResults = ref<GeoFeature[] | null>(null);

const handleAutocomplete = async () => {
  const results = await autocompleteSearchLocation(term.value);
  autocompleteResults.value = results || null;
  isPopoverOpen.value = results && results.length > 0;
};

const closeAndGoToLocation = (coordinates: center, bbox?: bbox) => {
  term.value = '';
  autocompleteResults.value = null;
  isPopoverOpen.value = false;
  const [lng, lat] = coordinates;
  mapStore.triggerFlyTo([lat, lng], 12, bbox);
};

watch(term, (newVal) => {
  if (!newVal) {
    isPopoverOpen.value = false;
  }
});

</script>

<template>
  <Popover v-model:open="isPopoverOpen">
    <div
    class="fixed top-5 right-20 flex items-center bg-white rounded shadow-lg z-9998">
        <div class="relative w-full">
        <PopoverTrigger as-child>
          <Input 
            v-model="term"
            size="lg"
            autocomplete="off"
            id="search" 
            type="text" 
            placeholder="Search for a place" 
            class="w-96 pl-10"
            @keyup="handleAutocomplete"
          />
          </PopoverTrigger>
          <span class="absolute left-3 top-1/2 -translate-y-1/2">
            <MapPin class="h-4 w-4 text-muted-foreground" />
          </span>
        </div>
        <PopoverContent 
          v-if="autocompleteResults && autocompleteResults.length > 0" 
          class="w-96 bg-white rounded shadow-lg z-9998"
          side="bottom" 
          align="start"
        >
        <div>
          <ul>
            <li 
              @click="closeAndGoToLocation(result.geometry.coordinates, result.bbox)"
              v-for="result in autocompleteResults"
              class="p-2 hover:bg-gray-100 cursor-pointer rounded">
              {{ result.properties.address_line1 }}, 
              {{ result.properties.city ? result.properties.city + ', ' : '' }}
              {{ result.properties.country ?? '' }}
            </li>
          </ul>
        </div>
      </PopoverContent>
    </div>
  </Popover>
</template>
