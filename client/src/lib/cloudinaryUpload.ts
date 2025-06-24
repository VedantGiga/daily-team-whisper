// Client-side utility for Cloudinary uploads
export const uploadPhotoToCloudinary = async (file: File, userId: string): Promise<string> => {
  const formData = new FormData();
  formData.append('photo', file);
  
  const response = await fetch(
    `${process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api'}/profile/${userId}/upload-photo`,
    {
      method: 'POST',
      body: formData,
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload photo');
  }
  
  const data = await response.json();
  return data.photoUrl;
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return { isValid: false, error: 'Please select an image smaller than 5MB.' };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'Please select a valid image file.' };
  }

  return { isValid: true };
};

// Create preview URL for immediate feedback
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};