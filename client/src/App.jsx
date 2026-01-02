import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { startKeepAliveService, stopKeepAliveService } from './services/wakeupService'
import ProtectedRoute from './components/ProtectedRoute'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Invoices from './pages/Invoices'
import Users from './pages/Users'
import Returns from './pages/Returns'
import './styles/global.css'
import './App.css'

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
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/products" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Products />
            </ProtectedRoute>
          } />
          <Route path="/sales" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
              <Sales />
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
              <Invoices />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/returns" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'sales']}>
              <Returns />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
