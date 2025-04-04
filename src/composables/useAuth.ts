import { ref } from 'vue';
import { 
  sendSignInLinkToEmail, 
  signInWithEmailLink, 
  isSignInWithEmailLink, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../firebase";
import type { User } from "firebase/auth";

const user = ref<User | null>(null);

onAuthStateChanged(auth, (firebaseUser) => {
  user.value = firebaseUser;
  console.log('Auth state changed:', user.value);
});

export function useAuth() {
  const userEmail = ref(localStorage.getItem('emailForSignIn') || '');

  const sendLoginLink = async (email: string) => {
    const actionCodeSettings = {
      url: window.location.href,
      handleCodeInApp: true
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem('emailForSignIn', email);
  };

  const completeSignIn = async () => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      userEmail.value = localStorage.getItem('emailForSignIn') || '';
      if (userEmail.value) {
        const userCredential = await signInWithEmailLink(auth, userEmail.value, window.location.href);
        user.value = userCredential.user;
        localStorage.removeItem('emailForSignIn');
        return user.value;
      }
    }
    return null;
  };

  return { user, sendLoginLink, completeSignIn };
}
