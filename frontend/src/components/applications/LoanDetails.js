import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  Alert
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
import SpeedIcon from '@mui/icons-material/Speed';
import CarRepairIcon from '@mui/icons-material/CarRepair';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

// Mock detailed vehicle loan application data
const mockLoanDetails = {
  'LA-2025-1001': {
    id: 'LA-2025-1001',
    customerName: 'John Doe',
    status: 'pending',
    submittedDate: '2025-04-18',
    loanType: 'Auto Loan',
    loanAmount: 35000,
    term: 5, // years
    interestRate: 4.5,
    estimatedMonthlyPayment: 652.75,
    vehicleDetails: {
      make: 'Toyota',
      model: 'Camry',
      year: 2025,
      vin: '1HGBH41JXMN109186',
      color: 'Silver',
      mileage: 15,
      condition: 'New'
    },
    vehicleValue: 38500,
    downPayment: 3500,
    loanToValue: 90.9, // percentage
    borrowerInfo: {
      phone: '(555) 123-4567',
      email: 'john.doe@example.com',
      creditScore: 745,
      annualIncome: 85000,
      employmentStatus: 'Employed',
      employer: 'ABC Corporation',
      yearsAtJob: 5
    },
    coBorrowerInfo: {
      name: 'Jane Doe',
      phone: '(555) 987-6543',
      email: 'jane.doe@example.com',
      creditScore: 760,
      annualIncome: 75000,
      employmentStatus: 'Employed',
      employer: 'XYZ Inc',
      yearsAtJob: 3
    },
    documents: [
      { id: 'doc1', name: 'Driver\'s License', status: 'validated' },
      { id: 'doc2', name: 'Proof of Insurance', status: 'validated' },
      { id: 'doc3', name: 'Pay Stubs', status: 'pending' },
      { id: 'doc4', name: 'Vehicle Purchase Agreement', status: 'issues' },
      { id: 'doc5', name: 'Credit Application', status: 'pending' }
    ],
    timeline: [
      { date: '2025-04-18T14:30:00', event: 'Application Submitted', user: 'John Doe', type: 'info' },
      { date: '2025-04-19T09:15:00', event: 'Initial Review Started', user: 'Sarah Johnson', type: 'info' },
      { date: '2025-04-20T11:45:00', event: 'Documents Requested', user: 'Sarah Johnson', type: 'warning' },
      { date: '2025-04-22T16:20:00', event: 'Documents Uploaded', user: 'John Doe', type: 'success' },
      { date: '2025-04-23T10:30:00', event: 'Document Issues Identified', user: 'Michael Thompson', type: 'error' },
      { date: '2025-04-25T14:00:00', event: 'Pending Credit Check', user: 'System', type: 'info' }
    ],
    notes: [
      { date: '2025-04-19T10:00:00', content: 'Applicant has strong credit history. Vehicle is available at Toyota dealership on Main Street.', author: 'Sarah Johnson' },
      { date: '2025-04-23T11:15:00', content: 'Purchase agreement missing dealer signature. Please request updated document.', author: 'Michael Thompson' }
    ]
  },
  'LA-2025-1003': {
    id: 'LA-2025-1003',
    customerName: 'Robert Johnson',
    status: 'processing',
    submittedDate: '2025-04-20',
    loanType: 'Auto Loan',
    loanAmount: 42000,
    term: 6, // years
    interestRate: 3.9,
    estimatedMonthlyPayment: 651.43,
    vehicleDetails: {
      make: 'Honda',
      model: 'CR-V',
      year: 2025,
      vin: '2HKRW2H59MH229181',
      color: 'Blue',
      mileage: 8,
      condition: 'New'
    },
    vehicleValue: 45000,
    downPayment: 3000,
    loanToValue: 93.3, // percentage
    borrowerInfo: {
      phone: '(555) 333-8888',
      email: 'robert.johnson@example.com',
      creditScore: 720,
      annualIncome: 90000,
      employmentStatus: 'Employed',
      employer: 'Johnson Enterprises',
      yearsAtJob: 7
    },
    documents: [
      { id: 'doc1', name: 'Driver\'s License', status: 'validated' },
      { id: 'doc2', name: 'Proof of Insurance', status: 'validated' },
      { id: 'doc3', name: 'Pay Stubs', status: 'validated' },
      { id: 'doc4', name: 'Vehicle Purchase Agreement', status: 'validated' },
      { id: 'doc5', name: 'Credit Application', status: 'processing' }
    ],
    timeline: [
      { date: '2025-04-20T09:45:00', event: 'Application Submitted', user: 'Robert Johnson', type: 'info' },
      { date: '2025-04-21T11:30:00', event: 'Initial Review Completed', user: 'Maria Garcia', type: 'success' },
      { date: '2025-04-22T14:15:00', event: 'Documents Verified', user: 'Maria Garcia', type: 'success' },
      { date: '2025-04-25T10:00:00', event: 'Vehicle Inspection Scheduled', user: 'David Wilson', type: 'info' },
      { date: '2025-04-27T09:30:00', event: 'Waiting for Inspection Results', user: 'System', type: 'info' }
    ],
    notes: [
      { date: '2025-04-21T13:20:00', content: 'All required documents have been provided. Proceeding with verification.', author: 'Maria Garcia' },
      { date: '2025-04-25T11:30:00', content: 'Vehicle inspection scheduled for April 30, 2025 at Honda dealership.', author: 'David Wilson' }
    ]
  }
};

// Add more mock data for other applications as needed
Object.assign(mockLoanDetails, {
  'LA-2025-1002': { 
    ...mockLoanDetails['LA-2025-1001'], 
    id: 'LA-2025-1002', 
    customerName: 'Jane Smith', 
    status: 'approved',
    vehicleDetails: {
      make: 'Ford',
      model: 'Explorer',
      year: 2025,
      vin: '1FMSK8DH3MGB52701',
      color: 'Black',
      mileage: 12,
      condition: 'New'
    }
  },
  'LA-2025-1004': { 
    ...mockLoanDetails['LA-2025-1003'], 
    id: 'LA-2025-1004', 
    customerName: 'Emily Wilson', 
    status: 'needs_documents',
    vehicleDetails: {
      make: 'Chevrolet',
      model: 'Equinox',
      year: 2024,
      vin: '2GNALBEK7E1234567',
      color: 'Red',
      mileage: 15000,
      condition: 'Used'
    }
  },
  // Add more mock entries for other application IDs
});

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the loan details from an API
    // For now, we'll use our mock data
    setTimeout(() => {
      setLoan(mockLoanDetails[id] || null);
      setLoading(false);
    }, 500); // simulate loading
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Render status chip with appropriate color
  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', color: 'warning', icon: <PendingIcon /> },
      approved: { label: 'Approved', color: 'success', icon: <CheckCircleIcon /> },
      rejected: { label: 'Rejected', color: 'error', icon: <ErrorIcon /> },
      processing: { label: 'Processing', color: 'primary', icon: <PendingIcon /> },
      needs_documents: { label: 'Needs Documents', color: 'secondary', icon: <WarningIcon /> },
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

  if (loading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6">Loading loan details...</Typography>
      </Box>
    );
  }

  if (!loan) {
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
          Loan application not found. The application ID may be invalid or the application has been removed.
        </Alert>
      </Box>
    );
  }

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
          Vehicle Loan Application {loan.id}
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
                  <Typography variant="h6" sx={{ wordBreak: 'break-word' }}>{loan.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Applicant
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Phone:</strong> {loan.borrowerInfo.phone}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-all' }}>
                  <strong>Email:</strong> {loan.borrowerInfo.email}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Credit Score:</strong> {loan.borrowerInfo.creditScore}
                </Typography>
              </Box>
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
                    {loan.vehicleDetails.year} {loan.vehicleDetails.make} {loan.vehicleDetails.model}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                <Typography variant="body2" sx={{ mb: 0.5, wordBreak: 'break-all' }}>
                  <strong>VIN:</strong> {loan.vehicleDetails.vin}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Vehicle Value:</strong> ${loan.vehicleValue.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Condition:</strong> {loan.vehicleDetails.condition}
                </Typography>
              </Box>
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
                  <Typography variant="h6">${loan.loanAmount.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {loan.loanType} ({loan.term} years)
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ pl: { xs: 0, sm: 5 } }}>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Interest Rate:</strong> {loan.interestRate}%
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Monthly Payment:</strong> ${loan.estimatedMonthlyPayment.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Submitted:</strong> {new Date(loan.submittedDate).toLocaleDateString()}
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
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Borrower Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Full Name</TableCell>
                        <TableCell>{loan.customerName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Phone</TableCell>
                        <TableCell>{loan.borrowerInfo.phone}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Email</TableCell>
                        <TableCell>{loan.borrowerInfo.email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Credit Score</TableCell>
                        <TableCell>{loan.borrowerInfo.creditScore}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Annual Income</TableCell>
                        <TableCell>${loan.borrowerInfo.annualIncome.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Employment Status</TableCell>
                        <TableCell>{loan.borrowerInfo.employmentStatus}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Employer</TableCell>
                        <TableCell>{loan.borrowerInfo.employer}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Years at Current Job</TableCell>
                        <TableCell>{loan.borrowerInfo.yearsAtJob}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {loan.coBorrowerInfo && (
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
                            <TableCell>{loan.coBorrowerInfo.name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Phone</TableCell>
                            <TableCell>{loan.coBorrowerInfo.phone}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Email</TableCell>
                            <TableCell>{loan.coBorrowerInfo.email}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Credit Score</TableCell>
                            <TableCell>{loan.coBorrowerInfo.creditScore}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Annual Income</TableCell>
                            <TableCell>${loan.coBorrowerInfo.annualIncome.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employment Status</TableCell>
                            <TableCell>{loan.coBorrowerInfo.employmentStatus}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employer</TableCell>
                            <TableCell>{loan.coBorrowerInfo.employer}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Years at Current Job</TableCell>
                            <TableCell>{loan.coBorrowerInfo.yearsAtJob}</TableCell>
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
                        <TableCell>{loan.loanType}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Loan Amount</TableCell>
                        <TableCell>${loan.loanAmount.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Term</TableCell>
                        <TableCell>{loan.term} years</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Interest Rate</TableCell>
                        <TableCell>{loan.interestRate}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Estimated Monthly Payment</TableCell>
                        <TableCell>${loan.estimatedMonthlyPayment.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Down Payment</TableCell>
                        <TableCell>${loan.downPayment.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Loan-to-Value Ratio</TableCell>
                        <TableCell>{loan.loanToValue}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Application Date</TableCell>
                        <TableCell>{new Date(loan.submittedDate).toLocaleDateString()}</TableCell>
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
                
                <TableContainer component={Paper} elevation={0}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Make</TableCell>
                        <TableCell>{loan.vehicleDetails.make}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Model</TableCell>
                        <TableCell>{loan.vehicleDetails.model}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Year</TableCell>
                        <TableCell>{loan.vehicleDetails.year}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">VIN</TableCell>
                        <TableCell>{loan.vehicleDetails.vin}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Color</TableCell>
                        <TableCell>{loan.vehicleDetails.color}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Mileage</TableCell>
                        <TableCell>{loan.vehicleDetails.mileage.toLocaleString()} miles</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Condition</TableCell>
                        <TableCell>{loan.vehicleDetails.condition}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Vehicle Value</TableCell>
                        <TableCell>${loan.vehicleValue.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Documents Tab */}
      {currentTab === 1 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Required Documents
              </Typography>
              <Button variant="contained" startIcon={<UploadIcon />}>
                Upload New Documents
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List>
              {loan.documents.map((document) => (
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
                        Last updated: {new Date(loan.submittedDate).toLocaleDateString()}
                      </Typography>
                    }
                  />
                  {getStatusChip(document.status)}
                </ListItem>
              ))}
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

            <Timeline position="alternate">
              {loan.timeline.map((event, index) => (
                <TimelineItem key={index}>
                  <TimelineOppositeContent color="text.secondary">
                    {new Date(event.date).toLocaleString()}
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
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {currentTab === 3 && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Notes & Communication Log
              </Typography>
              <Button variant="contained" startIcon={<EditIcon />}>
                Add Note
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {loan.notes.length > 0 ? (
              loan.notes.map((note, index) => (
                <Card key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {note.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(note.date).toLocaleString()}
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
        <Button variant="outlined" sx={{ mr: 2 }}>
          Download Application PDF
        </Button>
        <Button variant="contained">
          {loan.status === 'pending' || loan.status === 'needs_documents' 
            ? 'Review Application' 
            : loan.status === 'processing' 
            ? 'Continue Processing' 
            : 'Update Status'}
        </Button>
      </Box>
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