<script setup lang="ts">
import { Search } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const emit = defineEmits(['fetch-videos']);

const term = '';

</script>

<template>
  <div class="relative flex w-full items-center">
    <div class="relative w-full">
      <Input id="search" type="text" placeholder="Search for a place" class="w-full pl-10" />
      <span class="absolute left-3 top-1/2 -translate-y-1/2">
        <Search class="h-4 w-4 text-muted-foreground" />
      </span>
    </div>
    <Button @click="emit('fetch-videos')">Fetch Videos</Button>
  </div>
</template>
