import api from './api';

const userService = {
  // Get user profile
  getUserProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user settings
  updateUserSettings: async (settings) => {
    try {
      const response = await api.patch('/users/settings', settings);
      
      // Update local storage with new user data
      if (response.data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update lending authority level
  updateLendingAuthorityLevel: async (level) => {
    try {
      const response = await api.patch('/users/authority-level', { lending_authority_level: level });
      
      // Update local storage with new user data
      if (response.data) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = { ...currentUser, lending_authority_level: response.data.lending_authority_level };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default userService;