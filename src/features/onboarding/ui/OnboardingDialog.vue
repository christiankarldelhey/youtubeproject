<script setup lang="ts">
import { ref, computed } from 'vue'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/shadcn/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/shadcn/dialog'
import { Label } from '@/shared/ui/shadcn/label'
import { Button } from '@/shared/ui/shadcn/button'
import { useYoutubeSearchSettings } from '@/features/youtube-search-settings'
import { useSearchPreferencesStore } from '@/shared/model/search-preferences.store'
import type { TravelType } from '@/shared/model/search-preferences.store'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  complete: []
}>()

const { searchOptions, iconMap } = useYoutubeSearchSettings()
const searchPreferences = useSearchPreferencesStore()

const currentStep = ref(1)
const selectedTravelType = ref<TravelType>(null)
const selectedCategory = ref(searchOptions[0].value)

const travelTypeOptions = [
  { value: 'city' as TravelType, label: 'onboarding_city', id: 'travel-city' },
  { value: 'rural' as TravelType, label: 'onboarding_rural', id: 'travel-rural' },
  { value: null as TravelType, label: 'onboarding_explore', id: 'travel-explore' },
]

// Generate safe IDs for category options
const categoryOptions = computed(() =>
  searchOptions.map((opt, index) => ({
    ...opt,
    safeId: `category-${index}`,
  }))
)

const handleContinue = () => {
  if (currentStep.value === 1) {
    searchPreferences.setTravelType(selectedTravelType.value)
    currentStep.value = 2
  } else {
    // Find the selected option by value
    const selectedOption = searchOptions.find((opt) => opt.value === selectedCategory.value)
    if (selectedOption) {
      searchPreferences.setCategory(selectedOption.name)
      searchPreferences.markOnboardingComplete()
      emit('complete')
    }
  }
}

const handleOpenChange = (open: boolean) => {
  if (!open && currentStep.value === 2) {
    // Only emit complete if dialog was closed after step 2
    emit('complete')
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleOpenChange">
    <DialogContent class="max-w-sm rounded-lg bg-background p-6 shadow-lg">
      <DialogHeader>
        <DialogTitle class="pt-1">
          {{ currentStep === 1 ? $t('onboarding_title') : $t('onboarding_step2_title') }}
        </DialogTitle>
      </DialogHeader>

      <!-- Step 1: Travel Type -->
      <div v-if="currentStep === 1" class="mt-5">
        <p class="mb-4 text-sm text-muted-foreground">{{ $t('onboarding_step1_title') }}</p>
        <RadioGroup v-model="selectedTravelType" class="space-y-3">
          <div v-for="option in travelTypeOptions" :key="String(option.value)" class="flex flex-row items-center">
            <RadioGroupItem class="h-5 w-5" :value="option.value" :id="option.id" />
            <Label :for="option.id" class="ml-2 cursor-pointer">{{ $t(option.label) }}</Label>
          </div>
        </RadioGroup>
      </div>

      <!-- Step 2: Activity Topic -->
      <div v-if="currentStep === 2" class="mt-5">
        <p class="mb-4 text-sm text-muted-foreground">{{ $t('onboarding_step2_title') }}</p>
        <RadioGroup v-model="selectedCategory" class="space-y-3">
          <div v-for="option in categoryOptions" :key="option.value" class="flex flex-row items-center">
            <Component :is="iconMap[option.icon as keyof typeof iconMap]" class="mr-2 h-5 w-5" />
            <RadioGroupItem class="h-5 w-5" :value="option.value" :id="option.safeId" />
            <Label :for="option.safeId" class="ml-2 cursor-pointer">{{ option.name }}</Label>
          </div>
        </RadioGroup>
      </div>

      <Button @click="handleContinue" class="mt-5 w-full">
        {{ currentStep === 1 ? $t('onboarding_continue') : $t('onboarding_start') }}
      </Button>
    </DialogContent>
  </Dialog>
</template>
