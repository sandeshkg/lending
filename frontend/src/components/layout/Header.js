import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Box } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import MenuIcon from '@mui/icons-material/Menu';
import UserPreferences from './UserPreferences';

const Header = ({ toggleSidebar }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  
  const handleOpenUserPreferences = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseUserPreferences = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          sx={{ mr: 2 }}
          onClick={toggleSidebar}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1 }}
        >
          Vehicle Lending
        </Typography>
        
        <Box sx={{ display: 'flex' }}>
          <IconButton size="large" color="inherit">
            <HelpIcon />
          </IconButton>
          <IconButton size="large" color="inherit">
            <Badge badgeContent={4} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            sx={{ ml: 2 }}
            onClick={handleOpenUserPreferences}
            aria-describedby="user-preferences-popover"
          >
            <Avatar sx={{ bgcolor: '#fff', color: '#1976d2' }}>U</Avatar>
          </IconButton>
        </Box>
        
        <UserPreferences 
          anchorEl={anchorEl}
          open={open}
          handleClose={handleCloseUserPreferences}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Header;