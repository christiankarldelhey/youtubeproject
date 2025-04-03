<script setup lang="ts">
import { Search, HeartIcon, XIcon } from "lucide-vue-next";
import { ref, watch } from "vue";
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
import { useFavorites } from '../composables/useFavorites';
import type { VideoMarker } from "../types/Map";
import { Button } from '@/components/ui/button';
import VideoList from './VideoList.vue';

const { favorites } = useFavorites();

const emit = defineEmits(['handleSidebar']);
const props = defineProps<{ videos: VideoMarker[] }>();
const { state } = useSidebar();

const selectedOption = ref('none');

const handleSidebar = (open: boolean, option: string) => {
  emit('handleSidebar', open, option);
  selectedOption.value = option;
};

watch(() => props.videos, (newVideos) => {
  if (newVideos.length > 0) {
    handleSidebar(true, 'search');
  }
}, { deep: true });

</script>

<template>
    <Sidebar collapsible="icon">
      <SidebarContent class="flex flex-row bg-background text-white h-screen gap-0">
        <SidebarGroup class="min-w-[50px] w-[50px] bg-background border-r">
          <SidebarGroupContent class="flex flex-col items-center">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="handleSidebar(true, 'search')"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-primary/30" 
                    :class="{ 'bg-primary/30': selectedOption === 'search' }">
                    <Search />
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
                <span v-if="selectedOption === 'search'">Search results</span>
                <span v-if="selectedOption === 'favorites'">Favorited videos</span>
                <XIcon @click="handleSidebar(false, 'none')" class="h-6 w-6" />
            </div>
            <VideoList v-if="selectedOption === 'search'" :videos="props.videos" />
            <VideoList v-if="selectedOption === 'favorites'" :videos="favorites" />
        </div>
  
      </SidebarContent>
    </Sidebar>
  </template>
  

  