import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { toast } from '@/shared/ui/shadcn/toast'
import { auth, db } from '@/firebase'
import type { VideoMarker } from '@/entities/youtube-video'

const favorites = ref<VideoMarker[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

let initialized = false
let unsubscribeFavorites: Unsubscribe | null = null

const mapFavoriteDocToVideo = (data: Record<string, unknown>): VideoMarker => {
  const position = Array.isArray(data.position)
    ? [Number(data.position[0] ?? 0), Number(data.position[1] ?? 0)] as [number, number]
    : [0, 0] as [number, number]

  return {
    videoId: String(data.videoId ?? ''),
    title: String(data.title ?? ''),
    thumbnail: String(data.thumbnail ?? ''),
    description: String(data.description ?? ''),
    location: String(data.location ?? 'Unknown'),
    favorited: true,
    position,
  }
}

const bindFavoritesRealtime = (uid: string) => {
  unsubscribeFavorites?.()
  unsubscribeFavorites = onSnapshot(
    collection(db, `users/${uid}/favorites`),
    (snapshot) => {
      favorites.value = snapshot.docs.map((item) => mapFavoriteDocToVideo(item.data()))
    },
    (snapshotError) => {
      error.value = snapshotError.message
    },
  )
}

const initialize = () => {
  if (initialized) {
    return
  }

  initialized = true
  onAuthStateChanged(auth, async (user) => {
    unsubscribeFavorites?.()

    if (!user) {
      favorites.value = []
      return
    }

    bindFavoritesRealtime(user.uid)
  })
}

export function useYoutubeFavorites() {
  initialize()
  const { t } = useI18n()

  const fetchFavorites = async (): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      favorites.value = []
      return
    }

    loading.value = true
    error.value = null

    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/favorites`))
      favorites.value = snapshot.docs.map((item) => mapFavoriteDocToVideo(item.data()))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch favorites.'
    } finally {
      loading.value = false
    }
  }

  const addFavorite = async (video: VideoMarker): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      return
    }

    await addDoc(collection(db, `users/${user.uid}/favorites`), {
      videoId: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail ?? '',
      favorited: true,
      description: video.description ?? '',
      location: video.location ?? '',
      position: video.position,
    })
  }

  const removeFavorite = async (videoId: string): Promise<void> => {
    const user = auth.currentUser
    if (!user) {
      return
    }

    const snapshot = await getDocs(collection(db, `users/${user.uid}/favorites`))
    const favoriteDoc = snapshot.docs.find((item) => item.data().videoId === videoId)
    if (!favoriteDoc) {
      return
    }

    await deleteDoc(doc(db, `users/${user.uid}/favorites`, favoriteDoc.id))
  }

  const toggleFavorite = async (video: VideoMarker): Promise<void> => {
    if (!video) {
      return
    }

    const isFavorite = favorites.value.some((favorite) => favorite.videoId === video.videoId)

    if (!isFavorite) {
      await addFavorite(video)
      video.favorited = true
      toast({
        title: t('toast.added_to_favorites_title'),
        description: t('toast.added_to_favorites_description', { label: video.title }),
      })
      return
    }

    await removeFavorite(video.videoId)
    video.favorited = false
    toast({
      title: t('toast.removed_from_favorites_title'),
      description: t('toast.removed_from_favorites_description', { label: video.title }),
    })
  }

  return {
    favorites,
    loading,
    error,
    fetchFavorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }
}
