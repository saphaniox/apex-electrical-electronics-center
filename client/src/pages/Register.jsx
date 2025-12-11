import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import '../styles/auth.css'

function Register() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuthStore()

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Passwords don\'t match. Please make sure both passwords are the same.')
      return
    }

    setLoading(true)
    try {
      const response = await authAPI.register({
        username: values.username,
        email: values.email,
        password: values.password
      })
      setAuth(response.data.user, response.data.token)
      message.success('🎉 Account created successfully! Welcome aboard!')
      navigate('/dashboard')
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to create account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="login-container">
        <Card className="login-box">
          <h1>Apex Electricals & Electronics Center</h1>
          <h3>Create Account</h3>
          
          <div className="login-form-container">
            <Form
              name="register"
              layout="vertical"
              onFinish={onFinish}
              autoComplete="off"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[{ required: true, message: 'Please choose a username' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Username" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email address' },
                  { type: 'email', message: 'Please enter a valid email address' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Please create a password (at least 8 characters)' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Password" />
              </Form.Item>

              <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                rules={[{ required: true, message: 'Please confirm your password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={loading}>
                  Register
                </Button>
              </Form.Item>
            </Form>
          </div>

          <div className="auth-link-container">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
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

export default Register
