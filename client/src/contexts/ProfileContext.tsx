import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useUserId } from '@/lib/userService';

interface ProfileData {
  displayName?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  profilePhotoUrl?: string;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfileData: (data: ProfileData) => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider = ({ children }: ProfileProviderProps) => {
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();
  const userId = useUserId(currentUser?.uid);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`/api/profile/${userId}`);
        if (response.ok) {
          const profile = await response.json();
          setProfileData({
            displayName: profile.displayName,
            bio: profile.bio,
            location: profile.location,
            timezone: profile.timezone,
            profilePhotoUrl: profile.profilePhotoUrl
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const updateProfileData = (data: ProfileData) => {
    setProfileData(prev => ({ ...prev, ...data }));
  };

  return (
    <ProfileContext.Provider value={{ profileData, updateProfileData, isLoading }}>
      {children}
    </ProfileContext.Provider>
  );
};