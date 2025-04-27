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
  CircularProgress
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink } from 'react-router-dom';
import documentService from '../../services/documentService';
import loanService from '../../services/loanService';

const DocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loan, setLoan] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // Estimate confidence score based on document status
  const confidenceScore = document.status === 'validated' ? 94 : 
                         document.status === 'pending' ? 80 : 65;

  // Create a back link that goes to the loan's documents tab if we have loan information
  const backLink = loan ? `/applications/${loan.application_number}?tab=1` : "/documents";

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={RouterLink} 
          to={backLink} 
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
          
          {/* This would be replaced by an actual document preview in a production app */}
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
            <DescriptionIcon sx={{ fontSize: 120, color: 'rgba(25, 118, 210, 0.2)', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {document.name} Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              In a real application, the actual document would be displayed here
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              File path: {document.file_path}
            </Typography>
          </Box>
        </div>
        
        {/* Document Info Panel */}
        <div className="document-info">
          <Card sx={{ height: '100%' }}>
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
              <CardContent>
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
                      <TableRow>
                        <TableCell component="th" scope="row">AI Confidence</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={confidenceScore} 
                                color={confidenceScore > 90 ? "success" : confidenceScore > 70 ? "primary" : "warning"}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {`${confidenceScore}%`}
                              </Typography>
                            </Box>
                          </Box>
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

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="outlined" color="error">
                    Delete Document
                  </Button>
                  
                  {document.status !== 'validated' && (
                    <Button 
                      variant="contained" 
                      color="success"
                      onClick={async () => {
                        try {
                          await documentService.updateDocumentStatus(document.id, {
                            status: 'validated'
                          });
                          setDocument(prev => ({...prev, status: 'validated'}));
                        } catch (err) {
                          console.error('Error updating document status:', err);
                        }
                      }}
                    >
                      Validate Document
                    </Button>
                  )}
                </Box>
              </CardContent>
            )}
            
            {/* History Tab */}
            {currentTab === 1 && (
              <CardContent>
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
    </div>
  );
};

export default DocumentViewer;