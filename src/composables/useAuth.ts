import { ref } from 'vue';
import { getAuth, sendSignInLinkToEmail, signInWithEmailLink, isSignInWithEmailLink } from "firebase/auth";

const auth = getAuth();

export function useAuth() {
  const userEmail = ref(localStorage.getItem('emailForSignIn') || '');
  const user = ref(auth.currentUser);

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
      }
    }
  };

  return { user, sendLoginLink, completeSignIn };
}
