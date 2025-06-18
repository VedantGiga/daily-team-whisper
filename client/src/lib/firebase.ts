import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

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
export const db = getFirestore(app);
export const functions = getFunctions(app);

// Enable network for Firestore
enableNetwork(db).catch((error) => {
  console.warn('Failed to enable Firestore network:', error);
});

// Connect to emulators in development (only if explicitly enabled)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // Only connect if not already connected
    if (!auth.config.emulator) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      console.log("Connected to Firebase Auth Emulator");
    }
    
    // Check if Firestore emulator is not already connected
    if (!(db as any)._delegate._databaseId.projectId.includes('localhost')) {
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log("Connected to Firestore Emulator");
    }
    
    // Check if Functions emulator is not already connected
    if (!functions.customDomain) {
      connectFunctionsEmulator(functions, "localhost", 5001);
      console.log("Connected to Functions Emulator");
    }
  } catch (error) {
    console.warn("Firebase emulators not available:", error);
  }
}

export default app;