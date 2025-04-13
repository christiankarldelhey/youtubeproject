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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import VideoList from './VideoList.vue';
import { useMapStore } from '../store/mapStore';
import { useMobile } from '../composables/useMobile';
import { removeEmojisAndUppercaseWords } from '@/utils/utils';
import { useFavorites } from '../composables/useFavorites';
import type { VideoMarker } from "../types/Map";

const { toggleFavorite } = useFavorites();
const mapStore = useMapStore();
const { isMobile } = useMobile();
const props = defineProps<{ videos: VideoMarker[]; favorites: VideoMarker[] }>();
const { state } = useSidebar();

watch(() => props.videos, (newVideos) => {
  if (newVideos.length > 0) {
    mapStore.setSelectedOption('search');
  }
}, { deep: true });

</script>

<template>
  <div v-if="!isMobile" class="hidden md:block">
    <Sidebar  collapsible="icon">
      <SidebarContent class="flex flex-row bg-background text-white h-screen gap-0">
        <SidebarGroup class="min-w-[50px] w-[50px] bg-background border-r">
          <SidebarGroupContent class="flex flex-col items-center">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="mapStore.setSelectedOption('search')"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-primary/30" 
                    :class="{ 'bg-primary/30': mapStore.selectedOption === 'search' }">
                    <List />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
  
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    @click="mapStore.setSelectedOption('favorites')"
                    class="flex items-center gap-2 w-full p-2 rounded-md transition-colors
                            cursor-pointer bg-white text-primary hover:bg-primary/30" 
                    :class="{ 'bg-primary/30': mapStore.selectedOption === 'favorites' }">
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
                <span v-if="mapStore.selectedOption === 'search'">{{ mapStore.searchQuery.label }} videos in the area </span>
                <span v-if="mapStore.selectedOption === 'favorites'">Favorited videos</span>
                <XIcon @click="mapStore.setSelectedOption('none')" class="h-6 w-6" />
            </div>
            <VideoList v-if="mapStore.selectedOption === 'search'" :videos="props.videos" />
            <VideoList v-if="mapStore.selectedOption === 'favorites'" :videos="props.favorites" />
        </div>
  
      </SidebarContent>
    </Sidebar>
  </div>
  <!-- Mobile view -->
  <div v-else class="block md:hidden">
    <Sheet :open="isMobile && mapStore.selectedOption !== 'none'" @update:open="mapStore.setSelectedOption('none')">
      <SheetContent side="bottom" class="h-[70vh] p-0 overflow-y-auto mobile-sheet">
        <SheetHeader class="p-4 border-b sticky top-0 bg-background z-10">
          <div class="flex items-center justify-between w-full">
            <div v-if="mapStore.selectedOption === 'search'" class="text-primary text-sm truncate">
              {{ mapStore.searchQuery.label }} videos in the area
            </div>
            <div v-else-if="mapStore.selectedOption === 'favorites'" class="text-primary text-sm truncate">
              Favorited videos
            </div>
            <div v-else-if="mapStore.selectedOption === 'video-detail'" class="flex items-center gap-2 flex-1 min-w-0">
              <HeartIcon 
                class="flex-shrink-0 h-6 w-6 cursor-pointer transition-colors duration-200" 
                :class="{ 'fill-red-500 text-red-500': mapStore.selectedPin?.favorited }"
                @click="toggleFavorite(mapStore.selectedPin!)">
              </HeartIcon>
              <span class="text-sm text-primary truncate">
                {{ removeEmojisAndUppercaseWords(mapStore.selectedPin?.title || '') }}
              </span>
            </div>

            <XIcon 
              @click="mapStore.setSelectedOption('none')" 
              class="flex-shrink-0 h-4 w-4 text-right cursor-pointer"
            />
          </div>
        </SheetHeader>

        <div v-if="mapStore.selectedOption === 'video-detail'" class="p-4">
          <Card class="space-y-4">
              <div class="relative w-full h-9/10 rounded overflow-hidden">
              <iframe
                  :src="`https://www.youtube.com/embed/${mapStore.selectedPin?.videoId}?autoplay=1&controls=1`"
                  title="YouTube video player"
                  frameborder="0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  class="w-full h-full object-cover aspect-video"
              ></iframe>
                <p class="text-sm pt-2">
                  {{ mapStore.selectedPin?.description || '' }}
                </p>
              </div>
          </Card>
        </div>
        <div v-else class="p-4">
          <VideoList v-if="mapStore.selectedOption === 'search'" :videos="props.videos" />
          <VideoList v-if="mapStore.selectedOption === 'favorites'" :videos="props.favorites" />
        </div>
      </SheetContent>
    </Sheet>
  </div>

  </template>

  <style>
    :deep([data-state="open"]) {
      background-color: transparent !important;
      pointer-events: none;
    }
  </style>

  

  