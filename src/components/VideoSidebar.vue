<script setup lang="ts">
import { List, Star, XIcon } from "lucide-vue-next";
import { ref, computed } from "vue";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { VideoItem, VideoMarker, center, zoom } from "../types/Map";
import { Button } from '@/components/ui/button';
import { removeEmojis } from '@/utils/utils.ts';
import { useMapStore } from '../store/mapStore';

const emit = defineEmits(['handleSidebar']);

const mapStore = useMapStore();
const { state } = useSidebar();

const props = defineProps<{ videos: VideoMarker[] }>();

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
  mapStore.selectPin(video);
  mapStore.setDialogOpen(true);
};

const collapsedLocations = ref<Record<string, boolean>>({});
const selectedOption = ref('search');

const handleSidebar = (open: boolean, option: string) => {
  emit('handleSidebar', open);
  selectedOption.value = option;
};

</script>

<template>
    <Sidebar collapsible="icon">
      <SidebarContent class="flex flex-row bg-background text-white h-screen gap-0">
        <SidebarGroup class="min-w-[50px] w-[50px] bg-background">
          <SidebarGroupContent class="flex flex-col items-center">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="handleSidebar(true, 'search')"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-primary/30" 
                    :class="{ 'bg-primary/30': selectedOption === 'search' }">
                    <List />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="handleSidebar(true, 'favorites')"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-primary/30" 
                    :class="{ 'bg-primary/30': selectedOption === 'favorites' }">
                    <Star />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
  
        <!-- Scrollable Content Area -->
        <div v-if="state === 'expanded'" class="flex-1 h-screen overflow-y-auto bg-foreground">
        <div class="flex flex-row justify-end bg-foreground cursor-pointer">
            <XIcon @click="handleSidebar(false, 'closed')" class="h-6 w-6" />
        </div>
          <div v-if="selectedOption === 'search'">
            <div v-for="group in groupedVideoMarkers" :key="group.location">
              <div 
                class="cursor-pointer px-4 py-2 border-b text-primary flex justify-between items-center"
                @click="toggleCollapse(group.location)">
                <span>{{ group.location }} ({{ group.videos.length }})</span>
                <span>{{ collapsedLocations[group.location] ? '+' : '-' }}</span>
              </div>
              <div v-show="!collapsedLocations[group.location]" class="space-y-2">
                <div 
                  v-for="video in group.videos" 
                  :key="video.videoId"
                  class="cursor-pointer m-4 text-primary">
                    <p>{{ removeEmojis(video.title) }}</p>
                    <div class="flex flex-col" @click="openVideo(video)">
                      <div class="relative w-64 h-36 overflow-hidden rounded">
                        <img 
                          :src="video.thumbnail" 
                          alt="Video Thumbnail"
                          class="w-full h-full object-cover" />
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
  
          <!-- Favorites Content -->
          <div v-if="selectedOption === 'favorites'">
            <p>Favorites</p>
          </div>
  
        </div>
  
      </SidebarContent>
    </Sidebar>
  </template>
  

  