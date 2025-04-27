import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link } from 'react-router-dom';

// Mock document data for demonstration
const mockDocumentData = {
  id: 'doc123',
  name: 'W-2 Tax Form - 2023',
  status: 'validated',
  uploadDate: '2023-04-15T14:32:45Z',
  lastModified: '2023-04-15T15:10:23Z',
  documentType: 'W-2 Form',
  confidence: 94,
  preview: '/placeholder-document.jpg', // We would have a real preview in a production app
  extractedData: [
    { field: 'Employee Name', value: 'John Smith', confidence: 98 },
    { field: 'Employee SSN', value: '***-**-1234', confidence: 97 },
    { field: 'Employer EIN', value: '12-3456789', confidence: 99 },
    { field: 'Wages, tips, other comp', value: '$75,250.00', confidence: 95 },
    { field: 'Federal tax withheld', value: '$12,837.50', confidence: 94 },
    { field: 'Social Security tax withheld', value: '$4,665.50', confidence: 92 },
    { field: 'Medicare tax withheld', value: '$1,091.13', confidence: 91 },
  ],
  issues: [
    { type: 'warning', message: 'Box 12b appears to be empty but is typically required' },
  ],
  history: [
    { action: 'Document Uploaded', timestamp: '2023-04-15T14:32:45Z', user: 'John Smith' },
    { action: 'AI Processing Started', timestamp: '2023-04-15T14:32:50Z', user: 'System' },
    { action: 'AI Processing Completed', timestamp: '2023-04-15T14:33:15Z', user: 'System' },
    { action: 'Validation Check', timestamp: '2023-04-15T15:10:23Z', user: 'System' },
  ]
};

const DocumentViewer = () => {
  const { id } = useParams();
  const [currentTab, setCurrentTab] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const document = mockDocumentData; // In a real app, you'd fetch the document based on id
  
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };
  
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 20, 200));
  };
  
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 20, 40));
  };

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/documents" 
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Documents
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          {document.name}
        </Typography>
        <Chip 
          label={document.status === 'validated' ? 'Validated' : 'Issues Found'} 
          color={document.status === 'validated' ? 'success' : 'warning'}
          icon={document.status === 'validated' ? <CheckCircleIcon /> : <WarningIcon />}
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
              W-2 Tax Form Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              In a real application, the actual document would be displayed here
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
                <Tab label="Extracted Data" />
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
                        <TableCell component="th" scope="row">Type</TableCell>
                        <TableCell>{document.documentType}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Uploaded</TableCell>
                        <TableCell>{new Date(document.uploadDate).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Last Modified</TableCell>
                        <TableCell>{new Date(document.lastModified).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Status</TableCell>
                        <TableCell>
                          {document.status === 'validated' ? 'Validated' : 'Issues Found'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">AI Confidence</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={document.confidence} 
                                color={document.confidence > 90 ? "success" : document.confidence > 70 ? "primary" : "warning"}
                              />
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {`${document.confidence}%`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {document.issues && document.issues.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Issues
                    </Typography>
                    
                    {document.issues.map((issue, index) => (
                      <Alert 
                        key={index} 
                        severity={issue.type} 
                        sx={{ mb: 1 }}
                      >
                        {issue.message}
                      </Alert>
                    ))}
                  </Box>
                )}
              </CardContent>
            )}
            
            {/* Extracted Data Tab */}
            {currentTab === 1 && (
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Extracted Information
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Data extracted from document by AI:
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Field</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell align="right">Confidence</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {document.extractedData.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {row.field}
                          </TableCell>
                          <TableCell>{row.value}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${row.confidence}%`}
                              size="small"
                              color={row.confidence > 95 ? "success" : row.confidence > 85 ? "primary" : "warning"}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            )}
            
            {/* History Tab */}
            {currentTab === 2 && (
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Processing History
                </Typography>
                
                <Box sx={{ position: 'relative' }}>
                  {document.history.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        mb: 2,
                        pb: 2,
                        borderBottom: index === document.history.length - 1 ? 'none' : '1px dashed #e0e0e0'
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