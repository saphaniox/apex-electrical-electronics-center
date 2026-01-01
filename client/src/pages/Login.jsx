import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message, Checkbox } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import { wakeUpServer } from '../services/wakeupService'
import { useAuthStore } from '../store/authStore'
import '../styles/auth.css'
import logo from '../assets/logo.png'

function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [serverWaking, setServerWaking] = useState(true)
  const [serverReady, setServerReady] = useState(false)
  const { setAuth } = useAuthStore()

  // Wake up server on component mount (silently)
  useEffect(() => {
    const checkServer = async () => {
      let attempts = 0
      const maxAttempts = 6
      
      while (attempts < maxAttempts) {
        const isReady = await wakeUpServer()
        if (isReady) {
          setServerReady(true)
          break
        }
        attempts++
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 3000))
        }
      }
      
      // Silent failure - server may still be waking, but allow user to try
      setServerWaking(false)
    }

    checkServer()
  }, [])

  const onFinish = async (values) => {
    setLoading(true)
    try {
      // One more attempt to wake up if needed
      if (!serverReady) {
        await wakeUpServer()
      }

      const response = await authAPI.login(values)
      setAuth(response.data.user, response.data.token, response.data.refreshToken)
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
            <img 
              src={logo} 
              alt="Apex Electrical & Electronics" 
              style={{ 
                height: '100px', 
                marginBottom: '16px',
                objectFit: 'contain'
              }} 
            />
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
                <Input prefix={<UserOutlined />} placeholder="Username" disabled={serverWaking && loading} />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please enter your password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" disabled={serverWaking && loading} />
              </Form.Item>

              <Form.Item
                name="rememberMe"
                valuePropName="checked"
              >
                <Checkbox>Keep me logged in for 7 days</Checkbox>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading} disabled={serverWaking && !serverReady}>
                  {serverWaking ? 'Waiting for server...' : 'Login'}
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
