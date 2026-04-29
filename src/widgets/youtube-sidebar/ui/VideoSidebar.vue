<script setup lang="ts">
import { HeartIcon, List, XIcon } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/shadcn/sidebar'
import { Button } from '@/shared/ui/shadcn/button'
import { useYoutubeSearchSettings } from '@/features/youtube-search-settings'
import { useYoutubeVideos } from '@/features/youtube-videos'
import type { VideoMarker } from '@/entities/youtube-video'
import VideoList from './VideoList.vue'

const props = defineProps<{
  videos: VideoMarker[]
  favorites: VideoMarker[]
  filteredVideos?: VideoMarker[]
}>()

const { state } = useSidebar()
const { iconMap, searchQuery } = useYoutubeSearchSettings()
const { selectedOption, setSelectedOption } = useYoutubeVideos()

const displayVideos = computed(() => {
  if (props.filteredVideos && props.filteredVideos.length > 0) {
    return props.filteredVideos
  }
  return props.videos
})

const isFiltered = computed(() => {
  return props.filteredVideos && props.filteredVideos.length > 0
})

watch(
  () => props.videos,
  (newVideos) => {
    if (newVideos.length > 0) {
      setSelectedOption('search', true)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="hidden md:block">
    <Sidebar collapsible="icon">
      <SidebarContent class="flex h-screen flex-row gap-0 bg-background text-white">
        <SidebarGroup class="w-[50px] min-w-[50px] border-r bg-background">
          <SidebarGroupContent class="flex flex-col items-center">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <Button
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md bg-background p-2 text-primary transition-colors hover:bg-secondary"
                    :class="{
                      'bg-accent text-white hover:bg-accent hover:text-white': selectedOption.value === 'search',
                    }"
                    @click="setSelectedOption('search', true)"
                  >
                    <List />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <Button
                    class="flex w-full cursor-pointer items-center gap-2 rounded-md bg-background p-2 text-primary transition-colors hover:bg-secondary"
                    :class="{
                      'bg-accent text-white hover:bg-accent hover:text-white': selectedOption.value === 'favorites',
                    }"
                    @click="setSelectedOption('favorites', true)"
                  >
                    <HeartIcon />
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div v-if="state === 'expanded'" class="h-screen flex-1 overflow-y-auto bg-background">
          <div class="sticky top-0 z-10 flex cursor-pointer flex-row justify-between border-b bg-background p-4 text-primary shadow-sm">
            <div class="flex flex-col gap-1">
              <span v-if="selectedOption.value === 'search'" class="flex flex-row items-center gap-2 font-semibold text-primary">
                <component :is="iconMap[searchQuery.icon as keyof typeof iconMap]" class="h-4 w-4" />
                {{ $t('sidebar.search_results', { label: (searchQuery.value as any).name }) }}
              </span>
              <span v-if="selectedOption.value === 'favorites'" class="flex flex-row items-center gap-2 font-semibold text-primary">
                <HeartIcon class="h-4 w-4" /> {{ $t('sidebar.favorites') }}
              </span>
              <span v-if="isFiltered && selectedOption.value === 'search'" class="text-xs text-gray-500">
                Showing {{ displayVideos.length }} videos in selected region
              </span>
            </div>
            <XIcon class="h-6 w-6" @click="setSelectedOption(selectedOption.value, false)" />
          </div>

          <VideoList v-if="selectedOption.value === 'search'" :videos="displayVideos" />
          <VideoList v-if="selectedOption.value === 'favorites'" :videos="props.favorites" />
        </div>
      </SidebarContent>
    </Sidebar>
  </div>
</template>
