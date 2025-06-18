import { auth, db } from './firebase';
import { connectivityState } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Auth connection
    console.log('Auth instance:', auth);
    console.log('Auth config:', auth.config);
    
    // Test Firestore connection
    console.log('Firestore instance:', db);
    
    // Check if we're connected to emulators
    if (auth.config.emulator) {
      console.log('Connected to Auth Emulator:', auth.config.emulator);
    } else {
      console.log('Using production Firebase Auth');
    }
    
    // Test network connectivity
    const unsubscribe = connectivityState(db, (state) => {
      console.log('Firestore connectivity state:', state);
      unsubscribe();
    });
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

// Call this in development to test connection
if (import.meta.env.DEV) {
  testFirebaseConnection();
}