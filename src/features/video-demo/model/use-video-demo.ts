import Hls from 'hls.js'
import { computed, ref } from 'vue'

const HLS_DEMO_STREAMS = [
  {
    url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    label: 'Mux public HLS test stream',
  },
  {
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    label: 'Akamai public live test stream',
  },
] as const

const MJPEG_DEMO_SOURCE_LABEL = 'Public MotionJPEG test stream'
const MJPEG_DEMO_STREAMS = [
  'https://webcam.st-malo.com/axis-cgi/mjpg/video.cgi?resolution=640x360',
  'https://axis1.1000eyes.de/axis-cgi/mjpg/video.cgi?resolution=640x360',
]

export function useVideoDemo() {
  const hlsVideoRef = ref<HTMLVideoElement | null>(null)
  const hlsInstance = ref<Hls | null>(null)
  const hlsError = ref<string | null>(null)
  const hlsStreamIndex = ref(0)
  const mjpegError = ref(false)
  const mjpegLoading = ref(false)
  const mjpegStreamIndex = ref(0)
  let mjpegProbeTimer: ReturnType<typeof setTimeout> | null = null

  const currentHlsStream = computed(() => HLS_DEMO_STREAMS[hlsStreamIndex.value] ?? HLS_DEMO_STREAMS[0])
  const currentMjpegStreamUrl = computed(() => MJPEG_DEMO_STREAMS[mjpegStreamIndex.value] ?? '')

  const destroyHlsPlayer = (): void => {
    hlsInstance.value?.destroy()
    hlsInstance.value = null
  }

  const tryPlayVideo = async (video: HTMLVideoElement): Promise<void> => {
    try {
      await video.play()
    } catch {
      hlsError.value = 'Autoplay was blocked. Press play to start the stream.'
    }
  }

  const clearMjpegProbeTimer = (): void => {
    if (!mjpegProbeTimer) {
      return
    }
    clearTimeout(mjpegProbeTimer)
    mjpegProbeTimer = null
  }

  const handleMjpegError = (): void => {
    if (mjpegStreamIndex.value < MJPEG_DEMO_STREAMS.length - 1) {
      mjpegStreamIndex.value += 1
      mjpegError.value = false
      startMjpegProbe()
      return
    }

    mjpegLoading.value = false
    mjpegError.value = true
  }

  const startMjpegProbe = (): void => {
    mjpegLoading.value = true
    clearMjpegProbeTimer()
    mjpegProbeTimer = setTimeout(() => {
      if (mjpegLoading.value) {
        handleMjpegError()
      }
    }, 8000)
  }

  const handleMjpegLoad = (): void => {
    mjpegLoading.value = false
    clearMjpegProbeTimer()
  }

  const resetMjpegState = (): void => {
    mjpegError.value = false
    mjpegStreamIndex.value = 0
    startMjpegProbe()
  }

  const setupHlsPlayer = (streamIndex = 0): void => {
    const video = hlsVideoRef.value
    if (!video) {
      return
    }

    hlsStreamIndex.value = streamIndex
    hlsError.value = null
    destroyHlsPlayer()

    const stream = HLS_DEMO_STREAMS[streamIndex]
    if (!stream) {
      hlsError.value = 'HLS stream is unavailable right now.'
      return
    }

    const tryNextHlsStream = (): boolean => {
      const nextIndex = streamIndex + 1
      if (nextIndex < HLS_DEMO_STREAMS.length) {
        setupHlsPlayer(nextIndex)
        return true
      }
      return false
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = stream.url
      video.addEventListener(
        'loadedmetadata',
        async () => {
          await tryPlayVideo(video)
        },
        { once: true },
      )
      video.addEventListener(
        'error',
        () => {
          if (!tryNextHlsStream()) {
            hlsError.value = 'HLS stream is unavailable right now.'
          }
        },
        { once: true },
      )
      video.load()
      return
    }

    if (Hls.isSupported()) {
      const instance = new Hls()
      instance.loadSource(stream.url)
      instance.attachMedia(video)

      instance.on(Hls.Events.MANIFEST_PARSED, () => {
        void tryPlayVideo(video)
      })

      instance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          destroyHlsPlayer()
          if (!tryNextHlsStream()) {
            hlsError.value = 'HLS stream is unavailable right now.'
          }
        }
      })

      hlsInstance.value = instance
      return
    }

    hlsError.value = 'HLS is not supported in this browser.'
  }

  const initialize = () => {
    resetMjpegState()
    setupHlsPlayer()
  }

  const cleanup = () => {
    mjpegLoading.value = false
    clearMjpegProbeTimer()
    destroyHlsPlayer()

    if (hlsVideoRef.value) {
      hlsVideoRef.value.removeAttribute('src')
      hlsVideoRef.value.load()
    }
  }

  return {
    hlsVideoRef,
    hlsError,
    currentHlsStream,
    currentMjpegStreamUrl,
    mjpegError,
    mjpegLoading,
    mjpegStreamIndex,
    mjpegTotalStreams: MJPEG_DEMO_STREAMS.length,
    mjpegSourceLabel: MJPEG_DEMO_SOURCE_LABEL,
    handleMjpegLoad,
    handleMjpegError,
    initialize,
    cleanup,
  }
}
