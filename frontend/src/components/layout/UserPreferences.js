import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Slider,
  FormControl,
  Divider,
  Grid,
  Alert,
  Snackbar,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Popover
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import userService from '../../services/userService';

const UserPreferences = ({ anchorEl, open, handleClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [lendingAuthorityLevel, setLendingAuthorityLevel] = useState(1);

  // Fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserProfile();
        setUser(userData);
        
        // Initialize lending authority level from user data if available
        if (userData && userData.lending_authority_level) {
          setLendingAuthorityLevel(userData.lending_authority_level);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setErrorMessage('Failed to load user settings. Please try again.');
        setLoading(false);
      }
    };

    if (open) {
      fetchUserData();
    }
  }, [open]);

  // Handle lending authority level change
  const handleLendingAuthorityLevelChange = (event, newValue) => {
    setLendingAuthorityLevel(newValue);
  };

  // Save lending authority level
  const saveLendingAuthorityLevel = async () => {
    try {
      await userService.updateLendingAuthorityLevel(lendingAuthorityLevel);
      setSuccessMessage('Lending Authority Level updated successfully!');
    } catch (error) {
      console.error('Error updating lending authority level:', error);
      setErrorMessage('Failed to update lending authority level. Please try again.');
    }
  };

  // Clear messages after display
  const handleCloseMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Get lending level description
  const getLendingLevelDescription = (level) => {
    switch (level) {
      case 1:
        return "Entry Level - Loans up to $10,000";
      case 2:
        return "Junior Level - Loans up to $25,000";
      case 3:
        return "Associate Level - Loans up to $50,000";
      case 4:
        return "Intermediate Level - Loans up to $75,000";
      case 5:
        return "Senior Level - Loans up to $100,000";
      case 6:
        return "Lead Level - Loans up to $150,000";
      case 7:
        return "Manager Level - Loans up to $250,000";
      case 8:
        return "Executive Level - Unlimited lending authority";
      default:
        return "Select your lending authority level";
    }
  };

  if (loading && open) {
    return (
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 3, width: 450 }}>
          <Typography variant="h6">Loading preferences...</Typography>
        </Box>
      </Popover>
    );
  }

  return (
    <>
      {/* Success and error messages */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseMessages}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseMessages} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseMessages}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseMessages} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 450, maxHeight: '80vh', overflowY: 'auto' }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>User Preferences</Typography>
          
          {/* Profile Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountCircleIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Profile Information</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={user?.full_name || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user?.email || ''}
                    disabled
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          {/* Lending Authority Level */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Lending Authority Settings</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Typography variant="body1" gutterBottom>
                Set your lending authority level (1-8)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText',
                    mb: 2
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Current Level: {lendingAuthorityLevel} - {getLendingLevelDescription(lendingAuthorityLevel)}
                  </Typography>
                </Paper>
              </Box>
              
              <Slider
                value={lendingAuthorityLevel}
                onChange={handleLendingAuthorityLevelChange}
                step={1}
                marks
                min={1}
                max={8}
                valueLabelDisplay="auto"
                aria-labelledby="lending-authority-level-slider"
                sx={{ mb: 3 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel id="lending-level-select-label">Lending Authority Level</InputLabel>
                    <Select
                      labelId="lending-level-select-label"
                      value={lendingAuthorityLevel}
                      label="Lending Authority Level"
                      onChange={(e) => setLendingAuthorityLevel(e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((level) => (
                        <MenuItem key={level} value={level}>
                          Level {level}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={saveLendingAuthorityLevel}
                  >
                    Save Authority Level
                  </Button>
                </Grid>
              </Grid>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Your lending authority level determines the maximum loan amount you can approve without additional authorization.
              </Typography>
            </CardContent>
          </Card>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button onClick={handleClose} color="primary">
              Close
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default UserPreferences;