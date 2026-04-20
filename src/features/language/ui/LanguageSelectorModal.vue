<script setup lang="ts">
import { ref, watch } from 'vue'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Button } from '@/shared/ui/shadcn/button'
import { useLanguage } from '../model/use-language'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { currentLanguage, setLanguage } = useLanguage()
const selectedLang = ref<'en' | 'es'>(currentLanguage.value)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      selectedLang.value = currentLanguage.value
    }
  },
)

const saveSettings = () => {
  setLanguage(selectedLang.value)
  emit('close')
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm rounded-lg p-6 shadow-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">{{ $t('select_lang') }}</DialogTitle>
        </div>
        <DialogClose class="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <RadioGroup v-model="selectedLang" class="mt-5">
        <div v-for="option in ['en', 'es']" :key="option" class="flex flex-row">
          <img :src="`/imgs/${option}.svg`" :alt="option" class="mr-2 h-5 w-5" />
          <RadioGroupItem class="h-5 w-5" :value="option" :id="option" />
          <Label :for="option" class="ml-2 pt-1">{{ option }}</Label>
        </div>
      </RadioGroup>

      <Button @click="saveSettings" class="mt-5 w-full">
        {{ $t('save_settings') }}
      </Button>
    </DialogContent>
  </Dialog>
</template>
