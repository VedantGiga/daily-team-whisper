import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCqdc8qN-F_5na8OxYozNU_T0LDvPoYu80",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "autobrief-e6e9b.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "autobrief-e6e9b",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "autobrief-e6e9b.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "895049074715",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:895049074715:web:d3780f9e56731a6dd8d0be",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-D4Y2JPHQQP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

// Connect to emulators in development (only if explicitly enabled)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    console.log("Connected to Firebase Auth Emulator");
  } catch (error) {
    console.warn("Firebase Auth emulator not available:", error);
  }
}

export default app;