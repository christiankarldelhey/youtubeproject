<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import InputText from 'primevue/inputtext';

const { t } = useI18n();  
const term = ref('');

</script>

<template>
  <InputText 
    v-model="term" 
    type="text" 
    size="large" 
    :placeholder="t('search_placeholder')" />
</template>

