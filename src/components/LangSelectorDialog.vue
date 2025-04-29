<script setup lang="ts">
import { defineProps, defineEmits, ref } from 'vue';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const langs = ['en', 'es'];
const selectedLang = ref(locale.value);

const saveSettings = () => {
  locale.value = selectedLang.value as 'en' | 'es';
  emit('close');
};

const props = defineProps<{ open: boolean }>();
const emit = defineEmits(['close']);
</script>

<template>  
  <Dialog :open="props.open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm p-6 shadow-lg rounded-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">{{ $t('select_lang') }}</DialogTitle>
        </div>
        <DialogClose class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <RadioGroup v-model="selectedLang" class="mt-5">
        <div v-for="option in langs" class="flex flex-row" :key="option">
          <img :src="`/imgs/${option}.svg`" :alt="option" class="mr-2 h-5 w-5" />
          <RadioGroupItem class="h-5 w-5" :value="option" :id="option" />
          <Label :for="option" class="ml-2 pt-1">
            {{ option }}
          </Label>
        </div>
      </RadioGroup>

      <Button @click="saveSettings" class="w-full mt-5">
        {{ $t('save_settings') }}
      </Button>
    </DialogContent>
  </Dialog>
</template>
