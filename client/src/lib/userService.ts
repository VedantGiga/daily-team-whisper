const API_BASE = "/api";

export class UserService {
  // Get or create database user ID from Firebase UID
  static async getUserIdFromFirebaseUID(firebaseUID: string): Promise<number> {
    const response = await fetch(`${API_BASE}/users/firebase/${firebaseUID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error("Failed to get user ID");
    }
    
    const data = await response.json();
    return data.userId;
  }

  // Create a new user in the database
  static async createUser(userData: {
    firebaseUID: string;
    email: string;
    username: string;
  }): Promise<number> {
    const response = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create user");
    }
    
    const data = await response.json();
    return data.userId;
  }
}

// Hook to get current user's database ID
export const useUserId = (firebaseUID?: string): number | null => {
  if (!firebaseUID) return null;
  
  // For now, we'll use a simple hash-based approach to generate consistent IDs
  // In production, this should be replaced with proper database lookup
  let hash = 0;
  for (let i = 0; i < firebaseUID.length; i++) {
    const char = firebaseUID.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Ensure positive number and add offset to avoid ID 0
  return Math.abs(hash) + 1000;
};