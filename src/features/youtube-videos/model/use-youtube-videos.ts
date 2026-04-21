import { ref } from 'vue'
import axios from 'axios'
import { fetchYoutubeMarkers } from '@/entities/youtube-video'
import type { FetchYoutubeParams, VideoMarker } from '@/entities/youtube-video'

type SidebarSelection = 'search' | 'favorites'

type SelectedOption = {
  value: SidebarSelection
  expanded: boolean
}

const videos = ref<VideoMarker[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const selectedVideo = ref<VideoMarker | null>(null)
const dialogOpen = ref(false)
const mobileVideoDetail = ref(false)
const showSearchButton = ref(false)
const selectedOption = ref<SelectedOption>({
  value: 'search',
  expanded: false,
})

export function useYoutubeVideos() {
  const fetchYoutubeVideos = async (params: FetchYoutubeParams): Promise<void> => {
    if (!params.apiKey) {
      error.value = 'VITE_YOUTUBE_API_KEY is missing.'
      videos.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      videos.value = await fetchYoutubeMarkers(params)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred while fetching YouTube videos.'
      }
      videos.value = []
    } finally {
      loading.value = false
    }
  }

  const setVideos = (newVideos: VideoMarker[]) => {
    videos.value = newVideos
  }

  const setShowSearchButton = (value: boolean) => {
    showSearchButton.value = value
  }

  const setSelectedOption = (value: SidebarSelection, expanded: boolean) => {
    selectedOption.value = { value, expanded }
  }

  const setDialogOpen = (value: boolean) => {
    dialogOpen.value = value
  }

  const setMobileVideoDetail = (value: boolean) => {
    mobileVideoDetail.value = value
  }

  const selectVideo = (video: VideoMarker | null) => {
    selectedVideo.value = video
  }

  const clearSelectedVideo = () => {
    selectedVideo.value = null
  }

  return {
    videos,
    loading,
    error,
    selectedVideo,
    dialogOpen,
    mobileVideoDetail,
    showSearchButton,
    selectedOption,
    fetchYoutubeVideos,
    setVideos,
    setShowSearchButton,
    setSelectedOption,
    setDialogOpen,
    setMobileVideoDetail,
    selectVideo,
    clearSelectedVideo,
  }
}
