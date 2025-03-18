<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useMapStore } from '../store/mapStore';
import type { VideoMarker } from "../types/Map";

const mapStore = useMapStore();

const props = defineProps<{
    video: VideoMarker;
}>();

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
            class="bg-white max-w-4xl p-6 shadow-lg rounded-lg"
            :style="{ backdropFilter: 'none' }"
        >
            <DialogHeader>
                <DialogTitle>{{ props.video.title }}</DialogTitle>
                <DialogClose @click="closeDialog" class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800">
                </DialogClose>
            </DialogHeader>
            
            <Card class="space-y-4">
                <div class="relative w-full h-96 rounded overflow-hidden">
                    <iframe
                        :src="`https://www.youtube.com/embed/${props.video.videoId}?autoplay=1&controls=1`"
                        title="YouTube video player"
                        frameborder="0"
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        class="w-full h-full"
                    ></iframe>
                </div>
            </Card>
        </DialogContent>
    </Dialog>
</template>
