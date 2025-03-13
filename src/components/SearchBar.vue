<script setup lang="ts">
import { ref } from 'vue';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-vue-next';
import { useSearchLocation } from '../composables/useSearchLocation';

const emit = defineEmits(['search-videos']);
const { searchLocation, currentLocation, loading } = useSearchLocation();

const term = ref('');

const handleSearch = async () => {
  if (!term.value) return;
  await searchLocation(term.value);
  if (currentLocation.value) {
    emit('search-videos', currentLocation.value);
  }
};
</script>

<template>
  <div class="fixed top-2 left-80 flex items-center bg-white p-2 rounded shadow-lg" style="z-index: 9999;">
    <div class="relative w-full">
      <Input 
        v-model="term"
        id="search" 
        type="text" 
        placeholder="Search for a place" 
        class="w-80 pl-10"
        @keyup.enter="handleSearch" 
      />
      <span class="absolute left-3 top-1/2 -translate-y-1/2">
        <Search class="h-4 w-4 text-muted-foreground" />
      </span>
    </div>
    <Button 
      @click="handleSearch"
      :disabled="loading || !term"
    >
      Search
    </Button>
  </div>
</template>
