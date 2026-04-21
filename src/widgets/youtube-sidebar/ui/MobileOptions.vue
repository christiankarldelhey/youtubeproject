<script setup lang="ts">
import { HeartIcon, List } from 'lucide-vue-next'
import { Button } from '@/shared/ui/shadcn/button'
import { useYoutubeVideos } from '@/features/youtube-videos'

const { selectedOption, setSelectedOption } = useYoutubeVideos()
</script>

<template>
  <div class="flex flex-row justify-center gap-2">
    <Button
      class="mr-2 flex h-9 w-full cursor-pointer items-center gap-2 rounded-md bg-white p-5 text-primary transition-colors hover:bg-white"
      :class="{ active: selectedOption.value === 'search' }"
      @click="setSelectedOption('search', true)"
    >
      <List />
    </Button>

    <Button
      class="mr-2 flex h-9 w-full cursor-pointer items-center gap-2 rounded-md bg-white px-5 py-2 text-primary transition-colors hover:bg-white"
      :class="{ active: selectedOption.value === 'favorites' }"
      @click="setSelectedOption('favorites', true)"
    >
      <HeartIcon />
    </Button>
  </div>
</template>

<style scoped>
.active {
  background-color: #6639de;
  color: white;
}
</style>
