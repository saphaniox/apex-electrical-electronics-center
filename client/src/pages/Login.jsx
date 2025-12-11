import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import '../styles/auth.css'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const response = await authAPI.login(values)
      setAuth(response.data.user, response.data.token)
      message.success('Welcome back! Logging you in...')
      navigate('/dashboard')
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to log in. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="login-container">
        <Card className="login-box">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Apex Electricals & Electronics Center</h1>
            <p style={{ fontSize: '15px', color: '#666', margin: 0, fontWeight: '400' }}>Stock & Sales Tracking System</p>
          </div>
          
          <div className="login-form-container">
            <Form
              name="login"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please enter your username' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Login
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="auth-link-container">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </Card>
      </div>

      <footer className="auth-footer">
        <p className="auth-footer-text">
          Designed and powered by <a href="https://www.sap-technologies.com" target="_blank" rel="noopener noreferrer">SAP Technologies Uganda</a>
        </p>
      </footer>
    </div>
  )
}

export default Login
