import api from './api';

const loanService = {
  // Get all loan applications with optional filtering
  getAllLoans: async (status = null, search = null, skip = 0, limit = 100) => {
    try {
      let url = `/loans/?skip=${skip}&limit=${limit}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a specific loan application details
  getLoan: async (applicationId) => {
    try {
      const response = await api.get(`/loans/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create a new loan application
  createLoan: async (loanData) => {
    try {
      const response = await api.post('/loans/', loanData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update a loan application
  updateLoan: async (applicationId, loanData) => {
    try {
      const response = await api.put(`/loans/${applicationId}`, loanData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update just the status of a loan application
  updateLoanStatus: async (applicationId, status) => {
    try {
      const response = await api.patch(`/loans/${applicationId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Add a note to a loan application
  addNote: async (applicationId, noteData) => {
    try {
      const response = await api.post(`/loans/${applicationId}/notes`, noteData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Add a timeline event to a loan application
  addTimelineEvent: async (applicationId, eventData) => {
    try {
      const response = await api.post(`/loans/${applicationId}/timeline`, eventData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a loan's borrowers (primary and co-borrowers)
  getLoanBorrowers: async (loanId) => {
    try {
      const response = await api.get(`/loans/${loanId}/borrowers`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get a loan's vehicle details
  getVehicleDetails: async (loanId) => {
    try {
      const response = await api.get(`/loans/${loanId}/vehicle`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default loanService;