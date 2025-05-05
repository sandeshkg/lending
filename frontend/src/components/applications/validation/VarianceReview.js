import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

const VarianceReview = ({ loan, extractedData, onClose, onContinueWithReview, validationRules }) => {
  const [updatedValues, setUpdatedValues] = useState({});
  const [editMode, setEditMode] = useState({});
  const [loading, setLoading] = useState(false);
  const [fieldValues, setFieldValues] = useState({});
  
  // Initialize the field values with the loan data
  useEffect(() => {
    if (loan) {
      const initialFieldValues = {};
      // Add loan fields
      Object.keys(loan).forEach(key => {
        if (typeof loan[key] !== 'object' || loan[key] === null) {
          initialFieldValues[key] = loan[key];
        }
      });
      
      // Add borrower fields
      if (loan.borrowers && loan.borrowers.length > 0) {
        loan.borrowers.forEach((borrower, index) => {
          const prefix = borrower.is_co_borrower ? 'coBorrower_' : 'borrower_';
          Object.keys(borrower).forEach(key => {
            if (typeof borrower[key] !== 'object' || borrower[key] === null) {
              initialFieldValues[`${prefix}${key}`] = borrower[key];
            }
          });
        });
      }
      
      // Add vehicle details
      if (loan.vehicle_details) {
        Object.keys(loan.vehicle_details).forEach(key => {
          if (typeof loan.vehicle_details[key] !== 'object' || loan.vehicle_details[key] === null) {
            initialFieldValues[`vehicle_${key}`] = loan.vehicle_details[key];
          }
        });
      }
      
      setFieldValues(initialFieldValues);
    }
  }, [loan]);
  
  // Detect variances between application and extracted data
  const getVariances = () => {
    if (!extractedData || !loan) return [];
    
    const variances = [];
    
    // Check loan fields
    const loanFields = [
      { key: 'loan_amount', label: 'Loan Amount', type: 'currency' },
      { key: 'interest_rate', label: 'Interest Rate', type: 'percentage' },
      { key: 'loan_term_months', label: 'Loan Term (months)', type: 'number' },
      { key: 'monthly_payment', label: 'Monthly Payment', type: 'currency' },
      { key: 'down_payment', label: 'Down Payment', type: 'currency' },
      { key: 'vehicle_price', label: 'Vehicle Price', type: 'currency' }
    ];
    
    loanFields.forEach(field => {
      if (extractedData[field.key] !== undefined && loan[field.key] !== undefined) {
        const varianceInfo = calculateVariance(
          loan[field.key], 
          extractedData[field.key], 
          field.type,
          validationRules,
          field.key
        );
        
        if (varianceInfo.hasVariance) {
          variances.push({
            field: field.key,
            label: field.label,
            type: field.type,
            applicationValue: loan[field.key],
            extractedValue: extractedData[field.key],
            variancePercentage: varianceInfo.variancePercentage,
            varianceAbsolute: varianceInfo.varianceAbsolute,
            severity: varianceInfo.severity
          });
        }
      }
    });
    
    // Check vehicle fields
    const vehicleFields = [
      { key: 'vehicle_make', label: 'Vehicle Make', type: 'text' },
      { key: 'vehicle_model', label: 'Vehicle Model', type: 'text' },
      { key: 'vehicle_year', label: 'Vehicle Year', type: 'number' }
    ];
    
    vehicleFields.forEach(field => {
      // Handle the case where vehicle details might be nested differently in the extracted data
      let extractedValue;
      if (extractedData.vehicle_details) {
        extractedValue = extractedData.vehicle_details[field.key.replace('vehicle_', '')];
      } else {
        extractedValue = extractedData[field.key];
      }
      
      if (extractedValue !== undefined && loan[field.key] !== undefined) {
        const varianceInfo = calculateVariance(
          loan[field.key], 
          extractedValue, 
          field.type,
          validationRules,
          field.key
        );
        
        if (varianceInfo.hasVariance) {
          variances.push({
            field: field.key,
            label: field.label,
            type: field.type,
            applicationValue: loan[field.key],
            extractedValue: extractedValue,
            variancePercentage: varianceInfo.variancePercentage,
            varianceAbsolute: varianceInfo.varianceAbsolute,
            severity: varianceInfo.severity
          });
        }
      }
    });
    
    // Check borrower fields (primary borrower)
    if (loan.borrowers && loan.borrowers.length > 0 && extractedData.borrowers && extractedData.borrowers.length > 0) {
      const primaryBorrower = loan.borrowers.find(b => !b.is_co_borrower);
      const extractedPrimaryBorrower = extractedData.borrowers.find(b => !b.is_co_borrower);
      
      if (primaryBorrower && extractedPrimaryBorrower) {
        const borrowerFields = [
          { key: 'full_name', label: 'Borrower Name', type: 'text' },
          { key: 'phone', label: 'Borrower Phone', type: 'text' },
          { key: 'email', label: 'Borrower Email', type: 'text' },
          { key: 'annual_income', label: 'Borrower Annual Income', type: 'currency' },
          { key: 'credit_score', label: 'Borrower Credit Score', type: 'number' }
        ];
        
        borrowerFields.forEach(field => {
          if (extractedPrimaryBorrower[field.key] !== undefined && primaryBorrower[field.key] !== undefined) {
            const varianceInfo = calculateVariance(
              primaryBorrower[field.key],
              extractedPrimaryBorrower[field.key],
              field.type,
              validationRules,
              field.key
            );
            
            if (varianceInfo.hasVariance) {
              variances.push({
                field: `borrower_${field.key}`,
                label: field.label,
                type: field.type,
                applicationValue: primaryBorrower[field.key],
                extractedValue: extractedPrimaryBorrower[field.key],
                variancePercentage: varianceInfo.variancePercentage,
                varianceAbsolute: varianceInfo.varianceAbsolute,
                severity: varianceInfo.severity
              });
            }
          }
        });
      }
      
      // Check co-borrower fields if present
      const coBorrower = loan.borrowers.find(b => b.is_co_borrower);
      const extractedCoBorrower = extractedData.borrowers.find(b => b.is_co_borrower);
      
      if (coBorrower && extractedCoBorrower) {
        const coBorrowerFields = [
          { key: 'full_name', label: 'Co-Borrower Name', type: 'text' },
          { key: 'phone', label: 'Co-Borrower Phone', type: 'text' },
          { key: 'email', label: 'Co-Borrower Email', type: 'text' },
          { key: 'annual_income', label: 'Co-Borrower Annual Income', type: 'currency' },
          { key: 'credit_score', label: 'Co-Borrower Credit Score', type: 'number' }
        ];
        
        coBorrowerFields.forEach(field => {
          if (extractedCoBorrower[field.key] !== undefined && coBorrower[field.key] !== undefined) {
            const varianceInfo = calculateVariance(
              coBorrower[field.key],
              extractedCoBorrower[field.key],
              field.type,
              validationRules,
              field.key
            );
            
            if (varianceInfo.hasVariance) {
              variances.push({
                field: `coBorrower_${field.key}`,
                label: field.label,
                type: field.type,
                applicationValue: coBorrower[field.key],
                extractedValue: extractedCoBorrower[field.key],
                variancePercentage: varianceInfo.variancePercentage,
                varianceAbsolute: varianceInfo.varianceAbsolute,
                severity: varianceInfo.severity
              });
            }
          }
        });
      }
    }
    
    return variances;
  };
  
  // Calculate variance between two values and determine severity
  const calculateVariance = (appValue, extractedValue, type, rules, fieldName) => {
    const result = {
      hasVariance: false,
      variancePercentage: 0,
      varianceAbsolute: 0,
      severity: 'info'
    };
    
    // Check if we have a specific rule for this field
    const specificRule = rules[fieldName];
    
    // Convert values to appropriate types for comparison
    let origValue = appValue;
    let extValue = extractedValue;
    
    if (type === 'currency' || type === 'number' || type === 'percentage') {
      // Convert to numbers
      origValue = typeof origValue === 'number' ? origValue : parseFloat(String(origValue).replace(/[^0-9.-]+/g, ''));
      extValue = typeof extValue === 'number' ? extValue : parseFloat(String(extValue).replace(/[^0-9.-]+/g, ''));
      
      // Check for NaN
      if (isNaN(origValue) || isNaN(extValue)) {
        result.hasVariance = true;
        result.severity = specificRule?.mismatch_severity || 'warning';
        return result;
      }
      
      // Calculate absolute and percentage variance
      result.varianceAbsolute = Math.abs(origValue - extValue);
      result.variancePercentage = origValue !== 0 ? (result.varianceAbsolute / origValue) * 100 : 0;
      
      // Get rule settings based on field type
      const ruleType = type === 'currency' ? 'default_currency' :
                       type === 'percentage' ? 'default_percentage' : 'default_number';
      const rule = specificRule || rules[ruleType] || {
        warning_percentage: 10,
        critical_percentage: 20,
        warning_absolute: 1000,
        critical_absolute: 5000,
        mismatch_severity: 'warning'
      };
      
      // Check if variance exceeds thresholds
      if (
        result.variancePercentage >= rule.critical_percentage ||
        result.varianceAbsolute >= rule.critical_absolute
      ) {
        result.hasVariance = true;
        result.severity = 'error';
      } else if (
        result.variancePercentage >= rule.warning_percentage ||
        result.varianceAbsolute >= rule.warning_absolute
      ) {
        result.hasVariance = true;
        result.severity = 'warning';
      } else if (result.varianceAbsolute > 0) {
        result.hasVariance = true;
        result.severity = 'info';
      }
    } else {
      // Text comparison
      if (String(origValue || '').trim().toLowerCase() !== String(extValue || '').trim().toLowerCase()) {
        result.hasVariance = true;
        
        // Use field-specific rule if available, otherwise use default text rule
        if (specificRule) {
          result.severity = specificRule.mismatch_severity === 'critical' ? 'error' : 
                           specificRule.mismatch_severity === 'warning' ? 'warning' : 'info';
        } else {
          const textRule = rules.default_text || { mismatch_severity: 'info' };
          result.severity = textRule.mismatch_severity === 'critical' ? 'error' : 
                           textRule.mismatch_severity === 'warning' ? 'warning' : 'info';
        }
      }
    }
    
    return result;
  };

  // Check if any variance would block progress
  const hasBlockingVariances = () => {
    // Get unresolved variances (ones that haven't been updated)
    const unresolvedVariances = variances.filter(variance => {
      // If the field has been updated with a new value, consider it resolved
      return !updatedValues.hasOwnProperty(variance.field);
    });
    
    // Only check unresolved variances for blocking conditions
    return unresolvedVariances.some(variance => {
      // Get the appropriate rule for this field
      const ruleName = variance.field.replace('borrower_', '').replace('coBorrower_', '').replace('vehicle_', '');
      const rule = validationRules[variance.field] || validationRules[ruleName];
      
      // Only block if:
      // 1. The rule exists and has block_progress flag
      // 2. The variance is critical
      return (rule && rule.block_progress === true && variance.severity === 'error');
    });
  };

  // Format value for display
  const formatValue = (value, type) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (type === 'currency') {
      return typeof value === 'number' ? 
        `$${value.toLocaleString()}` : 
        `$${value}`;
    } else if (type === 'percentage') {
      return `${value}%`;
    } else {
      return value;
    }
  };

  // Get color for severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error.main';
      case 'warning': return 'warning.main';
      case 'info': return 'info.main';
      default: return 'text.secondary';
    }
  };

  // Styling for the severity indicators
  const getSeverityChip = (severity) => {
    let config;
    
    switch (severity) {
      case 'error':
        config = { label: 'Critical', color: 'error', icon: <ErrorIcon fontSize="small" /> };
        break;
      case 'warning':
        config = { label: 'Warning', color: 'warning', icon: <WarningIcon fontSize="small" /> };
        break;
      case 'info':
        config = { label: 'Minor', color: 'info', icon: <InfoIcon fontSize="small" /> };
        break;
      default:
        config = { label: severity, color: 'default', icon: <InfoIcon fontSize="small" /> };
    }

    return (
      <Chip 
        label={config.label} 
        color={config.color} 
        size="small"
        icon={config.icon}
        sx={{ minWidth: '90px' }}
      />
    );
  };

  // Toggle edit mode for a field
  const toggleEditMode = (field) => {
    setEditMode(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle field value change
  const handleFieldChange = (field, value, type) => {
    let parsedValue = value;
    
    // Convert input values to appropriate types
    if (type === 'currency' || type === 'number') {
      parsedValue = value === '' ? '' : parseFloat(value);
    } else if (type === 'percentage') {
      parsedValue = value === '' ? '' : parseFloat(value);
    }
    
    setFieldValues(prev => ({
      ...prev,
      [field]: parsedValue
    }));
    
    setUpdatedValues(prev => ({
      ...prev,
      [field]: parsedValue
    }));
  };

  // Handle using the extracted value
  const applyExtractedValue = (variance) => {
    handleFieldChange(variance.field, variance.extractedValue, variance.type);
    toggleEditMode(variance.field);
  };

  // Handle accept current value (no change)
  const acceptCurrentValue = (field) => {
    toggleEditMode(field);
    
    // Remove from updated values if it was there
    if (updatedValues[field] !== undefined) {
      const newUpdatedValues = { ...updatedValues };
      delete newUpdatedValues[field];
      setUpdatedValues(newUpdatedValues);
    }
  };

  // Handle continuing with the review
  const handleContinue = () => {
    // Check for blocking variances
    if (hasBlockingVariances()) {
      alert('Cannot proceed with review. Some critical fields have mismatches that must be resolved.');
      return;
    }
    
    setLoading(true);
    
    // Convert the updated values to a structure the loan service can use
    const formattedUpdates = {};
    const borrowerUpdates = {};
    const coBorrowerUpdates = {};
    const vehicleUpdates = {};
    
    Object.entries(updatedValues).forEach(([key, value]) => {
      if (key.startsWith('borrower_')) {
        // Primary borrower field
        borrowerUpdates[key.replace('borrower_', '')] = value;
      } else if (key.startsWith('coBorrower_')) {
        // Co-borrower field
        coBorrowerUpdates[key.replace('coBorrower_', '')] = value;
      } else if (key.startsWith('vehicle_')) {
        // Vehicle field
        if (key === 'vehicle_make' || key === 'vehicle_model' || key === 'vehicle_year') {
          // These are top-level fields
          formattedUpdates[key] = value;
        } else {
          // These are nested in vehicle_details
          vehicleUpdates[key.replace('vehicle_', '')] = value;
        }
      } else {
        // Regular loan field
        formattedUpdates[key] = value;
      }
    });
    
    // Add borrower updates if any
    if (Object.keys(borrowerUpdates).length > 0) {
      formattedUpdates.borrowers = loan.borrowers.map(borrower => {
        if (!borrower.is_co_borrower) {
          // This is the primary borrower
          return { ...borrower, ...borrowerUpdates };
        }
        return borrower;
      });
    }
    
    // Add co-borrower updates if any
    if (Object.keys(coBorrowerUpdates).length > 0 && 
        formattedUpdates.borrowers === undefined) {
      formattedUpdates.borrowers = loan.borrowers.map(borrower => {
        if (borrower.is_co_borrower) {
          // This is the co-borrower
          return { ...borrower, ...coBorrowerUpdates };
        }
        return borrower;
      });
    } else if (Object.keys(coBorrowerUpdates).length > 0) {
      // Borrowers already added, update co-borrower
      formattedUpdates.borrowers = formattedUpdates.borrowers.map(borrower => {
        if (borrower.is_co_borrower) {
          return { ...borrower, ...coBorrowerUpdates };
        }
        return borrower;
      });
    }
    
    // Add vehicle updates if any
    if (Object.keys(vehicleUpdates).length > 0) {
      formattedUpdates.vehicle_details = { 
        ...loan.vehicle_details, 
        ...vehicleUpdates 
      };
    }
    
    // Call the parent's continue handler
    setTimeout(() => {
      onContinueWithReview(formattedUpdates);
      setLoading(false);
    }, 1000);
  };

  // Get all the variances
  const variances = getVariances();
  
  // Group variances by category
  const criticalVariances = variances.filter(v => v.severity === 'error');
  const warningVariances = variances.filter(v => v.severity === 'warning');
  const minorVariances = variances.filter(v => v.severity === 'info');

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onClose} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Review Variances
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleContinue}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : 'Continue with Review'}
        </Button>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body1">
          Please review the differences between the application data and the data extracted from the uploaded documents.
          You can edit any field where you see a discrepancy.
        </Typography>
      </Alert>
      
      {variances.length === 0 ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          No variances detected between the application and document data. You can proceed with the review.
        </Alert>
      ) : (
        <>
          {/* Summary of variances */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, bgcolor: criticalVariances.length > 0 ? 'error.50' : 'background.paper' }}>
                <Typography variant="h6" color={criticalVariances.length > 0 ? 'error.main' : 'text.primary'}>
                  {criticalVariances.length} Critical {criticalVariances.length === 1 ? 'Variance' : 'Variances'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {criticalVariances.length > 0 
                    ? 'Must be resolved before proceeding' 
                    : 'No critical issues found'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, bgcolor: warningVariances.length > 0 ? 'warning.50' : 'background.paper' }}>
                <Typography variant="h6" color={warningVariances.length > 0 ? 'warning.main' : 'text.primary'}>
                  {warningVariances.length} Warning {warningVariances.length === 1 ? 'Variance' : 'Variances'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {warningVariances.length > 0 
                    ? 'Review recommended before proceeding' 
                    : 'No warnings found'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, bgcolor: minorVariances.length > 0 ? 'info.50' : 'background.paper' }}>
                <Typography variant="h6" color={minorVariances.length > 0 ? 'info.main' : 'text.primary'}>
                  {minorVariances.length} Minor {minorVariances.length === 1 ? 'Variance' : 'Variances'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {minorVariances.length > 0 
                    ? 'Small differences that may not need changes' 
                    : 'No minor variances found'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Table of variances */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Application Value</TableCell>
                  <TableCell>Document Value</TableCell>
                  <TableCell>Variance</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {variances.map((variance) => (
                  <TableRow key={variance.field} sx={{ 
                    bgcolor: variance.severity === 'error' ? 'error.50' : 
                            variance.severity === 'warning' ? 'warning.50' : 
                            variance.severity === 'info' ? 'info.50' : 'background.paper' 
                  }}>
                    <TableCell component="th" scope="row">
                      <Typography variant="body1" fontWeight={500}>
                        {variance.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {editMode[variance.field] ? (
                        <TextField
                          value={fieldValues[variance.field] || ''}
                          onChange={(e) => handleFieldChange(variance.field, e.target.value, variance.type)}
                          variant="outlined"
                          size="small"
                          fullWidth
                          type={variance.type === 'number' || variance.type === 'currency' ? 'number' : 'text'}
                          InputProps={{
                            startAdornment: variance.type === 'currency' ? '$' : '',
                            endAdornment: variance.type === 'percentage' ? '%' : ''
                          }}
                        />
                      ) : (
                        formatValue(variance.applicationValue, variance.type)
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontWeight: 'medium', color: getSeverityColor(variance.severity) }}>
                        {formatValue(variance.extractedValue, variance.type)}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {variance.type === 'currency' || variance.type === 'percentage' || variance.type === 'number' ? (
                        <Box>
                          <Typography variant="body2">
                            {formatValue(variance.varianceAbsolute, variance.type)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({variance.variancePercentage.toFixed(1)}%)
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2">
                          Text mismatch
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {getSeverityChip(variance.severity)}
                    </TableCell>
                    <TableCell>
                      {editMode[variance.field] ? (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Save">
                            <IconButton 
                              color="primary" 
                              onClick={() => toggleEditMode(variance.field)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel">
                            <IconButton 
                              color="error" 
                              onClick={() => acceptCurrentValue(variance.field)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit field">
                            <IconButton 
                              color="primary" 
                              onClick={() => toggleEditMode(variance.field)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Use document value">
                            <IconButton 
                              color="secondary" 
                              onClick={() => applyExtractedValue(variance)}
                            >
                              <CheckIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          onClick={onClose} 
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleContinue}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={24} color="inherit" /> : null}
        >
          {loading ? 'Processing...' : 'Continue with Review'}
        </Button>
      </Box>
    </Box>
  );
};

export default VarianceReview;