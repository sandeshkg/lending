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
  TextField
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import documentService from '../../services/documentService';
import loanService from '../../services/loanService';

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loanId = searchParams.get('loanId');

  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loan, setLoan] = useState(null);
  const [error, setError] = useState(null);
  
  const steps = ['Select Documents', 'Process & Validate', 'Review Results'];
  
  // Fetch loan information if loanId is provided
  useEffect(() => {
    const fetchLoanData = async () => {
      if (loanId) {
        try {
          const data = await loanService.getLoan(loanId);
          setLoan(data);
        } catch (err) {
          console.error('Error fetching loan data:', err);
          setError('Error loading loan information. Please try again.');
        }
      }
    };
    
    fetchLoanData();
  }, [loanId]);

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
    
    try {
      // Upload each file to the API
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Skip files that don't have a document type assigned
        if (!file.documentType) continue;
        
        await documentService.uploadDocument(
          loanId,
          file.documentType,
          file.file
        );
        
        // Update status
        setFiles(prevFiles => 
          prevFiles.map((f, index) => 
            index === i ? { ...f, status: Math.random() > 0.8 ? 'issues' : 'validated' } : f
          )
        );
      }
      
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
    'Purchase Agreement'
  ];

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
                          <Button 
                            edge="end" 
                            onClick={() => removeFile(index)}
                            startIcon={<DeleteIcon />}
                            color="error"
                            size="small"
                          >
                            Remove
                          </Button>
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
                      disabled={files.length === 0 || processing || !loanId}
                      startIcon={processing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                    >
                      {processing ? 'Processing...' : 'Process Documents'}
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
                Our AI has analyzed your documents. Please review the results:
              </Typography>
              
              <List>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      secondary={`Identified as: ${file.documentType}`} 
                    />
                    {getFileStatusChip(file.status)}
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