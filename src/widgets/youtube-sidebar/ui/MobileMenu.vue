<script setup lang="ts">
import { HeartIcon, XIcon } from 'lucide-vue-next'
import { watch } from 'vue'
import { Sheet, SheetContent, SheetHeader } from '@/shared/ui/shadcn/sheet'
import { useYoutubeSearchSettings } from '@/features/youtube-search-settings'
import { useYoutubeVideos } from '@/features/youtube-videos'
import type { VideoMarker } from '@/entities/youtube-video'
import VideoList from './VideoList.vue'

const props = defineProps<{
  videos: VideoMarker[]
  favorites: VideoMarker[]
  open: boolean
}>()

const { iconMap, searchQuery } = useYoutubeSearchSettings()
const { selectedOption, setSelectedOption } = useYoutubeVideos()

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
        </SheetHeader>

        <div class="p-1">
          <VideoList v-if="selectedOption.value === 'search'" :videos="props.videos" />
          <VideoList v-if="selectedOption.value === 'favorites'" :videos="props.favorites" />
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
