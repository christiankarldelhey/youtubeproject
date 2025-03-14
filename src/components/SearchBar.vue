<script setup lang="ts">
import { ref, watch } from 'vue';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-vue-next';
import { useSearchLocation } from '../composables/useSearchLocation';
import type { GeoFeature } from '../composables/useSearchLocation';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const emit = defineEmits(['search-videos', 'goToLocation']);
const { autocompleteSearchLocation, currentLocation, loading } = useSearchLocation();

const term = ref('');
const isPopoverOpen = ref(false);

const autocompleteResults = ref<GeoFeature[] | null>(null);

const handleAutocomplete = async () => {
  const results = await autocompleteSearchLocation(term.value);
  autocompleteResults.value = results || null;
  isPopoverOpen.value = results && results.length > 0;
};

const closeAndGoToLocation = (coordinates: [number, number], bbox?: [number, number, number, number]) => {
  term.value = '';
  autocompleteResults.value = null;
  isPopoverOpen.value = false;
  emit('goToLocation', coordinates, bbox);
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
    class="fixed top-2 left-80 flex items-center bg-white rounded shadow-lg z-9999">
        <div class="relative w-full">
        <PopoverTrigger as-child>
          <Input 
            v-model="term"
            size="lg"
            autocomplete="off"
            id="search" 
            type="text" 
            placeholder="Search for a place" 
            class="w-80 pl-10"
            @keyup="handleAutocomplete"
          />
          </PopoverTrigger>
          <span class="absolute left-3 top-1/2 -translate-y-1/2">
            <Search class="h-4 w-4 text-muted-foreground" />
          </span>
        </div>
      <PopoverContent 
        v-if="autocompleteResults && autocompleteResults.length > 0" 
        class="w-80 bg-white rounded shadow-lg z-9999">
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
