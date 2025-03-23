// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCa445tpILuUrVhvLq6sphi6Kt7aww712Q",
  authDomain: "you-travel-8abc8.firebaseapp.com",
  projectId: "you-travel-8abc8",
  storageBucket: "you-travel-8abc8.firebasestorage.app",
  messagingSenderId: "706872500484",
  appId: "1:706872500484:web:4c9bc65705cc669cbd3051"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database
const db = getFirestore(app);

export { db };