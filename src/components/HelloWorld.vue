<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      {{ t('welcome') }}
    </p>
  </div>
</template>

