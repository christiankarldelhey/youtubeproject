<script setup lang="ts">
import { HeartIcon, XIcon } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { Sheet, SheetContent, SheetHeader } from '@/shared/ui/shadcn/sheet'
import { useYoutubeSearchSettings } from '@/features/youtube-search-settings'
import { useYoutubeVideos } from '@/features/youtube-videos'
import type { VideoMarker } from '@/entities/youtube-video'
import VideoList from './VideoList.vue'

const props = defineProps<{
  videos: VideoMarker[]
  favorites: VideoMarker[]
  filteredVideos?: VideoMarker[]
  open: boolean
}>()

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
      setSelectedOption('search', false)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="mobile-sheet block md:hidden">
    <Sheet class="bg-background" :open="props.open" @update:open="$emit('update:open')">
      <SheetContent side="bottom" class="mb-12 h-[55vh] w-full overflow-y-auto overflow-x-hidden bg-background p-0">
        <SheetHeader class="sticky top-0 z-10 border-b bg-background p-4">
          <div class="flex w-full flex-col items-start justify-between gap-2">
            <div class="flex w-full items-center justify-between">
              <div v-if="selectedOption.value === 'search'" class="truncate text-sm text-primary">
                <span class="flex flex-row items-center gap-2 font-semibold text-primary">
                  <component :is="iconMap[searchQuery.icon as keyof typeof iconMap]" class="h-4 w-4" />
                  {{ $t('sidebar.search_results', { label: (searchQuery.value as any).name }) }}
                </span>
              </div>
              <span v-if="selectedOption.value === 'favorites'" class="flex flex-row items-center gap-2 font-semibold text-primary">
                <HeartIcon class="h-4 w-4" /> {{ $t('sidebar.favorites') }}
              </span>
              <XIcon class="h-4 w-4 flex-shrink-0 cursor-pointer text-right" @click="setSelectedOption(selectedOption.value, false)" />
            </div>
            <span v-if="isFiltered && selectedOption.value === 'search'" class="text-xs text-gray-500">
              Showing {{ displayVideos.length }} videos in selected region
            </span>
          </div>
        </SheetHeader>

        <div class="p-1">
          <VideoList v-if="selectedOption.value === 'search'" :videos="displayVideos" />
          <VideoList v-if="selectedOption.value === 'favorites'" :videos="props.favorites" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
