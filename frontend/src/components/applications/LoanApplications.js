import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  InputAdornment,
  Chip,
  Card,
  CardContent,
  IconButton,
  Divider,
  TablePagination,
  Button,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link } from 'react-router-dom';
import loanService from '../../services/loanService';

const LoanApplications = () => {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch loan applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await loanService.getAllLoans(null, searchTerm);
        setApplications(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching loan applications:', err);
        setError('Failed to load loan applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [searchTerm]);

  // Handle search input change with debounce
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Reset to first page on new search
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Render status chip with appropriate color
  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Review', color: 'warning' },
      approved: { label: 'Approved', color: 'success' },
      rejected: { label: 'Rejected', color: 'error' },
      processing: { label: 'Processing', color: 'primary' },
      in_review: { label: 'In Review', color: 'primary' },
      funded: { label: 'Funded', color: 'success' },
      closed: { label: 'Closed', color: 'default' }
    };

    const config = statusConfig[status] || { label: status, color: 'default' };

    return <Chip label={config.label} size="small" color={config.color} />;
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Vehicle Loan Applications
      </Typography>

      {/* Search and filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <TextField
              placeholder="Search by application # or customer name"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ width: '50%' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
            >
              Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Applications table */}
      <Card>
        <CardContent>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              Applications Requiring Processing
            </Typography>
            {!loading && (
              <Typography variant="body2" color="text.secondary">
                {applications.length} applications found
              </Typography>
            )}
          </Box>
          <Divider sx={{ mb: 2 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 650 }} size="medium">
                  <TableHead>
                    <TableRow>
                      <TableCell>Application #</TableCell>
                      <TableCell>Customer Name</TableCell>
                      <TableCell>Submitted Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((application) => (
                        <TableRow key={application.id}>
                          <TableCell component="th" scope="row">
                            {application.application_number}
                          </TableCell>
                          <TableCell>{application.customer_name}</TableCell>
                          <TableCell>{new Date(application.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>${application.loan_amount.toLocaleString()}</TableCell>
                          <TableCell>{getStatusChip(application.status)}</TableCell>
                          <TableCell align="right">
                            <IconButton 
                              size="small" 
                              component={Link}
                              to={`/applications/${application.application_number}`}
                              title="View application"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    {applications.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            No loan applications found matching your search
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={applications.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanApplications;