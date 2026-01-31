import React, { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import { startKeepAliveService, stopKeepAliveService } from './services/wakeupService'
import ProtectedRoute from './components/ProtectedRoute'
import './styles/global.css'
import './App.css'

// Lazy load pages for code splitting
const Welcome = lazy(() => import('./pages/Welcome'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  useEffect(() => {
    // Start keep-alive service when app mounts
    startKeepAliveService();

    // Cleanup on unmount
    return () => {
      stopKeepAliveService();
    };
  }, []);

  return (
    <ConfigProvider>
      <Router>
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <Spin size="large" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
                <Dashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </Router>
    </ConfigProvider>
  )
}

export default App
