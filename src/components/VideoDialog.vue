<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useFavorites } from '../composables/useFavorites';
import { HeartIcon } from "lucide-vue-next";
import { useMapStore } from '../store/mapStore';
import { ref } from 'vue';

const mapStore = useMapStore();
const selectedVideo = ref(mapStore.selectedPin);
const { toggleFavorite } = useFavorites();

const closeDialog = () => {
    mapStore.setDialogOpen(false);
    mapStore.clearSelectedPin();
};
</script>    

<template>      
    <Dialog 
        :open="mapStore.dialogOpen" 
        @update:open="(isOpen) => { if (!isOpen) closeDialog(); }"
    >
        <DialogContent 
            modal
            @interact-outside="(e) => e.preventDefault()" 
            class="bg-background max-w-4xl p-6 shadow-lg rounded-lg"
            :style="{ backdropFilter: 'none' }"
        >
            <DialogHeader>
                <div class="flex flex-row gap-2">
                    <HeartIcon 
                    class="h-6 w-6 cursor-pointer transition-colors duration-200" 
                    :class="{ 'fill-red-500 text-red-500': selectedVideo?.favorited }"
                    @click="toggleFavorite(selectedVideo!)" />
                    <DialogTitle class="pt-1">
                        {{ selectedVideo?.title }}
                    </DialogTitle>
                </div>
                <DialogClose 
                    @click="closeDialog" 
                    class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800">
                </DialogClose>
            </DialogHeader>
            
            <Card class="space-y-4">
                <div class="relative w-full h-9/10 rounded overflow-hidden">
                <iframe
                    :src="`https://www.youtube.com/embed/${selectedVideo?.videoId}?autoplay=1&controls=1`"
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowfullscreen
                    class="w-full h-full object-cover aspect-video"
                ></iframe>
                </div>
            </Card>
        </DialogContent>
    </Dialog>
</template>

<style scoped>
    ol {
        z-index: 10000 !important;
    }
</style>
