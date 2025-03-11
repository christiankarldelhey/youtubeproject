<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';

const { t } = useI18n();

defineProps<{ msg: string }>()

</script>

<template>
  <h1>{{ msg }}</h1>
  <p>
      {{ t('login') }}
    </p>
  <div class="w-full flex flex-col gap-2 card">
  </div>
  <Button :label="t('login')" icon="pi pi-home" aria-label="Save" />
</template>

