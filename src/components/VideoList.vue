<script setup lang="ts">
import { ref, computed } from 'vue';
import { useMapStore } from '../store/mapStore';
import { removeEmojisAndUppercaseWords } from '@/utils/utils.ts';
import type { VideoMarker } from '../types/Map';
import { useMobile } from '../composables/useMobile';
import { useAuth } from '../composables/useAuth';
import { ChevronUpIcon, ChevronDownIcon, MapPin } from 'lucide-vue-next';

const props = defineProps<{ videos: VideoMarker[] }>();
const { user } = useAuth();

const { isMobile } = useMobile();
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
  !isMobile.value ? mapStore.setDialogOpen(true) : 
  mapStore.setMobileVideoDetail(true);
  mapStore.selectPin(video);
};

// const goToLocation = (video: VideoMarker) => {
//   setTimeout(() => {
//     mapStore.triggerFlyTo(video.position, 12);
//   }, 2000);
// };

</script>

<template>
    <div class="p-2 text-primary" v-if="videos.length === 0">
      <p v-if="mapStore.selectedOption.value === 'search'" class="text-sm">No videos found. Please explore a new location and click on the search videos button.</p> 
      <p v-if="mapStore.selectedOption.value === 'favorites' && user" class="text-sm">You dont have any favorited video yet.</p>
      <p v-if="mapStore.selectedOption.value === 'favorites' && !user" class="text-sm">You cannot favorite videos if you are not logged in.</p>
    </div>
    <div v-else v-for="group in groupedVideoMarkers" :key="group.location">
        <div 
        class="cursor-pointer px-4 py-2 border-b text-primary flex justify-between items-center"
        @click="toggleCollapse(group.location)">
        <div class="flex items-center gap-2">
            <MapPin class="h-4 w-4 text-gray-500" />
            <span class="text-sm text-gray-600"> {{ group.location.toUpperCase() }} ({{ group.videos.length }}) </span>
        </div>        
        <div class="flex items-center gap-4">
            <ChevronDownIcon v-if="collapsedLocations[group.location]" class="h-4 w-4 text-gray-500" />
            <ChevronUpIcon v-else class="h-4 w-4 text-gray-500" />
        </div>
        </div>
        <div v-show="!collapsedLocations[group.location]">
        <div 
            v-for="video in group.videos"
            @click="openVideo(video)"
            :key="video.videoId"
            class="cursor-pointer p-4 border-b text-primary hover:bg-secondary">
            <h4 class="pb-2 font-semibold">{{ removeEmojisAndUppercaseWords(video.title) }}</h4>
            <div 
            class="flex justify-between"
            :class="isMobile ? 'flex-col w-full' : 'flex-row'"
            >
              <div class="flex flex-col flex-shrink-0">
                <div 
                class="relative overflow-hidden rounded"
                :class="isMobile ? 'w-full h-9/10' : 'w-48 h-28'"
                style="aspect-ratio: 16 / 9;"
                >
                  <img 
                      :src="video.thumbnail" 
                      alt="Video Thumbnail"
                      class="left-0 w-full h-full object-cover" />
                </div>
              </div>
              <div 
              class="flex flex-col"
              :class="isMobile ? 'w-full' : 'px-4 flex-grow max-w-[60%]'"
              >
                <p 
                  class="text-sm leading-tight overflow-hidden cursor-pointer" 
                  :class="isMobile ? 'line-clamp-3 pt-2' : 'line-clamp-6'"
                  :title="video.description"
                >
                  {{ video.description }}
                </p>
              </div>
            </div>
        </div>
        </div>
    </div>
</template>