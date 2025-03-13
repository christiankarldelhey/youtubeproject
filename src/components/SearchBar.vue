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

const emit = defineEmits(['search-videos']);
const { autocompleteSearchLocation, currentLocation, loading } = useSearchLocation();

const term = ref('');
const autocompleteResults = ref<GeoFeature[] | null>(null);

const handleAutocomplete = async () => {
  const results = await autocompleteSearchLocation(term.value);
  autocompleteResults.value = results || null;
};

</script>

<template>
  <Popover>
    <div
    class="fixed top-2 left-80 flex items-center bg-white rounded shadow-lg" 
    style="z-index: 9999;">
      <PopoverTrigger as-child>
        <div class="relative w-full">
          <Input 
            v-model="term"
            size="lg"
            id="search" 
            type="text" 
            placeholder="Search for a place" 
            class="w-80 pl-10"
            @keyup="handleAutocomplete" 
          />
          <span class="absolute left-3 top-1/2 -translate-y-1/2">
            <Search class="h-4 w-4 text-muted-foreground" />
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent v-if="autocompleteResults" class="w-80">
        <div>
          <ul>
            <li 
              v-for="result in autocompleteResults"
              class="p-2 hover:bg-gray-100 cursor-pointer rounded">
              {{ result.properties.name }}
            </li>
          </ul>
        </div>
      </PopoverContent>
    </div>
  </Popover>
</template>
