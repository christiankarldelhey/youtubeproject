<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useVideoDemo } from '../model/use-video-demo'

const videoDemo = useVideoDemo()
const {
  hlsVideoRef,
  hlsError,
  currentHlsStream,
  currentMjpegStreamUrl,
  mjpegError,
  mjpegLoading,
  mjpegStreamIndex,
  mjpegTotalStreams,
  mjpegSourceLabel,
  handleMjpegLoad,
  handleMjpegError,
} = videoDemo

void hlsVideoRef

onMounted(() => {
  videoDemo.initialize()
})

onUnmounted(() => {
  videoDemo.cleanup()
})
</script>

<template>
  <div class="space-y-3">
    <div class="space-y-1">
      <p class="text-[11px] font-semibold text-slate-700">Live HLS feed</p>
      <video
        ref="hlsVideoRef"
        class="w-full rounded border border-slate-200 bg-black"
        controls
        autoplay
        muted
        playsinline
      />
      <p class="text-[10px] text-slate-500">Demo source: {{ currentHlsStream.label }}</p>
      <p v-if="hlsError" class="text-[10px] text-red-600">{{ hlsError }}</p>
    </div>

    <div class="space-y-1">
      <p class="text-[11px] font-semibold text-slate-700">Live MJPEG feed</p>
      <img
        v-if="!mjpegError"
        :key="currentMjpegStreamUrl"
        :src="currentMjpegStreamUrl"
        class="h-40 w-full rounded border border-slate-200 bg-black object-contain"
        alt="Live MJPEG demo stream"
        @load="handleMjpegLoad"
        @error="handleMjpegError"
      >
      <p class="text-[10px] text-slate-500">Demo source: {{ mjpegSourceLabel }}</p>
      <p v-if="mjpegLoading && !mjpegError" class="text-[10px] text-slate-500">
        Trying MJPEG source {{ mjpegStreamIndex + 1 }}/{{ mjpegTotalStreams }}...
      </p>
      <p v-if="mjpegError" class="text-[10px] text-red-600">MJPEG stream is unavailable right now.</p>
      <button
        class="mt-1 rounded border border-slate-300 px-2 py-1 text-[10px] text-slate-700 hover:bg-slate-100"
        @click="handleMjpegError"
      >
        Try another MJPEG source
      </button>
    </div>
  </div>
</template>
