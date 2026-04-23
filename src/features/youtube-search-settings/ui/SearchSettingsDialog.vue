<script setup lang="ts">
import { ref, watch } from 'vue'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/radio-group'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Button } from '@/shared/ui/shadcn/button'
import { useYoutubeSearchSettings } from '../model/use-youtube-search-settings'
import { useYoutubeVideos } from '@/features/youtube-videos'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  close: []
}>()

const { searchOptions, searchQuery, iconMap, setSearchQueryByValue } = useYoutubeSearchSettings()
const { setShowSearchButton } = useYoutubeVideos()

const selectedQuery = ref(searchQuery.value.value)

watch(
  () => props.open,
  (value) => {
    if (value) {
      selectedQuery.value = searchQuery.value.value
    }
  },
)

const saveSettings = () => {
  setSearchQueryByValue(selectedQuery.value)
  setShowSearchButton(true)
  emit('close')
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('close')">
    <DialogContent class="max-w-sm rounded-lg bg-background p-6 shadow-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">{{ $t('search_by_topic') }}</DialogTitle>
        </div>
        <DialogClose class="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <RadioGroup v-model="selectedQuery" class="mt-5">
        <div v-for="option in searchOptions" :key="option.value" class="flex flex-row">
          <Component :is="iconMap[option.icon as keyof typeof iconMap]" class="mr-2 h-5 w-5" />
          <RadioGroupItem class="h-5 w-5" :value="option.value" :id="option.value" />
          <Label :for="option.value" class="ml-2 pt-1">{{ option.name }}</Label>
        </div>
      </RadioGroup>

      <Button @click="saveSettings" class="mt-5 w-full">{{ $t('save_settings') }}</Button>
    </DialogContent>
  </Dialog>
</template>
