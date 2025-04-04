import { ref, onUnmounted } from 'vue';
import { db } from "../firebase";
import { collection, addDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import type { VideoMarker } from '../types/Map';

const auth = getAuth();

export function useFavorites() {
  const favorites = ref<VideoMarker[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const querySnapshot = await getDocs(collection(db, `users/${user.uid}/favorites`));
      favorites.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VideoMarker[];
    } catch (err) {
      error.value = err as Error;
      console.error("Error fetching favorites:", err);
    }
  };

  const addFavorite = async (video: VideoMarker) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/favorites`), {
        videoId: video.videoId,
        title: video.title,
        thumbnail: video.thumbnail,
        favorited: true,
        description: video.description,
        location: video.location,
        position: video.position
      });

      // Fetch updated favorites after adding a new one
      fetchFavorites();
    } catch (err) {
      error.value = err as Error;
      console.error("Error adding favorite:", err);
    }
  };

  const removeFavorite = async (videoId: string) => {
    const user = auth.currentUser;
    if (!user) return; // Return if no user is authenticated

    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/favorites`));
      const docToDelete = snapshot.docs.find(doc => doc.data().videoId === videoId);

      if (!docToDelete) {
        console.error("No matching favorite found for videoId:", videoId);
        return;
      }

      await deleteDoc(doc(db, `users/${user.uid}/favorites`, docToDelete.id));
      fetchFavorites();
    } catch (err) {
      error.value = err as Error;
      console.error("Error removing favorite:", err);
    }
  };

  // Fetch favorites on component mount
  const unsubscribe = onSnapshot(collection(db, `users/${auth.currentUser?.uid}/favorites`), (snapshot) => {
    favorites.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as VideoMarker[];
  }, (err) => {
    error.value = err;
    console.error("Error fetching favorites:", err);
  });

  onUnmounted(() => {
    unsubscribe();
  });

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    fetchFavorites
  };
}
