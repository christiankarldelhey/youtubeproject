<script setup lang="ts">
import { useMapStore } from '../store/mapStore';
import { computed } from 'vue';

const mapStore = useMapStore();

// const favoriteVideos = computed(() => mapStore.favoriteVideos);

</script>

<template>  
    <div class="p-4 text-primary">
        You dont have no videos favorited yet. Please add some.
    </div>
</template>