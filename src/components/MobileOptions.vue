<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { List, HeartIcon } from "lucide-vue-next";
import { useMapStore } from '../store/mapStore';

const mapStore = useMapStore();

</script>

<template>
        <div class="flex flex-row justify-center gap-2">
            <Button
            @click="mapStore.setSelectedOption('search', true)"
            :class="{ 'active': mapStore.selectedOption.value === 'search' }"
            class="flex items-center gap-2 w-full p-5 mr-2 rounded-md transition-colors
                        cursor-pointer bg-white text-primary hover:bg-white h-9" >
                <List />
            </Button>
            <Button
            @click="mapStore.setSelectedOption('favorites', true)"
            :class="{ 'active': mapStore.selectedOption.value === 'favorites' }"
            class="flex items-center gap-2 w-full py-2 px-5 mr-2 rounded-md transition-colors
                        cursor-pointer bg-white text-primary hover:bg-white h-9" >
                <HeartIcon />
            </Button>
      </div>
  </template>

  <style scoped>
    .active {
      background-color: #6639de;
      color: white;
    }
  </style>