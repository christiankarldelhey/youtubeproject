<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Button from 'primevue/button';

const { t } = useI18n();

defineProps<{ msg: string }>()

</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <Button label="button" />
    <p>
      {{ t('welcome') }}
    </p>
  </div>
</template>

