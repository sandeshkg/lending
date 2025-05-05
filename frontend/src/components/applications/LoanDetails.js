import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Divider,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  Tooltip,
  Dialog,
  DialogContent
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/lab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import loanService from '../../services/loanService';
import documentService from '../../services/documentService';
import VarianceReview from './validation/VarianceReview';

const LoanDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newNote, setNewNote] = useState({ author: '', content: '' });
  const [submittingNote, setSubmittingNote] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showVarianceReview, setShowVarianceReview] = useState(false);
  const [validationRules, setValidationRules] = useState({});
  const [validatingApplication, setValidatingApplication] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Fetch loan details from API
  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching loan with ID:', id);
        const loanData = await loanService.getLoan(id);
        console.log('Loan data received:', loanData);
        
        // Ensure borrowers array exists
        if (!loanData.borrowers) {
          loanData.borrowers = [];
        }
        
        // Ensure vehicle_details exists
        if (!loanData.vehicle_details) {
          loanData.vehicle_details = {};
        }
        
        // Ensure notes array exists
        if (!loanData.notes) {
          loanData.notes = [];
        }
        
        // Ensure timeline array exists
        if (!loanData.timeline) {
          loanData.timeline = [];
        }
        
        setLoan(loanData);
        
        // Fetch documents for this loan
        try {
          const docsData = await documentService.getDocuments(loanData.id);
          setDocuments(docsData);
        } catch (docError) {
          console.error('Error fetching documents:', docError);
          // Don't fail the entire load if documents can't be fetched
          setDocuments([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching loan details:', err);
        setError('Failed to load loan details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [id]);

  // Check if there's document analysis data in the location state
  useEffect(() => {
    if (location.state?.extractedData?.loan_application) {
      setExtractedData(location.state.extractedData.loan_application);
      
      // If we came back with document data, automatically show the application details tab
      setCurrentTab(0);
    }
  }, [location.state]);

  // Load validation rules from localStorage
  useEffect(() => {
    const savedRules = localStorage.getItem('validationRules');
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules);
        setValidationRules(parsedRules);
        console.log('Loaded validation rules:', parsedRules);
      } catch (error) {
        console.error('Error parsing validation rules:', error);
        // Set default rules
        setDefaultValidationRules();
      }
    } else {
      // Set default rules if none found in localStorage
      setDefaultValidationRules();
    }
  }, []);
  
  // Set default validation rules
  const setDefaultValidationRules = () => {
    const defaultRules = {
      default_currency: {
        warning_percentage: 10,
        critical_percentage: 20,
        warning_absolute: 1000,
        critical_absolute: 5000,
        mismatch_severity: 'warning'
      },
      default_percentage: {
        warning_percentage: 5,
        critical_percentage: 15,
        warning_absolute: 1,
        critical_absolute: 3,
        mismatch_severity: 'warning'
      },
      default_number: {
        warning_percentage: 10,
        critical_percentage: 25,
        warning_absolute: 10,
        critical_absolute: 50,
        mismatch_severity: 'warning'
      },
      default_text: {
        mismatch_severity: 'info'
      },
      // Critical fields
      full_name: {
        mismatch_severity: 'critical',
        block_progress: true
      },
      borrower_full_name: {
        mismatch_severity: 'critical',
        block_progress: true
      },
      loan_amount: {
        warning_percentage: 5,
        critical_percentage: 10,
        warning_absolute: 500,
        critical_absolute: 2000,
        mismatch_severity: 'critical'
      },
      interest_rate: {
        warning_percentage: 5,
        critical_percentage: 10,
        warning_absolute: 0.5,
        critical_absolute: 1,
        mismatch_severity: 'critical'
      }
    };
    
    setValidationRules(defaultRules);
    console.log('Set default validation rules:', defaultRules);
  };

  // Reusable function to determine if a field has a discrepancy with extracted data
  const getDiscrepancyInfo = (fieldType, fieldName, originalValue, parentField = null) => {
    if (!extractedData) return null;
    
    let extractedValue;
    
    // Handle nested fields for borrowers and vehicle details
    if (parentField === 'borrower' && extractedData.borrowers && extractedData.borrowers.length > 0) {
      // Get the primary borrower
      const primaryBorrower = extractedData.borrowers.find(b => !b.is_co_borrower);
      if (primaryBorrower && primaryBorrower[fieldName] !== undefined) {
        extractedValue = primaryBorrower[fieldName];
      }
    } else if (parentField === 'coBorrower' && extractedData.borrowers && extractedData.borrowers.length > 1) {
      // Get the co-borrower
      const coBorrower = extractedData.borrowers.find(b => b.is_co_borrower);
      if (coBorrower && coBorrower[fieldName] !== undefined) {
        extractedValue = coBorrower[fieldName];
      }
    } else if (parentField === 'vehicle' && extractedData.vehicle_details) {
      extractedValue = extractedData.vehicle_details[fieldName];
    } else if (fieldName === 'vehicle_make') {
      extractedValue = extractedData.vehicle_details?.make || extractedData.vehicle_make;
    } else if (fieldName === 'vehicle_model') {
      extractedValue = extractedData.vehicle_details?.model || extractedData.vehicle_model;
    } else if (fieldName === 'vehicle_year') {
      extractedValue = extractedData.vehicle_details?.year || extractedData.vehicle_year;
    } else {
      extractedValue = extractedData[fieldName];
    }
    
    // For some fields we need special comparison logic
    let hasDiscrepancy = false;
    
    if (extractedValue !== undefined && extractedValue !== null) {
      if (fieldType === 'currency') {
        // Convert both to numbers for comparison and ignore formatting differences
        const origValue = typeof originalValue === 'number' ? originalValue : parseFloat(String(originalValue).replace(/[^0-9.-]+/g, ''));
        const extValue = typeof extractedValue === 'number' ? extractedValue : parseFloat(String(extractedValue).replace(/[^0-9.-]+/g, ''));
        hasDiscrepancy = Math.abs(origValue - extValue) > 1; // Allow for minor rounding differences
      } else if (fieldType === 'percentage') {
        // Convert both to numbers for comparison
        const origValue = typeof originalValue === 'number' ? originalValue : parseFloat(String(originalValue).replace(/[^0-9.-]+/g, ''));
        const extValue = typeof extractedValue === 'number' ? extractedValue : parseFloat(String(extractedValue).replace(/[^0-9.-]+/g, ''));
        hasDiscrepancy = Math.abs(origValue - extValue) > 0.1; // Allow for minor rounding differences
      } else if (fieldType === 'string') {
        // Case-insensitive string comparison, trimmed
        hasDiscrepancy = String(originalValue).trim().toLowerCase() !== String(extractedValue).trim().toLowerCase();
      } else {
        // Default comparison
        hasDiscrepancy = originalValue != extractedValue; // Loose comparison to handle type differences
      }
    }
    
    if (hasDiscrepancy) {
      // Format the extracted value for display in the tooltip
      let formattedValue;
      if (fieldType === 'currency') {
        formattedValue = typeof extractedValue === 'number' ? 
          `$${extractedValue.toLocaleString()}` : 
          extractedValue;
      } else if (fieldType === 'percentage') {
        formattedValue = typeof extractedValue === 'number' ? 
          `${extractedValue}%` : 
          extractedValue;
      } else {
        formattedValue = extractedValue;
      }
      
      return {
        hasDiscrepancy,
        extractedValue: formattedValue
      };
    }
    
    return null;
  };

  // Render a field with discrepancy icon if there's a difference
  const renderFieldWithDiscrepancy = (fieldValue, fieldType, fieldName, parentField = null) => {
    const discrepancy = getDiscrepancyInfo(fieldType, fieldName, fieldValue, parentField);
    
    if (discrepancy) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {fieldType === 'currency' && typeof fieldValue === 'number' ? `$${fieldValue.toLocaleString()}` : fieldValue}
          <Tooltip title={`Document shows: ${discrepancy.extractedValue}`} arrow>
            <InfoIcon sx={{ ml: 1, color: 'warning.main', fontSize: 18 }} />
          </Tooltip>
        </Box>
      );
    }
    
    if (fieldType === 'currency' && typeof fieldValue === 'number') {
      return `$${fieldValue.toLocaleString()}`;
    }
    
    return fieldValue;
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleNoteInputChange = (e) => {
    const { name, value } = e.target;
    setNewNote(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNote = async () => {
    if (!newNote.author || !newNote.content) return;
    
    try {
      setSubmittingNote(true);
      await loanService.addNote(loan.id, newNote);
      
      // Refresh loan data to get updated notes
      const updatedLoan = await loanService.getLoan(id);
      setLoan(updatedLoan);
      
      // Reset form
      setNewNote({ author: '', content: '' });
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Render status chip with appropriate color
  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', color: 'warning', icon: <PendingIcon /> },
      approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon /> },
      rejected: { label: 'Rejected', color: 'error', icon: <ErrorIcon /> },
      in_review: { label: 'In Review', color: 'primary', icon: <PendingIcon /> },
      needs_documents: { label: 'Needs Documents', color: 'secondary', icon: <WarningIcon /> },
      funded: { label: 'Funded', color: 'success', icon: <CheckCircleIcon /> },
      closed: { label: 'Closed', color: 'default', icon: null },
      validated: { label: 'Validated', color: 'success', icon: <CheckCircleIcon /> },
      issues: { label: 'Issues Found', color: 'error', icon: <ErrorIcon /> }
    };

    const config = statusConfig[status] || { label: status, color: 'default', icon: null };

    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        icon={config.icon}
      />
    );
  };

  // Handle reviewing the application
  const handleReviewApplication = async () => {
    // Check if we have extracted data
    if (!extractedData) {
      // Need to process documents first
      if (documents.length === 0) {
        alert('No documents found for this application. Please upload documents first.');
        return;
      }
      
      setValidatingApplication(true);
      
      try {
        // Get the document ID for the first document (typically the sales contract)
        const docId = documents[0].id;
        
        // Process the document and extract data
        const result = await documentService.analyzeDocument(docId);
        
        if (result && result.loan_application) {
          setExtractedData(result.loan_application);
          
          // Show the variance review screen
          setShowVarianceReview(true);
        } else {
          alert('Failed to extract data from documents. Please try again.');
        }
      } catch (error) {
        console.error('Error processing documents:', error);
        alert('Error processing documents. Please try again.');
      } finally {
        setValidatingApplication(false);
      }
    } else {
      // We already have extracted data, go straight to variance review
      setShowVarianceReview(true);
    }
  };

  // Handle closing the variance review
  const handleCloseVarianceReview = () => {
    setShowVarianceReview(false);
  };

  // Handle continuing with review after variance check
  const handleContinueWithReview = async (updatedValues) => {
    setShowVarianceReview(false);
    setValidatingApplication(true);
    
    try {
      // Update loan with values from variance review
      if (Object.keys(updatedValues).length > 0) {
        const updateData = { ...updatedValues };
        
        // Update the loan in the state to reflect changes
        setLoan(prev => ({
          ...prev,
          ...updateData
        }));
        
        // Save the changes to the server
        await loanService.updateLoan(loan.id, updateData);
        
        // Add a note about the update
        await loanService.addNote(loan.id, {
          author: 'System',
          content: 'Application values updated after document validation'
        });
      }
      
      // Get the updated loan data after changes
      const updatedLoanData = await loanService.getLoan(id);
      setLoan(updatedLoanData);
      
      // Perform validation checks
      // For demonstration, we'll simulate a validation against lending criteria
      try {
        const validationResult = await validateApplicationAgainstCriteria(updatedLoanData || loan);
        
        if (validationResult.success) {
          // Update loan status to validated
          await loanService.updateLoanStatus(loan.id, 'validated');
          
          // Update local state
          setLoan(prev => ({
            ...prev,
            status: 'validated'
          }));
          
          // Add validation success note
          await loanService.addNote(loan.id, {
            author: 'System',
            content: 'Application passed all validation checks'
          });
          
          // Show success message
          alert('Application has been validated successfully!');
        } else {
          // Update loan status to issues found
          await loanService.updateLoanStatus(loan.id, 'issues');
          
          // Update local state
          setLoan(prev => ({
            ...prev,
            status: 'issues'
          }));
          
          // Save validation errors
          setValidationErrors(validationResult.errors);
          
          // Add validation failure note
          await loanService.addNote(loan.id, {
            author: 'System',
            content: `Application validation found issues: ${validationResult.errors.join(', ')}`
          });
          
          // Show error message
          alert('Validation found issues with the application. See validation results for details.');
        }
      } catch (validationError) {
        console.error('Error validating application:', validationError);
        alert('Error during application validation. Please check the data and try again.');
      }
      
      // Refresh the loan data
      const finalLoanData = await loanService.getLoan(id);
      setLoan(finalLoanData);
      
    } catch (error) {
      console.error('Error during validation process:', error);
      alert('Error during validation process. Please try again.');
    } finally {
      setValidatingApplication(false);
    }
  };

  // Simulate validation against lending criteria
  const validateApplicationAgainstCriteria = async (loanData) => {
    // This is a simplified validation that would be more complex in a real application
    const errors = [];
    
    // Check loan amount against vehicle value
    if (loanData.loan_amount > loanData.vehicle_price * 1.1) {
      errors.push('Loan amount exceeds 110% of vehicle value');
    }
    
    // Check loan-to-value ratio
    if (loanData.loan_to_value > 100) {
      errors.push('Loan-to-value ratio exceeds 100%');
    }
    
    // Check credit score of primary borrower
    const primaryBorrower = loanData.borrowers?.find(b => !b.is_co_borrower);
    if (primaryBorrower && primaryBorrower.credit_score < 650) {
      errors.push('Primary borrower credit score below minimum requirement');
    }
    
    // Check debt-to-income ratio (simplified)
    if (primaryBorrower && primaryBorrower.annual_income) {
      const monthlyIncome = primaryBorrower.annual_income / 12;
      if (loanData.monthly_payment > monthlyIncome * 0.4) {
        errors.push('Monthly payment exceeds 40% of monthly income');
      }
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: errors.length === 0,
      errors
    };
  };

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading loan details...</Typography>
      </Box>
    );
  }

  if (error || !loan) {
    return (
      <Box sx={{ p: 4 }}>
        <Button 
          component={Link} 
          to="/applications" 
          startIcon={<ArrowBackIcon />}
          sx={{ mb: 2 }}
        >
          Back to Applications
        </Button>
        <Alert severity="error">
          {error || "Loan application not found. The application ID may be invalid or the application has been removed."}
        </Alert>
      </Box>
    );
  }

  // Find primary borrower
  const primaryBorrower = loan.borrowers?.find(b => !b.is_co_borrower);
  const coBorrower = loan.borrowers?.find(b => b.is_co_borrower);

  return (
    <div>
      {/* Header with back button and status */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/applications" 
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Applications
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          Vehicle Loan Application {loan.application_number}
        </Typography>
        {getStatusChip(loan.status)}
      </Box>

      {/* Loan summary card - improved responsiveness */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mb: { xs: 1, sm: 0 } }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{primaryBorrower?.full_name || "No Borrower"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applicant
                  </Typography>
                </Box>
              </Box>
              {primaryBorrower && (
                <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Phone:</strong> {primaryBorrower.phone}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-all' }}>
                    <strong>Email:</strong> {primaryBorrower.email}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Credit Score:</strong> {primaryBorrower.credit_score}
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mb: { xs: 1, sm: 0 } }}>
                  <DirectionsCarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">Vehicle Details</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                    {loan.vehicle_year} {loan.vehicle_make} {loan.vehicle_model}
                  </Typography>
                </Box>
              </Box>
              {loan.vehicle_details && (
                <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                  <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-all' }}>
                    <strong>VIN:</strong> {loan.vehicle_details.vin}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Vehicle Value:</strong> ${loan.vehicle_price?.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Condition:</strong> {loan.vehicle_details.condition}
                  </Typography>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 2,
                flexWrap: { xs: 'wrap', sm: 'nowrap' }
              }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2, mb: { xs: 1, sm: 0 } }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6">${loan.loan_amount?.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vehicle Loan ({Math.floor(loan.loan_term_months / 12)} years)
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Interest Rate:</strong> {loan.interest_rate}%
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Monthly Payment:</strong> ${loan.monthly_payment?.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Submitted:</strong> {new Date(loan.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs for detailed information */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Application Details" />
          <Tab label="Documents" />
          <Tab label="Timeline" />
          <Tab label="Notes & Communication" />
        </Tabs>
      </Box>

      {/* Application Details Tab */}
      {currentTab === 0 && (
        <>
          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Validation Issues Found:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}
        
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Borrower Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {primaryBorrower ? (
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">Full Name</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.full_name, 'string', 'full_name', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Phone</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.phone, 'string', 'phone', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Email</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.email, 'string', 'email', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Credit Score</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.credit_score, 'string', 'credit_score', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Annual Income</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.annual_income, 'currency', 'annual_income', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employment Status</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.employment_status, 'string', 'employment_status', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employer</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.employer, 'string', 'employer', 'borrower')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Years at Current Job</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(primaryBorrower.years_at_job, 'string', 'years_at_job', 'borrower')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No primary borrower information available</Alert>
                  )}

                  {coBorrower && (
                    <>
                      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Co-Borrower Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell component="th" scope="row">Full Name</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.full_name, 'string', 'full_name', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Phone</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.phone, 'string', 'phone', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Email</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.email, 'string', 'email', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Credit Score</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.credit_score, 'string', 'credit_score', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Annual Income</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.annual_income, 'currency', 'annual_income', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Employment Status</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.employment_status, 'string', 'employment_status', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Employer</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.employer, 'string', 'employer', 'coBorrower')}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell component="th" scope="row">Years at Current Job</TableCell>
                              <TableCell>{renderFieldWithDiscrepancy(coBorrower.years_at_job, 'string', 'years_at_job', 'coBorrower')}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Loan Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell component="th" scope="row">Loan Type</TableCell>
                          <TableCell>Vehicle Loan</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Loan Amount</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(loan.loan_amount, 'currency', 'loan_amount')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Term</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(Math.floor(loan.loan_term_months / 12), 'string', 'loan_term_months')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Interest Rate</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(loan.interest_rate, 'percentage', 'interest_rate')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Monthly Payment</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(loan.monthly_payment, 'currency', 'monthly_payment')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Down Payment</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(loan.down_payment, 'currency', 'down_payment') || 'N/A'}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Loan-to-Value Ratio</TableCell>
                          <TableCell>{renderFieldWithDiscrepancy(loan.loan_to_value?.toFixed(1), 'percentage', 'loan_to_value') || 'N/A'}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Application Date</TableCell>
                          <TableCell>{new Date(loan.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Status</TableCell>
                          <TableCell>{getStatusChip(loan.status)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Vehicle Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {loan.vehicle_details ? (
                    <TableContainer component={Paper} elevation={0}>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell component="th" scope="row">Make</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_make, 'string', 'vehicle_make', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Model</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_model, 'string', 'vehicle_model', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Year</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_year, 'string', 'vehicle_year', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">VIN</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_details.vin, 'string', 'vin', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Color</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_details.color, 'string', 'color', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Mileage</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_details.mileage?.toLocaleString(), 'string', 'mileage', 'vehicle')} miles</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Condition</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_details.condition, 'string', 'condition', 'vehicle')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Vehicle Value</TableCell>
                            <TableCell>{renderFieldWithDiscrepancy(loan.vehicle_price, 'currency', 'vehicle_price', 'vehicle')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">Detailed vehicle information not available</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Documents Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Required Documents
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />} 
                component={Link} 
                to={`/upload?loanId=${loan.id}`}
              >
                Upload New Documents
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List>
              {documents.length > 0 ? (
                documents.map((document) => (
                  <ListItem
                    key={document.id}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <IconButton edge="end" aria-label="download" title="Download document">
                          <DownloadIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="view" title="View document" component={Link} to={`/document/${document.id}`}>
                          <VisibilityIcon />
                        </IconButton>
                      </Stack>
                    }
                    sx={{ borderBottom: '1px solid #eee' }}
                  >
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={document.name}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Last updated: {new Date(document.updated_at).toLocaleDateString()}
                        </Typography>
                      }
                    />
                    {getStatusChip(document.status)}
                  </ListItem>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No documents have been uploaded for this application yet.
                  </Typography>
                </Box>
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Timeline Tab */}
      {currentTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Application Timeline
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {loan.timeline && loan.timeline.length > 0 ? (
              <Timeline position="alternate">
                {[...loan.timeline].reverse().map((event, index) => (
                  <TimelineItem key={index}>
                    <TimelineOppositeContent color="text.secondary">
                      {new Date(event.created_at).toLocaleString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={
                        event.type === 'success' ? 'success' :
                        event.type === 'error' ? 'error' :
                        event.type === 'warning' ? 'warning' : 'primary'
                      }>
                        {event.type === 'success' ? <CheckCircleIcon /> :
                         event.type === 'error' ? <ErrorIcon /> :
                         event.type === 'warning' ? <WarningIcon /> : <CalendarTodayIcon />}
                      </TimelineDot>
                      {index < loan.timeline.length - 1 && <TimelineConnector />}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2 }}>
                        <Typography variant="h6" component="span">
                          {event.event}
                        </Typography>
                        <Typography color="text.secondary">By: {event.user}</Typography>
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No timeline events available for this application.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Notes & Communication Log
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Add note form */}
            <Card variant="outlined" sx={{ mb: 3, p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Add a New Note
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Author"
                    name="author"
                    value={newNote.author}
                    onChange={handleNoteInputChange}
                    margin="normal"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={9}>
                  <TextField
                    fullWidth
                    label="Note Content"
                    name="content"
                    value={newNote.content}
                    onChange={handleNoteInputChange}
                    margin="normal"
                    size="small"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
              <Box textAlign="right" mt={1}>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleAddNote}
                  disabled={submittingNote || !newNote.author || !newNote.content}
                  startIcon={submittingNote ? <CircularProgress size={16} /> : <EditIcon />}
                >
                  {submittingNote ? 'Adding...' : 'Add Note'}
                </Button>
              </Box>
            </Card>

            {/* Notes list */}
            {loan.notes && loan.notes.length > 0 ? (
              loan.notes.map((note, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {note.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(note.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography variant="body1">
                    {note.content}
                  </Typography>
                </Card>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No notes have been added to this application yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained"
          onClick={handleReviewApplication}
          startIcon={validatingApplication ? <CircularProgress size={20} color="inherit" /> : <CompareArrowsIcon />}
          disabled={validatingApplication}
        >
          {validatingApplication ? 'Processing...' : 
           loan.status === 'pending' || loan.status === 'needs_documents' 
            ? 'Review Application' 
            : loan.status === 'in_review' 
            ? 'Continue Processing' 
            : loan.status === 'issues'
            ? 'Revalidate Application'
            : 'Update Status'}
        </Button>
      </Box>

      {/* Variance Review Dialog */}
      <Dialog 
        open={showVarianceReview} 
        onClose={handleCloseVarianceReview}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {extractedData && (
            <VarianceReview
              loan={loan}
              extractedData={extractedData}
              onClose={handleCloseVarianceReview}
              onContinueWithReview={handleContinueWithReview}
              validationRules={validationRules}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanDetails;

// Additional icon
const UploadIcon = () => <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
  <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
</svg>

// Additional icon
const VisibilityIcon = () => <svg style={{ width: 24, height: 24 }} viewBox="0 0 24 24">
  <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
</svg>;