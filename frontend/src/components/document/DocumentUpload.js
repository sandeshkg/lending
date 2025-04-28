import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  Card, 
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CloseIcon from '@mui/icons-material/Close';
import documentService from '../../services/documentService';
import loanService from '../../services/loanService';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loanId = searchParams.get('loanId');

  const [files, setFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loan, setLoan] = useState(null);
  const [error, setError] = useState(null);
  
  // Document preview states
  const [previewFile, setPreviewFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  
  const steps = ['Select Documents', 'Process & Validate', 'Review Results'];
  
  // Fetch loan information if loanId is provided
  useEffect(() => {
    const fetchLoanData = async () => {
      if (loanId) {
        try {
          const data = await loanService.getLoan(loanId);
          setLoan(data);
          
          // Also fetch existing documents for this loan
          const documents = await documentService.getDocuments(loanId);
          setUploadedDocs(documents);
        } catch (err) {
          console.error('Error fetching loan data:', err);
          setError('Error loading loan information. Please try again.');
        }
      }
    };
    
    fetchLoanData();
  }, [loanId]);

  // Rest of existing drag and drop handlers
  // ...existing code...
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      status: 'ready',
      documentType: ''
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const removeFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDocumentTypeChange = (index, value) => {
    setFiles(prevFiles => 
      prevFiles.map((file, i) => 
        i === index ? { ...file, documentType: value } : file
      )
    );
  };

  const processDocuments = async () => {
    if (!loanId) {
      setError('No loan ID provided. Cannot upload documents.');
      return;
    }

    setProcessing(true);
    const uploadResults = [];
    
    try {
      // Upload each file to the API
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip files that don't have a document type assigned
        if (!file.documentType) continue;
        
        // Store document in database and file system
        const result = await documentService.uploadDocument(
          loanId,
          file.documentType,
          file.file
        );
        
        uploadResults.push(result);
        
        // Update status
        setFiles(prevFiles => 
          prevFiles.map((f, index) => 
            index === i ? { ...f, status: 'validated', dbId: result.id } : f
          )
        );
      }
      
      // Add newly uploaded documents to the list
      setUploadedDocs(prev => [...prev, ...uploadResults]);
      
      setActiveStep(1);
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError('Failed to upload one or more documents. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
  
  const handleReview = () => {
    setActiveStep(2);
    setTimeout(() => {
      setCompleted(true);
      
      // Redirect to loan details if we have a loanId
      if (loanId) {
        setTimeout(() => {
          navigate(`/applications/${loan.application_number}?tab=1`);
        }, 2000);
      }
    }, 1500);
  };

  const getFileStatusChip = (status) => {
    switch (status) {
      case 'ready':
        return <Chip label="Ready" size="small" color="primary" variant="outlined" />;
      case 'validated':
        return <Chip label="Validated" size="small" color="success" icon={<CheckCircleIcon />} />;
      case 'issues':
        return <Chip label="Issues Found" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" color="default" />;
    }
  };

  // Document types we accept for loans
  const documentTypes = [
    'W-2 Forms', 
    'Tax Returns',
    'Bank Statements',
    'Pay Stubs',
    'Credit Reports',
    'Property Deed',
    'Proof of Insurance',
    'Driver License',
    'Vehicle Title',
    'Sale Contract'
  ];

  // Document preview handlers
  const openPreview = (file) => {
    setPreviewFile(file);
    setPreviewOpen(true);
    setZoomLevel(100); // Reset zoom level
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
  };

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 40));
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Upload Loan Documents
      </Typography>
      
      {loan && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Uploading documents for loan application: <strong>{loan.application_number}</strong>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Document Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={closePreview}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Document Preview: {previewFile?.name}
            </Typography>
            <Box>
              <IconButton onClick={zoomOut} size="small">
                <ZoomOutIcon />
              </IconButton>
              <Typography variant="body2" component="span" sx={{ mx: 1 }}>
                {zoomLevel}%
              </Typography>
              <IconButton onClick={zoomIn} size="small">
                <ZoomInIcon />
              </IconButton>
              <IconButton onClick={closePreview} size="small" sx={{ ml: 1 }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {previewFile && (
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                transform: `scale(${zoomLevel / 100})`,
                transition: 'transform 0.2s ease'
              }}
            >
              {previewFile.file ? (
                previewFile.type.includes('image') ? (
                  <img 
                    src={URL.createObjectURL(previewFile.file)} 
                    alt={previewFile.name} 
                    style={{ maxWidth: '100%', maxHeight: '100%' }} 
                  />
                ) : previewFile.type === 'application/pdf' ? (
                  <iframe 
                    src={URL.createObjectURL(previewFile.file)} 
                    title={previewFile.name}
                    width="100%"
                    height="500px"
                    style={{ border: 'none' }}
                  />
                ) : (
                  <Box 
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      border: '1px dashed #ccc',
                      borderRadius: 1,
                      backgroundColor: '#f9f9f9',
                      p: 4
                    }}
                  >
                    <InsertDriveFileIcon sx={{ fontSize: 120, color: 'rgba(25, 118, 210, 0.2)', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {previewFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Preview not available for this file type
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      File type: {previewFile.type || 'Unknown'}
                    </Typography>
                  </Box>
                )
              ) : (
                <Typography variant="body1" color="text.secondary">
                  File preview not available
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Stepper */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
      
      <div className="upload-container">
        {/* Already uploaded documents section */}
        {uploadedDocs.length > 0 && activeStep === 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Existing Documents ({uploadedDocs.length})
              </Typography>
              <List>
                {uploadedDocs.map((doc) => (
                  <ListItem key={doc.id}>
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={doc.name} 
                      secondary={`Uploaded: ${new Date(doc.created_at).toLocaleDateString()}`} 
                    />
                    <Chip 
                      label={doc.status} 
                      color={doc.status === 'pending' ? 'warning' : 
                             doc.status === 'approved' ? 'success' : 'error'} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        )}
        
        {/* Upload success message */}
        {completed && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Documents processed successfully! Your loan application is now under review.
            {loanId && <Box mt={1}>You will be redirected to the loan details page shortly.</Box>}
          </Alert>
        )}
        
        {/* Step 1: Upload Area */}
        {activeStep === 0 && (
          <>
            {/* Document types information */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Required Documents for Loan Processing
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Please upload the following documents to process your loan application:
                </Typography>
                <Grid container spacing={1}>
                  {documentTypes.map((docType, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Chip 
                        label={docType} 
                        variant="outlined" 
                        sx={{ mb: 1 }} 
                        icon={<InsertDriveFileIcon />}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
            
            {/* Drag and Drop Area */}
            <div
              className={`drop-zone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <input
                id="file-upload-input"
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileInput}
              />
              <CloudUploadIcon sx={{ fontSize: 64, color: '#1976d2', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drag and drop files here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                or click to browse your files
              </Typography>
            </div>
            
            {/* File List */}
            {files.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Selected Files ({files.length})
                  </Typography>
                  <List>
                    {files.map((file, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <Box>
                            <IconButton 
                              edge="end" 
                              onClick={() => openPreview(file)}
                              color="primary"
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                            <Button 
                              edge="end" 
                              onClick={() => removeFile(index)}
                              startIcon={<DeleteIcon />}
                              color="error"
                              size="small"
                            >
                              Remove
                            </Button>
                          </Box>
                        }
                      >
                        <ListItemIcon>
                          <InsertDriveFileIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.name} 
                          secondary={
                            <>
                              {formatFileSize(file.size)}
                              <TextField
                                select
                                label="Document Type"
                                value={file.documentType}
                                onChange={(e) => handleDocumentTypeChange(index, e.target.value)}
                                size="small"
                                sx={{ ml: 2, minWidth: 150 }}
                                SelectProps={{
                                  native: true,
                                }}
                              >
                                <option value=""></option>
                                {documentTypes.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </TextField>
                            </>
                          } 
                        />
                        {getFileStatusChip(file.status)}
                      </ListItem>
                    ))}
                  </List>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      onClick={processDocuments}
                      disabled={files.length === 0 || processing || !loanId || !files.some(f => f.documentType)}
                      startIcon={processing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    >
                      {processing ? 'Processing...' : 'Upload Documents'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </>
        )}
        
        {/* Step 2: Processing Results */}
        {activeStep === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Processing Results
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your documents have been uploaded and stored in the database. Please review the results:
              </Typography>
              
              <List>
                {files.filter(f => f.dbId).map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`Identified as: ${file.documentType} | Document ID: ${file.dbId}`} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      <IconButton 
                        onClick={() => openPreview(file)}
                        color="primary"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      {getFileStatusChip(file.status)}
                    </Box>
                  </ListItem>
                ))}
              </List>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  onClick={handleReview}
                >
                  Submit for Review
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
        
        {/* Step 3: Final Review */}
        {activeStep === 2 && (
          <Card sx={{ textAlign: 'center', p: 3 }}>
            <CircularProgress sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Finalizing Your Documents
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we process your documents and update your loan application...
            </Typography>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;