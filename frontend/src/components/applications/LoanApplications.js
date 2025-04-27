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
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Link } from 'react-router-dom';

// Update mock data to show only vehicle loans and remove loanType field or set it to 'Vehicle Loan' for all
const mockApplications = [
  { id: 'LA-2025-1001', customerName: 'John Doe', status: 'pending', submittedDate: '2025-04-18', loanAmount: 35000 },
  { id: 'LA-2025-1002', customerName: 'Jane Smith', status: 'approved', submittedDate: '2025-04-15', loanAmount: 42000 },
  { id: 'LA-2025-1003', customerName: 'Robert Johnson', status: 'processing', submittedDate: '2025-04-20', loanAmount: 28500 },
  { id: 'LA-2025-1004', customerName: 'Emily Wilson', status: 'needs_documents', submittedDate: '2025-04-22', loanAmount: 31000 },
  { id: 'LA-2025-1005', customerName: 'Michael Brown', status: 'rejected', submittedDate: '2025-04-10', loanAmount: 45000 },
  { id: 'LA-2025-1006', customerName: 'Sarah Taylor', status: 'processing', submittedDate: '2025-04-23', loanAmount: 38000 },
  { id: 'LA-2025-1007', customerName: 'David Wilson', status: 'pending', submittedDate: '2025-04-24', loanAmount: 22500 },
  { id: 'LA-2025-1008', customerName: 'Lisa Martinez', status: 'approved', submittedDate: '2025-04-19', loanAmount: 36000 },
  { id: 'LA-2025-1009', customerName: 'Kevin Anderson', status: 'needs_documents', submittedDate: '2025-04-25', loanAmount: 29500 },
  { id: 'LA-2025-1010', customerName: 'Amanda Garcia', status: 'processing', submittedDate: '2025-04-21', loanAmount: 33000 },
  { id: 'LA-2025-1011', customerName: 'Thomas Robinson', status: 'pending', submittedDate: '2025-04-26', loanAmount: 40000 },
  { id: 'LA-2025-1012', customerName: 'Jessica Lee', status: 'needs_documents', submittedDate: '2025-04-17', loanAmount: 27000 },
];

const LoanApplications = () => {
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Initialize with mock data
  useEffect(() => {
    setApplications(mockApplications);
  }, []);

  // Filter applications based on search term
  const filteredApplications = applications.filter(app => 
    app.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    app.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle search input change
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
      needs_documents: { label: 'Needs Documents', color: 'secondary' }
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
            <Typography variant="body2" color="text.secondary">
              {filteredApplications.length} applications found
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

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
                {filteredApplications
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((application) => (
                    <TableRow key={application.id}>
                      <TableCell component="th" scope="row">
                        {application.id}
                      </TableCell>
                      <TableCell>{application.customerName}</TableCell>
                      <TableCell>{new Date(application.submittedDate).toLocaleDateString()}</TableCell>
                      <TableCell>${application.loanAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusChip(application.status)}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          component={Link}
                          to={`/applications/${application.id}`}
                          title="View application"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredApplications.length === 0 && (
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
            count={filteredApplications.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanApplications;