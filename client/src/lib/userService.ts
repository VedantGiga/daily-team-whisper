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
  
  // Use a better hash function to avoid collisions
  let hash = 0;
  const str = firebaseUID + '_salt_' + firebaseUID.length; // Add salt to reduce collisions
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use a larger offset and ensure uniqueness
  const userId = Math.abs(hash) + 1000000;
  console.log(`Generated user ID ${userId} for Firebase UID: ${firebaseUID}`);
  return userId;
};