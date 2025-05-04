import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';

// Import components
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import DocumentViewer from './components/document/DocumentViewer';
import DocumentUpload from './components/document/DocumentUpload';
import LoanApplications from './components/applications/LoanApplications';
import LoanDetails from './components/applications/LoanDetails';
import Settings from './components/settings/Settings';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="app">
          <Header toggleSidebar={toggleSidebar} />
          <div className="main-container">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <main className={`content ${!sidebarOpen ? 'content-expanded' : ''}`}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/upload" element={<DocumentUpload />} />
                <Route path="/document/:id" element={<DocumentViewer />} />
                <Route path="/applications" element={<LoanApplications />} />
                <Route path="/applications/:id" element={<LoanDetails />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
