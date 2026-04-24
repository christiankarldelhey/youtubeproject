<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Input } from '@/shared/ui/shadcn/input'
import { Button } from '@/shared/ui/shadcn/button'
import { useResearchAreaStore, type CreateResearchAreaInput } from '@/entities/research-area'
import { useSearchPreferencesStore } from '@/shared/model/search-preferences.store'
import { createResearchAreaApi } from '@/entities/research-area'

const props = defineProps<{
  open: boolean
  bbox: [number, number, number, number]
  zoomLevel: number
}>()
const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const researchAreaStore = useResearchAreaStore()
const searchPreferences = useSearchPreferencesStore()

const name = ref('')

watch(
  () => props.open,
  (value) => {
    if (value) {
      name.value = ''
    }
  },
)

const handleCreate = async () => {
  if (!name.value.trim()) {
    return
  }

  try {
    const input: CreateResearchAreaInput = {
      name: name.value,
      bbox: props.bbox,
      zoomLevel: props.zoomLevel,
      travelType: searchPreferences.travelType,
      category: searchPreferences.category,
    }

    // Create in backend
    const researchArea = await createResearchAreaApi(input)

    // Also create in local store
    researchAreaStore.createResearchArea(input)
    researchAreaStore.setActiveResearchArea(researchArea.id)

    // Navigate to research area page
    router.push(`/research/${researchArea.id}`)

    emit('close')
  } catch (error) {
    console.error('Failed to create research area:', error)
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('close')">
    <DialogContent class="max-w-sm rounded-lg bg-background p-6 shadow-lg">
      <DialogHeader>
        <DialogTitle class="pt-1">{{ $t('research_area_title') }}</DialogTitle>
      </DialogHeader>

      <div class="mt-5 space-y-4">
        <div>
          <Label for="name">{{ $t('research_area_name') }} *</Label>
          <Input
            id="name"
            v-model="name"
            :placeholder="$t('research_area_name_placeholder')"
            class="mt-2"
          />
        </div>

        <div>
          <Label>{{ $t('research_area_bbox') }}</Label>
          <div class="mt-2 rounded bg-muted p-2 text-sm">
            {{ bbox.join(', ') }}
          </div>
        </div>

        <div>
          <Label>{{ $t('research_area_zoom_level') }}</Label>
          <div class="mt-2 rounded bg-muted p-2 text-sm">
            {{ zoomLevel }}
          </div>
        </div>
      </div>

      <div class="mt-5 flex gap-2">
        <Button variant="outline" class="flex-1" @click="emit('close')">
          {{ $t('research_area_cancel') }}
        </Button>
        <Button class="flex-1" @click="handleCreate" :disabled="!name.trim()">
          {{ $t('research_area_create') }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
