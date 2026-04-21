<script setup lang="ts">
import { ref, watch } from 'vue'
import { HeartIcon } from 'lucide-vue-next'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Card } from '@/shared/ui/shadcn/card'
import { useYoutubeVideos } from '@/features/youtube-videos'
import { useYoutubeFavorites } from '@/features/youtube-favorites'

const { selectedVideo, dialogOpen, setDialogOpen, clearSelectedVideo } = useYoutubeVideos()
const { toggleFavorite } = useYoutubeFavorites()
const selectedVideoRef = ref(selectedVideo.value)

watch(selectedVideo, (video) => {
  selectedVideoRef.value = video
})

const closeDialog = () => {
  setDialogOpen(false)
  clearSelectedVideo()
}

const handleToggleFavorite = async () => {
  if (!selectedVideoRef.value) {
    return
  }

  await toggleFavorite(selectedVideoRef.value)
}
</script>

<template>
  <Dialog
    :open="dialogOpen"
    @update:open="(isOpen) => {
      if (!isOpen) {
        closeDialog()
      }
    }"
  >
    <DialogContent
      modal
      class="max-w-4xl rounded-lg bg-background p-6 shadow-lg"
      :style="{ backdropFilter: 'none' }"
      @interact-outside="(event) => event.preventDefault()"
    >
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <HeartIcon
            class="h-6 w-6 cursor-pointer transition-colors duration-200"
            :class="{ 'fill-red-500 text-red-500': selectedVideoRef?.favorited }"
            @click="handleToggleFavorite"
          />
          <DialogTitle class="pt-1">{{ selectedVideoRef?.title }}</DialogTitle>
        </div>
        <DialogClose
          class="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800"
          @click="closeDialog"
        />
      </DialogHeader>

      <Card class="space-y-4">
        <div class="relative h-9/10 w-full overflow-hidden rounded">
          <iframe
            :src="`https://www.youtube.com/embed/${selectedVideoRef?.videoId}?autoplay=1&controls=1`"
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            class="aspect-video h-full w-full object-cover"
          />
        </div>
      </Card>
    </DialogContent>
  </Dialog>
</template>
