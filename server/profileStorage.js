const fs = require('fs');
const path = require('path');

class ProfileStorage {
  constructor() {
    this.profilesFile = path.join(process.cwd(), 'user-profiles.json');
    this.profiles = this.loadProfiles();
  }

  loadProfiles() {
    try {
      if (fs.existsSync(this.profilesFile)) {
        const data = fs.readFileSync(this.profilesFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
    return {};
  }

  saveProfiles() {
    try {
      fs.writeFileSync(this.profilesFile, JSON.stringify(this.profiles, null, 2));
      console.log('Profiles saved successfully');
    } catch (error) {
      console.error('Error saving profiles:', error);
    }
  }

  getProfile(userId) {
    return this.profiles[userId] || {
      userId,
      displayName: 'User',
      bio: '',
      location: 'India',
      timezone: 'Asia/Kolkata',
      profilePhotoUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  updateProfile(userId, profileData) {
    const existing = this.profiles[userId] || {};
    
    this.profiles[userId] = {
      ...existing,
      userId,
      ...profileData,
      updatedAt: new Date().toISOString(),
      createdAt: existing.createdAt || new Date().toISOString()
    };
    
    this.saveProfiles();
    return this.profiles[userId];
  }
}

module.exports = new ProfileStorage();