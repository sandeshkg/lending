import api from './api';

const documentService = {
  // Get all documents for a specific loan
  getDocuments: async (loanId) => {
    try {
      const response = await api.get(`/documents/${loanId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Upload a document for a specific loan
  uploadDocument: async (loanId, name, file) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', name);
      formData.append('file', file);
      
      const response = await api.post(`/documents/${loanId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data; // Returns document details stored in DB (id, loan_id, name, file_path, status)
    } catch (error) {
      throw error;
    }
  },
  
  // Update document status
  updateDocumentStatus: async (documentId, updateData) => {
    try {
      const response = await api.put(`/documents/${documentId}`, updateData);
      return response.data; // Returns updated document details from DB
    } catch (error) {
      throw error;
    }
  },
  
  // Get a single document by ID
  getDocument: async (documentId) => {
    try {
      const response = await api.get(`/documents/detail/${documentId}`);
      return response.data; // Returns document details from DB including id, loan_id, name, file_path, status
    } catch (error) {
      throw error;
    }
  },
  
  // Delete a document by ID
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data; // Backend already handles both DB record and file system deletion
    } catch (error) {
      throw error;
    }
  }
};

export default documentService;