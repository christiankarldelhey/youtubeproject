<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronUpIcon, MapPin } from 'lucide-vue-next'
import { useMobile } from '@/shared/composables/use-mobile'
import { removeEmojisAndUppercaseWords } from '@/utils/utils'
import { useAuthSession } from '@/features/auth'
import { useYoutubeVideos } from '@/features/youtube-videos'
import type { VideoMarker } from '@/entities/youtube-video'

const props = defineProps<{ videos: VideoMarker[] }>()
const { user } = useAuthSession()
const { isMobile } = useMobile()
const { selectedOption, setDialogOpen, setMobileVideoDetail, selectVideo } = useYoutubeVideos()

const collapsedLocations = ref<Record<string, boolean>>({})

const groupedVideoMarkers = computed(() => {
  const locationMap: Record<string, VideoMarker[]> = {}

  props.videos.forEach((video) => {
    const location = video.location || 'Unknown'
    if (!locationMap[location]) {
      locationMap[location] = []
    }
    locationMap[location].push(video)
  })

  return Object.entries(locationMap)
    .sort(([, a], [, b]) => b.length - a.length)
    .map(([location, videos]) => ({ location, videos }))
})

const toggleCollapse = (location: string) => {
  collapsedLocations.value[location] = !collapsedLocations.value[location]
}

const openVideo = (video: VideoMarker) => {
  if (!isMobile.value) {
    setDialogOpen(true)
  } else {
    setMobileVideoDetail(true)
  }

  selectVideo(video)
}
</script>

<template>
  <div v-if="videos.length === 0" class="p-2 text-primary">
    <p v-if="selectedOption.value === 'search'" class="text-sm">
      No videos found. Please explore a new location and click on the search videos button.
    </p>
    <p v-if="selectedOption.value === 'favorites' && user" class="text-sm">You dont have any favorited video yet.</p>
    <p v-if="selectedOption.value === 'favorites' && !user" class="text-sm">
      You cannot favorite videos if you are not logged in.
    </p>
  </div>

  <div v-for="group in groupedVideoMarkers" v-else :key="group.location">
    <div
      class="flex cursor-pointer items-center justify-between border-b px-4 py-2 text-primary"
      @click="toggleCollapse(group.location)"
    >
      <div class="flex items-center gap-2">
        <MapPin class="h-4 w-4 text-gray-500" />
        <span class="text-sm text-gray-600">{{ group.location.toUpperCase() }} ({{ group.videos.length }})</span>
      </div>
      <div class="flex items-center gap-4">
        <ChevronDownIcon v-if="collapsedLocations[group.location]" class="h-4 w-4 text-gray-500" />
        <ChevronUpIcon v-else class="h-4 w-4 text-gray-500" />
      </div>
    </div>

    <div v-show="!collapsedLocations[group.location]">
      <div
        v-for="video in group.videos"
        :key="video.videoId"
        class="cursor-pointer border-b p-4 text-primary hover:bg-secondary"
        @click="openVideo(video)"
      >
        <h4 class="pb-2 font-semibold">{{ removeEmojisAndUppercaseWords(video.title) }}</h4>
        <div class="flex justify-between" :class="isMobile ? 'w-full flex-col' : 'flex-row'">
          <div class="flex flex-shrink-0 flex-col">
            <div
              class="relative overflow-hidden rounded"
              :class="isMobile ? 'h-9/10 w-full' : 'h-28 w-48'"
              style="aspect-ratio: 16 / 9;"
            >
              <img :src="video.thumbnail" alt="Video Thumbnail" class="left-0 h-full w-full object-cover" />
            </div>
          </div>

          <div class="flex flex-col" :class="isMobile ? 'w-full' : 'max-w-[60%] flex-grow px-4'">
            <p
              class="cursor-pointer overflow-hidden text-sm leading-tight"
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
