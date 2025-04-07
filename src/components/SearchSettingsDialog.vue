<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMapStore } from '../store/mapStore';
import { useSearchSettings } from '../composables/useSearchSettings';

const { searchOptions, iconMap } = useSearchSettings();

const mapStore = useMapStore();

const saveSettings = () => {
  const selectedObject = searchOptions.find(option => 
    option.value === selectedOption.value);
  mapStore.setSearchQuery(selectedObject!);
  emit('close');
};

const selectedOption = ref(mapStore.searchQuery.value);
const props = defineProps<{ open: boolean }>();

const emit = defineEmits(['close']);
</script>

<template>  
    <Dialog :open="props.open" @update:open="emit('close')">
        <DialogContent class="bg-background max-w-sm p-6 shadow-lg rounded-lg">
            <DialogHeader>
                <div class="flex flex-row gap-2">
                    <DialogTitle class="pt-1">Search by topic</DialogTitle>
                </div>
                <DialogClose 
                    class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800">
                </DialogClose>
            </DialogHeader>
            <RadioGroup v-model="selectedOption" class="mt-5">
                <div v-for="option in searchOptions" class="flex flex-row" :key="option.value">
                    <RadioGroupItem :value="option.value" :id="option.value" />
                    <Component :is="iconMap[option.icon]" class="ml-2 h-5 w-5" />
                    <Label :for="option.value" class="ml-2">
                        {{ option.label }}
                    </Label>
                </div>
            </RadioGroup>
            <Button 
                @click="saveSettings" 
                class="w-full mt-5">
                Save Settings
            </Button>
        </DialogContent>
    </Dialog>
</template>
