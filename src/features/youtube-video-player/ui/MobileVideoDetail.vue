<script setup lang="ts">
import { HeartIcon, XIcon } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetHeader } from '@/shared/ui/shadcn/sheet'
import { Card } from '@/shared/ui/shadcn/card'
import { removeEmojisAndUppercaseWords } from '@/utils/utils'
import { useYoutubeVideos } from '@/features/youtube-videos'
import { useYoutubeFavorites } from '@/features/youtube-favorites'

const { selectedVideo, mobileVideoDetail, setMobileVideoDetail } = useYoutubeVideos()
const { toggleFavorite } = useYoutubeFavorites()

const handleToggleFavorite = async () => {
  if (!selectedVideo.value) {
    return
  }

  await toggleFavorite(selectedVideo.value)
}
</script>

<template>
  <div class="mobile-sheet block md:hidden">
    <Sheet
      class="bg-background"
      :open="mobileVideoDetail"
      @update:open="() => setMobileVideoDetail(false)"
    >
      <SheetContent side="bottom" class="mb-12 h-[55vh] w-full overflow-y-auto overflow-x-hidden bg-background p-0">
        <SheetHeader class="sticky top-0 z-10 border-b bg-background p-4">
          <div class="flex w-full items-center justify-between">
            <div v-if="selectedVideo" class="flex min-w-0 flex-1 items-center gap-2">
              <HeartIcon
                class="h-6 w-6 flex-shrink-0 cursor-pointer transition-colors duration-200"
                :class="{ 'fill-red-500 text-red-500': selectedVideo.favorited }"
                @click="handleToggleFavorite"
              />
              <span class="truncate text-sm text-primary">
                {{ removeEmojisAndUppercaseWords(selectedVideo.title || '') }}
              </span>
            </div>

            <XIcon class="h-4 w-4 flex-shrink-0 cursor-pointer text-right" @click="setMobileVideoDetail(false)" />
          </div>
        </SheetHeader>

        <div v-if="selectedVideo" class="p-4">
          <Card class="space-y-4">
            <div class="relative h-9/10 w-full overflow-hidden rounded">
              <iframe
                :src="`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1&controls=1`"
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
                class="aspect-video h-full w-full object-cover"
              />
              <p class="pt-2 text-sm">{{ selectedVideo.description || '' }}</p>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  </div>
</template>
