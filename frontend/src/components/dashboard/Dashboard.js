import React from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import ArticleIcon from '@mui/icons-material/Article';

const Dashboard = () => {
  // Mock data
  const stats = [
    { title: 'Documents Processed', count: 245, icon: <DescriptionIcon />, color: '#1976d2' },
    { title: 'Documents Validated', count: 198, icon: <CheckCircleIcon />, color: '#4caf50' },
    { title: 'Documents with Issues', count: 47, icon: <ErrorIcon />, color: '#f44336' },
  ];

  const recentDocuments = [
    { id: 1, name: 'Mortgage Application - John Doe', type: 'W-2 Form', status: 'validated', date: '2 hours ago' },
    { id: 2, name: 'Loan Application - Jane Smith', type: 'Bank Statement', status: 'processing', date: '3 hours ago' },
    { id: 3, name: 'Pre-Approval - Mike Johnson', type: 'Credit Report', status: 'issues', date: '5 hours ago' },
    { id: 4, name: 'Refinance - Sarah Williams', type: 'Tax Return', status: 'validated', date: '1 day ago' },
    { id: 5, name: 'HELOC - Robert Brown', type: 'Property Deed', status: 'validated', date: '1 day ago' },
  ];

  const getStatusChip = (status) => {
    switch (status) {
      case 'validated':
        return <Chip label="Validated" size="small" color="success" />;
      case 'processing':
        return <Chip label="Processing" size="small" color="primary" />;
      case 'issues':
        return <Chip label="Issues Found" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" color="default" />;
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} className="dashboard-container">
        {/* Stats Cards */}
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={4} key={index}>
            <Card className="stats-card" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" component="div">
                      {stat.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Processing Status */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Document Processing Status</Typography>
                <PieChartIcon />
              </Box>
              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">W-2 Forms</Typography>
                  <Typography variant="body2">80%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={80} sx={{ my: 1 }} />
              </Box>
              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Bank Statements</Typography>
                  <Typography variant="body2">65%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={65} sx={{ my: 1 }} />
              </Box>
              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2">Tax Returns</Typography>
                  <Typography variant="body2">92%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={92} sx={{ my: 1 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Monthly Trends */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Monthly Trends</Typography>
                <BarChartIcon />
              </Box>
              <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <TimelineIcon sx={{ fontSize: 100, color: 'rgba(25, 118, 210, 0.1)' }} />
                <Typography variant="body1" color="text.secondary">
                  Chart visualization would appear here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Documents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6">Recent Documents</Typography>
                <ArticleIcon />
              </Box>
              <List>
                {recentDocuments.map((doc, index) => (
                  <React.Fragment key={doc.id}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar>
                          <DescriptionIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={doc.name} 
                        secondary={`${doc.type} • ${doc.date}`}
                      />
                      {getStatusChip(doc.status)}
                    </ListItem>
                    {index < recentDocuments.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
};

export default Dashboard;