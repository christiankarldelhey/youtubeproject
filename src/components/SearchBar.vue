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
import SearchSettingsDialog from './SearchSettingsDialog.vue';
import { useAuth } from '../composables/useAuth';
import { useSearchSettings } from '../composables/useSearchSettings';
import { Button } from '@/components/ui/button';

const { user } = useAuth();
const { iconMap } = useSearchSettings();

const mapStore = useMapStore();
const emit = defineEmits(['fetch-videos']);

const { autocompleteSearchLocation } = useSearchLocation();
const term = ref('');
const isPopoverOpen = ref(false);

const autocompleteResults = ref<GeoFeature[] | null>(null);

const handleAutocomplete = async () => {
  const results = await autocompleteSearchLocation(term.value);
  autocompleteResults.value = results || null;
  if (!results) return;
  isPopoverOpen.value = results.length > 0;
};

const closeAndGoToLocation = (coordinates: center, bbox?: bbox) => {
  term.value = '';
  autocompleteResults.value = null;
  isPopoverOpen.value = false;
  const [lng, lat] = coordinates;
  mapStore.triggerFlyTo([lat, lng], 12, bbox);
};

const settingsDialogOpen = ref(false);

const manageSettingsDialog = (value: boolean) => {
  settingsDialogOpen.value = value;
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
    class="fixed top-5 flex items-center z-9999"
    :class="user ? 'right-16' : 'right-48'"
    >
      <div class="relative w-full bg-white rounded shadow-lg">
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
            <MapPin class="h-4 w-4 text-muted-foreground" />
          </span>
        </div>
        <Button
            @click="manageSettingsDialog(true)"
            class="flex items-center gap-2 w-full p-2 ml-2 rounded-md transition-colors
                    cursor-pointer bg-white text-primary hover:bg-white" >
            <component :is="iconMap[mapStore.searchQuery.icon as keyof typeof iconMap]" />
        </Button>
        <PopoverContent 
          v-if="autocompleteResults && autocompleteResults.length > 0" 
          class="w-80 bg-white rounded shadow-lg z-9999"
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
  <SearchSettingsDialog 
    :open="settingsDialogOpen" 
    @close="manageSettingsDialog(false)" />
</template>
