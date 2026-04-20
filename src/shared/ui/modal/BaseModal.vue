<script setup lang="ts">
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'

defineProps<{
  open: boolean
  title: string
}>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm rounded-lg p-6 shadow-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">{{ title }}</DialogTitle>
        </div>
        <DialogClose class="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <slot />
    </DialogContent>
  </Dialog>
</template>
