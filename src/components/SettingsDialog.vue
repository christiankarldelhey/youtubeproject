<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMapStore } from '../store/mapStore';

const mapStore = useMapStore();

const searchOptions = [
  { value: 'travel', label: 'Travel (general travel videos)' },
  { value: 'food', label: 'Gastronomy' },
  { value: 'hotel', label: 'Accomodation' },
  { value: 'hiking', label: 'Hiking (Outdoors)' },
  { value: 'budget', label: 'Travel on a budget' },
];

const saveSettings = () => {
  mapStore.setSearchQuery(selectedOption.value);
  emit('close');
};

const selectedOption = ref(mapStore.searchQuery);
const props = defineProps<{ open: boolean }>();

const emit = defineEmits(['close']);
</script>

<template>  
    <Dialog :open="props.open" @update:open="emit('close')">
        <DialogContent class="bg-background max-w-sm p-6 shadow-lg rounded-lg">
            <DialogHeader>
                <div class="flex flex-row gap-2">
                    <DialogTitle class="pt-1">User Settings</DialogTitle>
                </div>
                <DialogClose 
                    class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800">
                </DialogClose>
            </DialogHeader>
            <RadioGroup v-model="selectedOption" class="mt-5">
                <div v-for="option in searchOptions" :key="option.value">
                    <RadioGroupItem :value="option.value" :id="option.value" />
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
