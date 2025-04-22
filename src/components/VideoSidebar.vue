<script setup lang="ts">
import { List, HeartIcon, XIcon } from "lucide-vue-next";
import { watch } from "vue";
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
import { Button } from '@/components/ui/button';
import VideoList from './VideoList.vue';
import { useMapStore } from '../store/mapStore';
import { useMobile } from '../composables/useMobile';
import type { VideoMarker } from "../types/Map";

const mapStore = useMapStore();
const { isMobile } = useMobile();
const props = defineProps<{ videos: VideoMarker[]; favorites: VideoMarker[] }>();
const { state } = useSidebar();

watch(() => props.videos, (newVideos) => {
  if (newVideos.length > 0) {
    mapStore.setSelectedOption('search', true);
  }
}, { deep: true });

</script>

<template>
  <div v-if="!isMobile" class="hidden md:block">
    <Sidebar collapsible="icon">
      <SidebarContent class="flex flex-row bg-background text-white h-screen gap-0">
        <SidebarGroup class="min-w-[50px] w-[50px] bg-background border-r">
          <SidebarGroupContent class="flex flex-col items-center">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="mapStore.setSelectedOption('search', true)"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-accent" 
                    :class="{ 'bg-accent text-white': mapStore.selectedOption.value === 'search' }">
                    <List />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="mapStore.setSelectedOption('favorites', true)"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-accent" 
                    :class="{ 'bg-accent text-white': mapStore.selectedOption.value === 'favorites' }">
                    <HeartIcon />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div 
          v-if="state === 'expanded'" 
          class="flex-1 h-screen overflow-y-auto bg-background">
          <div class="flex flex-row justify-between text-primary border-b cursor-pointer p-4 
                      sticky top-0 bg-background z-10 shadow-sm">
            <span v-if="mapStore.selectedOption.value === 'search'">
              {{ $t('sidebar.search_results', { label: mapStore.searchQuery.label }) }}
            </span>
            <span v-if="mapStore.selectedOption.value === 'favorites'">
              {{ $t('sidebar.favorites') }}
            </span>
            <XIcon @click="mapStore.setSelectedOption(mapStore.selectedOption.value, false)" class="h-6 w-6" />
          </div>
          <VideoList v-if="mapStore.selectedOption.value === 'search'" :videos="props.videos" />
          <VideoList v-if="mapStore.selectedOption.value === 'favorites'" :videos="props.favorites" />
        </div>
      </SidebarContent>
    </Sidebar>
  </div>
</template>


  

  