import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
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
  return (
    <ConfigProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/users" element={<Users />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
