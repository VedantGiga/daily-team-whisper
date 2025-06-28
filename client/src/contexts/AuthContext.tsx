import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

// Custom warning toast function
const toastWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#FEF3C7',
      color: '#92400E',
      border: '1px solid #F59E0B',
    },
  });
};

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: any;
  lastLoginAt: any;
  emailVerified: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  integrations: string[];
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const createUserProfile = async (user: User, additionalData: any = {}) => {
    // Create a local profile without Firestore dependency
    const localProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || user.email!.split('@')[0],
      photoURL: user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      emailVerified: user.emailVerified,
      plan: 'free',
      integrations: [],
      ...additionalData
    };
    setUserProfile(localProfile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          await createUserProfile(user);
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setCurrentUser(user);
        if (user) {
          setUserProfile({
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || user.email!.split('@')[0],
            photoURL: user.photoURL || undefined,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            emailVerified: user.emailVerified,
            plan: 'free',
            integrations: []
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(user, { displayName });
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Create user profile
    await createUserProfile(user, { displayName });
    
    toast.success('Account created successfully! Please verify your email.');
  };

  const login = async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(user);
    toast.success('Welcome back!');
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await createUserProfile(result.user);
      toast.success('Welcome!');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      console.error('Google sign-in error:', error);
      toast.error(`Sign-in failed: ${error.message}`);
    }
  };



  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
    toast.success('Signed out successfully');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    toast.success('Password reset email sent!');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser || !userProfile) return;
    
    // Update local profile
    const updatedProfile = { ...userProfile, ...updates };
    setUserProfile(updatedProfile);
    
    // Update Firebase Auth profile if display name changes
    if (updates.displayName && updates.displayName !== currentUser.displayName) {
      await updateProfile(currentUser, { displayName: updates.displayName });
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};