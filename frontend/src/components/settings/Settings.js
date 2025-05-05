import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Alert,
  Snackbar,
  TextField,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ResetIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import userService from '../../services/userService';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [validationRules, setValidationRules] = useState({
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
    // Field-specific rules
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
    },
    // Borrower name rule - critical requirement
    borrower_full_name: {
      mismatch_severity: 'critical',
      block_progress: true
    }
  });
  const [editRuleDialogOpen, setEditRuleDialogOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState(null);
  const [ruleBeingEdited, setRuleBeingEdited] = useState(null);
  
  // Load validation rules from localStorage on component mount
  useEffect(() => {
    const savedRules = localStorage.getItem('validationRules');
    if (savedRules) {
      try {
        const parsedRules = JSON.parse(savedRules);
        setValidationRules(parsedRules);
      } catch (error) {
        console.error('Error parsing saved validation rules:', error);
      }
    }
  }, []);

  // Clear messages after display
  const handleCloseMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSaveValidationRules = () => {
    try {
      localStorage.setItem('validationRules', JSON.stringify(validationRules));
      setSuccessMessage('Validation rules saved successfully');
    } catch (error) {
      console.error('Error saving validation rules:', error);
      setErrorMessage('Failed to save validation rules');
    }
  };

  const handleResetValidationRules = () => {
    if (window.confirm('Are you sure you want to reset all validation rules to default values?')) {
      setValidationRules({
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
        }
      });
      localStorage.removeItem('validationRules');
      setSuccessMessage('Validation rules reset to default values');
    }
  };

  const handleOpenEditDialog = (ruleName) => {
    setCurrentRule(ruleName);
    setRuleBeingEdited({...validationRules[ruleName]});
    setEditRuleDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditRuleDialogOpen(false);
    setCurrentRule(null);
    setRuleBeingEdited(null);
  };

  const handleRuleChange = (e) => {
    const { name, value } = e.target;
    setRuleBeingEdited(prev => ({
      ...prev,
      [name]: name.includes('percentage') || name.includes('absolute') ? parseFloat(value) : value
    }));
  };

  const handleSaveRule = () => {
    setValidationRules(prev => ({
      ...prev,
      [currentRule]: ruleBeingEdited
    }));
    setEditRuleDialogOpen(false);
    setSuccessMessage(`Rule "${currentRule}" updated successfully`);
  };

  const handleAddNewRule = () => {
    const newRuleName = prompt('Enter the field name for the new rule:');
    if (newRuleName && newRuleName.trim() !== '') {
      if (validationRules[newRuleName]) {
        setErrorMessage(`Rule for "${newRuleName}" already exists`);
        return;
      }
      
      setValidationRules(prev => ({
        ...prev,
        [newRuleName]: {
          warning_percentage: 10,
          critical_percentage: 20,
          warning_absolute: 100,
          critical_absolute: 500,
          mismatch_severity: 'warning'
        }
      }));
      setSuccessMessage(`New rule "${newRuleName}" added successfully`);
    }
  };

  const handleDeleteRule = (ruleName) => {
    if (window.confirm(`Are you sure you want to delete the rule for "${ruleName}"?`)) {
      if (ruleName.startsWith('default_')) {
        setErrorMessage('Cannot delete default rules');
        return;
      }
      
      const newRules = {...validationRules};
      delete newRules[ruleName];
      setValidationRules(newRules);
      setSuccessMessage(`Rule "${ruleName}" deleted successfully`);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
      </Box>

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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="General Settings" />
          <Tab label="Validation Rules" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Application Settings
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  User preferences have been moved to the user menu. Click on your profile icon in the top right corner of the application to access your profile information and lending authority settings.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Validation Rules Configuration
                  </Typography>
                  <Box>
                    <Button 
                      variant="outlined" 
                      startIcon={<ResetIcon />} 
                      onClick={handleResetValidationRules}
                      sx={{ mr: 1 }}
                    >
                      Reset to Defaults
                    </Button>
                    <Button 
                      variant="contained" 
                      startIcon={<SaveIcon />} 
                      onClick={handleSaveValidationRules}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body1">
                    Configure validation rules for document data extraction. These rules determine how differences between application data and extracted document data are flagged during review.
                  </Typography>
                </Alert>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddNewRule}
                  >
                    Add New Rule
                  </Button>
                </Box>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Field/Rule Name</TableCell>
                        <TableCell>Warning Threshold</TableCell>
                        <TableCell>Critical Threshold</TableCell>
                        <TableCell>Mismatch Severity</TableCell>
                        <TableCell>Block Progress</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(validationRules).map(([ruleName, rule]) => (
                        <TableRow key={ruleName}>
                          <TableCell>{ruleName}</TableCell>
                          <TableCell>
                            {rule.warning_percentage !== undefined ? 
                              `${rule.warning_percentage}% / $${rule.warning_absolute}` : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            {rule.critical_percentage !== undefined ? 
                              `${rule.critical_percentage}% / $${rule.critical_absolute}` : 
                              'N/A'}
                          </TableCell>
                          <TableCell>
                            {rule.mismatch_severity === 'critical' ? 'Critical' : 
                             rule.mismatch_severity === 'warning' ? 'Warning' : 'Info'}
                          </TableCell>
                          <TableCell>
                            {rule.block_progress ? <CheckCircleIcon color="error" fontSize="small" /> : '—'}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              onClick={() => handleOpenEditDialog(ruleName)}
                              size="small"
                              title="Edit rule"
                            >
                              <EditIcon />
                            </IconButton>
                            {!ruleName.startsWith('default_') && (
                              <IconButton 
                                onClick={() => handleDeleteRule(ruleName)}
                                size="small"
                                title="Delete rule"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Edit Rule Dialog */}
      <Dialog open={editRuleDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Rule: {currentRule}</DialogTitle>
        <DialogContent>
          {ruleBeingEdited && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {(ruleBeingEdited.warning_percentage !== undefined || currentRule.includes('currency') || currentRule.includes('percentage') || currentRule.includes('number')) && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Warning Percentage"
                      name="warning_percentage"
                      type="number"
                      value={ruleBeingEdited.warning_percentage || ''}
                      onChange={handleRuleChange}
                      InputProps={{ endAdornment: '%' }}
                      helperText="Percentage difference to trigger warning"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Critical Percentage"
                      name="critical_percentage"
                      type="number"
                      value={ruleBeingEdited.critical_percentage || ''}
                      onChange={handleRuleChange}
                      InputProps={{ endAdornment: '%' }}
                      helperText="Percentage difference to trigger critical alert"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Warning Absolute"
                      name="warning_absolute"
                      type="number"
                      value={ruleBeingEdited.warning_absolute || ''}
                      onChange={handleRuleChange}
                      helperText="Absolute difference to trigger warning"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Critical Absolute"
                      name="critical_absolute"
                      type="number"
                      value={ruleBeingEdited.critical_absolute || ''}
                      onChange={handleRuleChange}
                      helperText="Absolute difference to trigger critical alert"
                    />
                  </Grid>
                </>
              )}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Mismatch Severity</InputLabel>
                  <Select
                    name="mismatch_severity"
                    value={ruleBeingEdited.mismatch_severity || 'info'}
                    onChange={handleRuleChange}
                  >
                    <MenuItem value="info">Info</MenuItem>
                    <MenuItem value="warning">Warning</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Block Progress Checkbox */}
              <Grid item xs={12}>
                <FormControl component="fieldset" sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox
                      checked={!!ruleBeingEdited.block_progress}
                      onChange={(e) => {
                        setRuleBeingEdited(prev => ({
                          ...prev,
                          block_progress: e.target.checked
                        }));
                      }}
                      name="block_progress"
                    />
                    <Typography variant="body1">
                      Block Application Progress
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                    If enabled, the application cannot proceed when this field has a mismatch
                  </Typography>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleSaveRule} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;