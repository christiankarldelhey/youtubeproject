<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { List, HeartIcon } from "lucide-vue-next";
import { useMapStore } from '../store/mapStore';

const mapStore = useMapStore();

</script>

<template>
    <div class="fixed top-5 left-3 z-9999">
        <div class="flex flex-col gap-2">
            <Button
            @click="mapStore.setSelectedOption('search')"
            :class="{ 'bg-primary/30': mapStore.selectedOption === 'search' }"
            class="flex items-center gap-2 w-full p-2 mr-2 rounded-md transition-colors
                        cursor-pointer bg-white text-primary hover:bg-white h-9 w-9" >
                <List />
            </Button>
            <Button
            @click="mapStore.setSelectedOption('favorites')"
            :class="{ 'bg-primary/30': mapStore.selectedOption === 'favorites' }"
            class="flex items-center gap-2 w-full p-2 mr-2 rounded-md transition-colors
                        cursor-pointer bg-white text-primary hover:bg-white h-9 w-9" >
                <HeartIcon />
            </Button>
      </div>
    </div>
  </template>