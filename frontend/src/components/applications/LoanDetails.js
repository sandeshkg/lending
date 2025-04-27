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
  Alert,
  CircularProgress,
  TextField
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
import loanService from '../../services/loanService';
import documentService from '../../services/documentService';

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newNote, setNewNote] = useState({ author: '', content: '' });
  const [submittingNote, setSubmittingNote] = useState(false);

  // Fetch loan details from API
  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        const loanData = await loanService.getLoan(id);
        setLoan(loanData);
        
        // Fetch documents for this loan
        const docsData = await documentService.getDocuments(loanData.id);
        setDocuments(docsData);
        
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
                          <TableCell>{primaryBorrower.full_name}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Phone</TableCell>
                          <TableCell>{primaryBorrower.phone}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Email</TableCell>
                          <TableCell>{primaryBorrower.email}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Credit Score</TableCell>
                          <TableCell>{primaryBorrower.credit_score}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Annual Income</TableCell>
                          <TableCell>${primaryBorrower.annual_income?.toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Employment Status</TableCell>
                          <TableCell>{primaryBorrower.employment_status}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Employer</TableCell>
                          <TableCell>{primaryBorrower.employer}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Years at Current Job</TableCell>
                          <TableCell>{primaryBorrower.years_at_job}</TableCell>
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
                            <TableCell>{coBorrower.full_name}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Phone</TableCell>
                            <TableCell>{coBorrower.phone}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Email</TableCell>
                            <TableCell>{coBorrower.email}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Credit Score</TableCell>
                            <TableCell>{coBorrower.credit_score}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Annual Income</TableCell>
                            <TableCell>${coBorrower.annual_income?.toLocaleString()}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employment Status</TableCell>
                            <TableCell>{coBorrower.employment_status}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Employer</TableCell>
                            <TableCell>{coBorrower.employer}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell component="th" scope="row">Years at Current Job</TableCell>
                            <TableCell>{coBorrower.years_at_job}</TableCell>
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
                        <TableCell>${loan.loan_amount?.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Term</TableCell>
                        <TableCell>{Math.floor(loan.loan_term_months / 12)} years</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Interest Rate</TableCell>
                        <TableCell>{loan.interest_rate}%</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Monthly Payment</TableCell>
                        <TableCell>${loan.monthly_payment?.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Down Payment</TableCell>
                        <TableCell>${loan.down_payment?.toLocaleString() || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Loan-to-Value Ratio</TableCell>
                        <TableCell>{loan.loan_to_value?.toFixed(1) || 'N/A'}%</TableCell>
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
                          <TableCell>{loan.vehicle_make}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Model</TableCell>
                          <TableCell>{loan.vehicle_model}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Year</TableCell>
                          <TableCell>{loan.vehicle_year}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">VIN</TableCell>
                          <TableCell>{loan.vehicle_details.vin}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Color</TableCell>
                          <TableCell>{loan.vehicle_details.color}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Mileage</TableCell>
                          <TableCell>{loan.vehicle_details.mileage?.toLocaleString()} miles</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Condition</TableCell>
                          <TableCell>{loan.vehicle_details.condition}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">Vehicle Value</TableCell>
                          <TableCell>${loan.vehicle_price?.toLocaleString()}</TableCell>
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
                {loan.timeline.map((event, index) => (
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
        <Button variant="outlined" sx={{ mr: 2 }}>
          Download Application PDF
        </Button>
        <Button variant="contained">
          {loan.status === 'pending' || loan.status === 'needs_documents' 
            ? 'Review Application' 
            : loan.status === 'in_review' 
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