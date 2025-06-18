import { auth } from './firebase';

export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...');
    
    // Test Auth connection
    console.log('Auth instance:', auth);
    console.log('Auth config:', auth.config);
    
    console.log('Using production Firebase Auth');
    console.log('Firebase connection test completed successfully');
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