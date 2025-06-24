import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DashboardHeader } from '@/components/DashboardHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useToast } from '@/hooks/use-toast';
import { useUserId } from '@/lib/userService';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Mail, Calendar, MapPin, Edit, Save, X, Camera, Loader2 } from 'lucide-react';

const Profile = () => {
  const { currentUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { updateProfileData } = useProfile();
  const { toast } = useToast();
  const userId = useUserId(currentUser?.uid);
  
  console.log('Profile component - currentUser:', currentUser);
  console.log('Profile component - userId:', userId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: 'India',
    timezone: 'Asia/Kolkata',
    profilePhotoUrl: ''
  });


  // Fetch user profile
  const { data: profile, refetch } = useQuery({
    queryKey: ['/api/profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      console.log('Fetching profile for userId:', userId);
      try {
        const response = await fetch(`/api/profile/${userId}`);
        console.log('Profile fetch response:', response.status, response.statusText);
        if (!response.ok) return null;
        return response.json();
      } catch (error) {
        console.error('Profile fetch error:', error);
        return null;
      }
    },
    enabled: !!userId,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      console.log('Updating profile for userId:', userId, 'with data:', profileData);
      const url = `/api/profile/${userId}`;
      console.log('Update URL:', url);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      console.log('Update response:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (updatedProfile) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setIsEditing(false);
      // Update global profile context
      updateProfileData(updatedProfile);
      // Refetch to ensure consistency
      refetch();
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      let message = "Failed to update profile. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive"
      });
    }
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || currentUser?.displayName || '',
        bio: profile.bio || '',
        location: profile.location || 'India',
        timezone: profile.timezone || 'Asia/Kolkata',
        profilePhotoUrl: profile.profilePhotoUrl || currentUser?.photoURL || ''
      });
    }
  }, [profile]);

  const handleSave = () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found. Please refresh the page.",
        variant: "destructive"
      });
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  // Photo upload mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(
        `/api/profile/${userId}/upload-photo`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      if (!response.ok) {
        let errorMessage = 'Failed to upload photo';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, profilePhotoUrl: data.photoUrl }));
      updateProfileData({ profilePhotoUrl: data.photoUrl });
      refetch();
      toast({
        title: "Photo Updated",
        description: "Your profile photo has been updated successfully.",
      });
    },
    onMutate: () => {
      setIsUploadingPhoto(true);
    },
    onError: (error: any) => {
      console.error('Photo upload error:', error);
      let message = "Failed to upload photo. Please try again.";
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsUploadingPhoto(false);
    }
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file.",
        variant: "destructive"
      });
      return;
    }
    
    // Create preview immediately for smooth UX
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFormData(prev => ({ ...prev, profilePhotoUrl: result }));
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    uploadPhotoMutation.mutate(file);
    
    // Reset file input
    event.target.value = '';
  };

  const handleCancel = () => {
    // Reset to current profile data or defaults
    setFormData({
      displayName: profile?.displayName || currentUser?.displayName || '',
      bio: profile?.bio || '',
      location: profile?.location || 'India',
      timezone: profile?.timezone || 'Asia/Kolkata',
      profilePhotoUrl: profile?.profilePhotoUrl || currentUser?.photoURL || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <DashboardHeader onThemeToggle={toggleTheme} isDarkMode={isDarkMode} />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={formData.profilePhotoUrl || currentUser?.photoURL || ''} />
                  <AvatarFallback className="text-2xl">
                    {formData.displayName?.charAt(0) || currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {/* Loading overlay when uploading */}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                {isEditing && (
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </div>
              <CardTitle className="text-xl">{formData.displayName || currentUser?.displayName || 'User'}</CardTitle>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              <Badge variant="secondary" className="mt-2">Free Plan</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{formData.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="City, Country"
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background rounded-md text-sm disabled:opacity-50"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Account Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">3</div>
                <div className="text-sm text-muted-foreground">Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">127</div>
                <div className="text-sm text-muted-foreground">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">15</div>
                <div className="text-sm text-muted-foreground">Summaries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">7</div>
                <div className="text-sm text-muted-foreground">Days Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;