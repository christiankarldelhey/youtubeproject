<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMapStore } from '../store/mapStore';
import { removeEmojisAndUppercaseWords } from '@/utils/utils.ts';
import type { VideoMarker } from '../types/Map';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChevronUpIcon, ChevronDownIcon, MapPin } from 'lucide-vue-next';

const props = defineProps<{ videos: VideoMarker[] }>();

const mapStore = useMapStore();
const collapsedLocations = ref<Record<string, boolean>>({});

const groupedVideoMarkers = computed(() => {
  const locationMap: Record<string, VideoMarker[]> = {};
  props.videos.forEach(video => {
    const location = video.location || 'Unknown';
    if (!locationMap[location]) {
      locationMap[location] = [];
    }
    locationMap[location].push(video);
  });

  return Object.entries(locationMap)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([location, videos]) => ({ location, videos }));
});

const toggleCollapse = (location: string) => {
  collapsedLocations.value[location] = !collapsedLocations.value[location];
};

const openVideo = (video: VideoMarker) => {
  mapStore.setDialogOpen(true);
  mapStore.selectPin(video);
};

const goToLocation = (video: VideoMarker) => {
  mapStore.triggerFlyTo(video.position, 12);
};

</script>

<template>
    <div class="p-4 text-primary" v-if="videos.length === 0">
        No videos found. Please explore a location and click on the search videos button. 
    </div>
    <div v-else v-for="group in groupedVideoMarkers" :key="group.location">
        <div 
        class="cursor-pointer px-4 py-2 border-b text-primary flex justify-between items-center"
        @click="toggleCollapse(group.location)">
        <div class="flex items-center gap-2">
            <MapPin class="h-4 w-4 text-gray-500" />
            <span class="text-sm text-gray-600"> {{ group.location.toUpperCase() }} </span>
        </div>        
        <div class="flex items-center gap-4">
            <Avatar class="bg-foreground text-primary h-6 w-6">
                <AvatarFallback>{{group.videos.length}}</AvatarFallback>
            </Avatar>
            <ChevronDownIcon v-if="collapsedLocations[group.location]" />
            <ChevronUpIcon v-else />
        </div>
        </div>
        <div v-show="!collapsedLocations[group.location]" class="space-y-2">
        <div 
            v-for="video in group.videos" 
            :key="video.videoId"
            class="cursor-pointer p-4 text-primary hover:bg-foreground">
            <h4 class="pb-2 font-semibold">{{ removeEmojisAndUppercaseWords(video.title) }}</h4>
            <div class="flex flex-row justify-between">
              <div class="flex flex-col flex-shrink-0" @click="openVideo(video)">
                <div class="relative w-48 h-28 overflow-hidden rounded">
                  <img 
                      :src="video.thumbnail" 
                      alt="Video Thumbnail"
                      class="w-full h-full object-cover" />
                </div>
              </div>
              <div class="flex flex-col px-4 culo flex-grow max-w-[60%]">
                <p class="text-sm line-clamp-6 overflow-hidden">{{ video.description }}</p>
              </div>
            </div>
        </div>
        </div>
    </div>
</template>