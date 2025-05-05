import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Paper, 
  Box, 
  Card, 
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Chip,
  Grid,
  IconButton,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { styled } from '@mui/system';
import Draggable from 'react-draggable';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { Link as RouterLink } from 'react-router-dom';
import documentService from '../../services/documentService';
import loanService from '../../services/loanService';

// Draggable Paper Component for the Dialog
function DraggablePaper(props) {
  return (
    <Draggable
      handle=".draggable-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

// Styled component for the resizable dialog
const ResizableDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    minWidth: '500px',
    minHeight: '400px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    resize: 'both',
    overflow: 'auto',
  },
}));

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loan, setLoan] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [extractionModalOpen, setExtractionModalOpen] = useState(false);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [extractionError, setExtractionError] = useState(null);
  
  // Fetch document data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const documentData = await documentService.getDocument(id);
        setDocument(documentData);
        
        // Also fetch the associated loan
        const loanData = await loanService.getLoan(documentData.loan_id);
        setLoan(loanData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching document:', err);
        setError('Failed to load document data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 40));
  };

  // Handle document extraction
  const handleExtractInformation = async () => {
    setExtractionLoading(true);
    setExtractionError(null);
    setExtractionModalOpen(true);
    
    try {
      // Get analysis results from the LLM API
      const result = await documentService.extractDocumentInfo(id);
      console.log("LLM API Response:", result); // Debug the response
      
      // Ensure extractionResult is properly structured even if response format varies
      const formattedResult = {
        summary: result.summary || result.description || '',
        entities: result.entities || [],
        content: result.content || result.analysis || result.text || JSON.stringify(result, null, 2),
        loan_application: result.loan_application || null
      };
      
      setExtractionResult(formattedResult);
    } catch (err) {
      console.error('Error extracting document information:', err);
      setExtractionError('Failed to extract information from the document. Please try again.');
    } finally {
      setExtractionLoading(false);
    }
  };

  // Close the extraction modal
  const handleCloseExtractionModal = () => {
    setExtractionModalOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading document...</Typography>
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box sx={{ p: 4 }}>
        <Button 
          component={RouterLink} 
          to="/documents" 
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Documents
        </Button>
        <Alert severity="error">
          {error || "Document not found. It may have been deleted or you don't have permission to view it."}
        </Alert>
      </Box>
    );
  }

  // Create a back link that goes to the loan's documents tab if we have loan information
  const backLink = loan ? `/applications/${loan.application_number}?tab=1` : "/documents";
  
  // Function to get document file URL from file path
  const getDocumentUrl = () => {
    // Use the API baseURL to ensure we're hitting the Python backend
    return `http://localhost:8000/api/documents/file/${document.id}`;
  };
  
  // Determine document type from file path
  const getDocumentType = (filePath) => {
    if (!filePath) return 'unknown';
    
    const extension = filePath.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['doc', 'docx'].includes(extension)) return 'word';
    if (['xls', 'xlsx'].includes(extension)) return 'excel';
    return 'other';
  };
  
  const documentType = getDocumentType(document?.file_path);
  const documentUrl = getDocumentUrl(document?.file_path);

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={RouterLink} 
          to={backLink}
          state={extractionResult?.loan_application ? { extractedData: extractionResult } : undefined}
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to {loan ? 'Loan Documents' : 'Documents'}
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {document.name}
        </Typography>
        <Chip 
          label={document.status === 'validated' ? 'Validated' : 
                document.status === 'pending' ? 'Pending Review' : 'Issues Found'} 
          color={document.status === 'validated' ? 'success' : 
                document.status === 'pending' ? 'primary' : 'warning'}
          icon={document.status === 'validated' ? <CheckCircleIcon /> : 
                document.status === 'pending' ? null : <WarningIcon />}
        />
      </Box>

      <div className="document-viewer">
        {/* Document Preview Panel */}
        <div className="document-preview">
          <Paper 
            elevation={1} 
            sx={{ 
              p: 1, 
              mb: 1, 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center' 
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Document Preview
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
              <IconButton size="small" sx={{ ml: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Box>
          </Paper>
          
          {/* Document Preview Content */}
          <Box 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px dashed #ccc',
              borderRadius: 1,
              backgroundColor: '#f9f9f9',
              p: 4,
              transform: `scale(${zoomLevel / 100})`,
              transition: 'transform 0.2s ease'
            }}
          >
            {documentType === 'pdf' ? (
              <object 
                data={documentUrl}
                type="application/pdf"
                width="100%"
                height="600px"
                style={{ border: 'none' }}
              >
                <iframe 
                  src={documentUrl}
                  title={document.name}
                  width="100%"
                  height="600px"
                  style={{ border: 'none' }}
                />
              </object>
            ) : documentType === 'image' ? (
              <img 
                src={documentUrl}
                alt={document.name}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '600px',
                  objectFit: 'contain' 
                }}
              />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <DescriptionIcon sx={{ fontSize: 120, color: 'rgba(25, 118, 210, 0.2)', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {document.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Preview not available for this file type
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Type: {documentType} | File path: {document.file_path}
                </Typography>
                <Button
                  variant="contained"
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mt: 2 }}
                  startIcon={<DownloadIcon />}
                >
                  Download File
                </Button>
              </Box>
            )}
          </Box>
        </div>
        
        {/* Document Info Panel */}
        <div className="document-info">
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={currentTab} 
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Details" />
                <Tab label="History" />
              </Tabs>
            </Box>
            
            {/* Details Tab */}
            {currentTab === 0 && (
              <CardContent sx={{ flex: '1 1 auto', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Document Information
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Document Name</TableCell>
                        <TableCell>{document.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Associated Loan</TableCell>
                        <TableCell>
                          {loan ? (
                            <RouterLink to={`/applications/${loan.application_number}`}>
                              {loan.application_number}
                            </RouterLink>
                          ) : (
                            `ID: ${document.loan_id}`
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Uploaded</TableCell>
                        <TableCell>{new Date(document.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Last Modified</TableCell>
                        <TableCell>{new Date(document.updated_at).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Status</TableCell>
                        <TableCell>
                          <Chip 
                            label={document.status === 'validated' ? 'Validated' : 
                                  document.status === 'pending' ? 'Pending Review' : 'Issues Found'} 
                            color={document.status === 'validated' ? 'success' : 
                                  document.status === 'pending' ? 'primary' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {document.status === 'rejected' && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Issues
                    </Typography>
                    
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      Document has validation issues that need to be addressed.
                    </Alert>
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="error"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                        try {
                          await documentService.deleteDocument(document.id);
                          navigate(backLink);
                        } catch (err) {
                          console.error('Error deleting document:', err);
                          setError('Failed to delete document. Please try again.');
                        }
                      }
                    }}
                  >
                    Delete Document
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<AnalyticsIcon />}
                    onClick={handleExtractInformation}
                  >
                    Extract Information
                  </Button>
                </Box>
              </CardContent>
            )}
            
            {/* History Tab */}
            {currentTab === 1 && (
              <CardContent sx={{ flex: '1 1 auto', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  Processing History
                </Typography>
                
                <Box sx={{ position: 'relative' }}>
                  {/* We don't have real document history in the API yet, so show some placeholder items */}
                  {[
                    {action: 'Document Uploaded', timestamp: document.created_at, user: 'System'},
                    {action: 'Processing Started', timestamp: new Date(new Date(document.created_at).getTime() + 5000), user: 'System'},
                    {action: 'Validation Pending', timestamp: new Date(new Date(document.created_at).getTime() + 30000), user: 'System'},
                    {action: document.status === 'validated' ? 'Document Validated' : 'Issues Identified', 
                     timestamp: document.updated_at, 
                     user: 'System'}
                  ].map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        mb: 2,
                        pb: 2,
                        borderBottom: index === 3 ? 'none' : '1px dashed #e0e0e0'
                      }}
                    >
                      <Box sx={{ 
                        minWidth: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        bgcolor: 'primary.main',
                        mt: 1,
                        mr: 2
                      }} />
                      <Box>
                        <Typography variant="body1">
                          {item.action}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(item.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.user}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Information Extraction Modal */}
      <ResizableDialog
        open={extractionModalOpen}
        onClose={handleCloseExtractionModal}
        aria-labelledby="extraction-dialog-title"
        aria-describedby="extraction-dialog-description"
        PaperComponent={DraggablePaper}
      >
        <DialogTitle 
          id="extraction-dialog-title" 
          className="draggable-dialog-title"
          sx={{ 
            cursor: 'move',
            paddingBottom: 1
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="h6">Document Analysis Results</Typography>
            </Box>
            <IconButton edge="end" color="inherit" onClick={handleCloseExtractionModal} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {extractionLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Analyzing document with AI... This may take a few moments.
              </Typography>
            </Box>
          ) : extractionResult ? (
            <Box sx={{ overflow: 'auto' }}>
              {extractionResult.summary && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Summary</Typography>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {extractionResult.summary}
                  </Alert>
                </Box>
              )}
              
              {/* Display loan application data if available */}
              {extractionResult.loan_application && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Loan Application Details
                  </Typography>
                  
                  <Grid container spacing={3}>
                    {/* Borrower Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Borrower Information
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                {extractionResult.loan_application.borrowers && 
                                 extractionResult.loan_application.borrowers.length > 0 && 
                                 extractionResult.loan_application.borrowers.filter(b => !b.is_co_borrower).map((borrower, idx) => (
                                  <React.Fragment key={idx}>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Full Name</TableCell>
                                      <TableCell>{borrower.full_name || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Phone</TableCell>
                                      <TableCell>{borrower.phone || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Email</TableCell>
                                      <TableCell>{borrower.email || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Credit Score</TableCell>
                                      <TableCell>{borrower.credit_score || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Annual Income</TableCell>
                                      <TableCell>
                                        {borrower.annual_income 
                                          ? `$${Number(borrower.annual_income).toLocaleString('en-US', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}` 
                                          : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Employment Status</TableCell>
                                      <TableCell>{borrower.employment_status || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Employer</TableCell>
                                      <TableCell>{borrower.employer || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Years at Current Job</TableCell>
                                      <TableCell>{borrower.years_at_job || 'N/A'}</TableCell>
                                    </TableRow>
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Co-Borrower Information (if exists) */}
                    <Grid item xs={12} md={6}>
                      {extractionResult.loan_application.borrowers && 
                       extractionResult.loan_application.borrowers.filter(b => b.is_co_borrower).length > 0 && (
                        <Card variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Co-Borrower Information
                            </Typography>
                            <TableContainer>
                              <Table size="small">
                                <TableBody>
                                  {extractionResult.loan_application.borrowers.filter(b => b.is_co_borrower).map((coBorrower, idx) => (
                                    <React.Fragment key={idx}>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Full Name</TableCell>
                                        <TableCell>{coBorrower.full_name || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Phone</TableCell>
                                        <TableCell>{coBorrower.phone || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Email</TableCell>
                                        <TableCell>{coBorrower.email || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Credit Score</TableCell>
                                        <TableCell>{coBorrower.credit_score || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Annual Income</TableCell>
                                        <TableCell>
                                          {coBorrower.annual_income 
                                            ? `$${Number(coBorrower.annual_income).toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                              })}` 
                                            : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Employment Status</TableCell>
                                        <TableCell>{coBorrower.employment_status || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Employer</TableCell>
                                        <TableCell>{coBorrower.employer || 'N/A'}</TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell component="th" scope="row">Years at Current Job</TableCell>
                                        <TableCell>{coBorrower.years_at_job || 'N/A'}</TableCell>
                                      </TableRow>
                                    </React.Fragment>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </CardContent>
                        </Card>
                      )}
                    </Grid>
                    
                    {/* Loan Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Loan Information
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                <TableRow>
                                  <TableCell component="th" scope="row">Loan Type</TableCell>
                                  <TableCell>{extractionResult.loan_application.loan_type || 'Vehicle Loan'}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Loan Amount</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.loan_amount
                                      ? `$${Number(extractionResult.loan_application.loan_amount).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Term</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.loan_term_months
                                      ? `${Math.round(extractionResult.loan_application.loan_term_months / 12)} years`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Interest Rate</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.interest_rate
                                      ? `${extractionResult.loan_application.interest_rate}%`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Monthly Payment</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.monthly_payment
                                      ? `$${Number(extractionResult.loan_application.monthly_payment).toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2
                                        })}`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Down Payment</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.down_payment
                                      ? `$${Number(extractionResult.loan_application.down_payment).toLocaleString('en-US')}`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Loan-to-Value Ratio</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.ltv_ratio
                                      ? `${extractionResult.loan_application.ltv_ratio}%`
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Application Date</TableCell>
                                  <TableCell>
                                    {extractionResult.loan_application.application_date
                                      ? new Date(extractionResult.loan_application.application_date).toLocaleDateString()
                                      : 'N/A'}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell component="th" scope="row">Status</TableCell>
                                  <TableCell>
                                    <Chip
                                      label={extractionResult.loan_application.status || 'Pending Review'}
                                      color={
                                        extractionResult.loan_application.status === 'approved' ? 'success' :
                                        extractionResult.loan_application.status === 'rejected' ? 'error' : 'primary'
                                      }
                                      size="small"
                                    />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                    
                    {/* Vehicle Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Vehicle Information
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableBody>
                                {extractionResult.loan_application.vehicle_details ? (
                                  <>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Make</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.make || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Model</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.model || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Year</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.year || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">VIN</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.vin || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Color</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.color || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Mileage</TableCell>
                                      <TableCell>
                                        {extractionResult.loan_application.vehicle_details.mileage
                                          ? `${Number(extractionResult.loan_application.vehicle_details.mileage).toLocaleString()} miles`
                                          : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Condition</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_details.condition || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Vehicle Value</TableCell>
                                      <TableCell>
                                        {extractionResult.loan_application.vehicle_details.vehicle_value
                                          ? `$${Number(extractionResult.loan_application.vehicle_details.vehicle_value).toLocaleString('en-US', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}`
                                          : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  </>
                                ) : (
                                  <>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Make</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_make || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Model</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_model || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Year</TableCell>
                                      <TableCell>{extractionResult.loan_application.vehicle_year || 'N/A'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell component="th" scope="row">Vehicle Value</TableCell>
                                      <TableCell>
                                        {extractionResult.loan_application.vehicle_price
                                          ? `$${Number(extractionResult.loan_application.vehicle_price).toLocaleString('en-US', {
                                              minimumFractionDigits: 2,
                                              maximumFractionDigits: 2
                                            })}`
                                          : 'N/A'}
                                      </TableCell>
                                    </TableRow>
                                  </>
                                )}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}
              
              {/* Display extracted entities */}
              {extractionResult.entities && extractionResult.entities.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Extracted Entities</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Entity</strong></TableCell>
                          <TableCell><strong>Value</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {extractionResult.entities.map((entity, index) => (
                          <TableRow key={index}>
                            <TableCell>{entity.label || entity.type}</TableCell>
                            <TableCell>{entity.value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
              
              {/* Display full analysis content */}
              {extractionResult.content && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Full Analysis</Typography>
                  <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
                    {extractionResult.content}
                  </Paper>
                </Box>
              )}

              {/* Fallback if the response doesn't match expected format */}
              {!extractionResult.summary && !extractionResult.content && !extractionResult.loan_application && 
               extractionResult.entities?.length === 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Raw Response</Typography>
                  <Paper variant="outlined" sx={{ p: 2, whiteSpace: 'pre-wrap', maxHeight: '400px', overflow: 'auto' }}>
                    {typeof extractionResult === 'object' 
                      ? JSON.stringify(extractionResult, null, 2)
                      : String(extractionResult)}
                  </Paper>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>No analysis results available. Try extracting information again.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExtractionModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </ResizableDialog>
    </div>
  );
};

export default DocumentViewer;