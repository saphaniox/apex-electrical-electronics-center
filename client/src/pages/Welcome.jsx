import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Typography, Row, Col, Card, Space } from 'antd'
import { 
  ShoppingOutlined, 
  BarChartOutlined, 
  TeamOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import '../styles/welcome.css'

const { Title, Paragraph } = Typography

function Welcome() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  const features = [
    {
      icon: <ShoppingOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
      title: 'Inventory Management',
      description: 'Track your electrical products, manage stock levels, and get low stock alerts in real-time.'
    },
    {
      icon: <BarChartOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
      title: 'Sales Analytics',
      description: 'Monitor daily, weekly, and monthly sales performance with detailed profit analysis.'
    },
    {
      icon: <TeamOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
      title: 'Customer Management',
      description: 'Maintain customer records, track purchase history, and build lasting relationships.'
    },
    {
      icon: <SafetyOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />,
      title: 'Role-Based Access',
      description: 'Secure your business with admin, manager, sales, and viewer role permissions.'
    }
  ]

  const benefits = [
    'Real-time inventory tracking',
    'Automated profit calculations',
    'Invoice & receipt generation',
    'Sales order management',
    'Product demand analytics',
    'Backup & restore capabilities',
    'Mobile-responsive interface',
    'Export to PDF & CSV'
  ]

  return (
    <div className={`welcome-page ${visible ? 'visible' : ''}`}>
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-section">
            <ThunderboltOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
            <Title level={1} style={{ margin: '16px 0', color: '#fff' }}>
              Apex Electrical & Electronics Center
            </Title>
          </div>
          <Paragraph style={{ fontSize: '20px', color: '#e6f7ff', marginBottom: '32px' }}>
            Maya Nanziga, Kampala Uganda
          </Paragraph>
          <Title level={3} style={{ color: '#e6f7ff', fontWeight: 'normal', marginBottom: '48px' }}>
            Professional Business Management System for Electrical Retail
          </Title>
          <Space size="large">
            <Button 
              type="primary" 
              size="large" 
              icon={<RocketOutlined />}
              onClick={() => navigate('/login')}
              style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
            >
              Login
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/register')}
              style={{ 
                height: '50px', 
                fontSize: '16px', 
                padding: '0 40px',
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid #fff',
                color: '#fff'
              }}
            >
              Register
            </Button>
          </Space>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <div className="container">
          <Title level={2} style={{ textAlign: 'center', marginBottom: '48px' }}>
            Powerful Features for Your Business
          </Title>
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card 
                  className="feature-card"
                  hoverable
                  style={{ height: '100%', textAlign: 'center' }}
                >
                  <div style={{ marginBottom: '16px' }}>{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph style={{ color: '#666' }}>{feature.description}</Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="container">
          <Row gutter={48} align="middle">
            <Col xs={24} lg={12}>
              <Title level={2} style={{ marginBottom: '24px' }}>
                Why Choose Our System?
              </Title>
              <Paragraph style={{ fontSize: '16px', marginBottom: '32px', color: '#666' }}>
                Built specifically for electrical and electronics retailers in Uganda. 
                Our system helps you manage inventory, track sales, analyze profits, 
                and grow your business with confidence.
              </Paragraph>
              <div className="benefits-list">
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px', marginRight: '12px' }} />
                    <span style={{ fontSize: '16px' }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div className="stats-grid">
                <Card className="stat-card">
                  <div className="stat-number">40+</div>
                  <div className="stat-label">Product Categories</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Cloud-Based</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Access Anytime</div>
                </Card>
                <Card className="stat-card">
                  <div className="stat-number">UGX</div>
                  <div className="stat-label">Local Currency</div>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <GlobalOutlined style={{ fontSize: '64px', color: '#1890ff', marginBottom: '24px' }} />
          <Title level={2} style={{ marginBottom: '16px' }}>
            Ready to Transform Your Business?
          </Title>
          <Paragraph style={{ fontSize: '18px', marginBottom: '32px', color: '#666' }}>
            Join us today and experience modern business management
          </Paragraph>
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              icon={<RocketOutlined />}
              onClick={() => navigate('/register')}
              style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
            >
              Get Started Free
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/login')}
              style={{ height: '50px', fontSize: '16px', padding: '0 40px' }}
            >
              I Have an Account
            </Button>
          </Space>
        </div>
      </div>

      {/* Footer */}
      <div className="welcome-footer">
        <Paragraph style={{ margin: 0, color: '#666' }}>
          Designed and powered by{' '}
          <a 
            href="https://www.sap-technologies.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: '#1890ff', fontWeight: '600' }}
          >
            SAP Technologies Uganda
          </a>
        </Paragraph>
        <Paragraph style={{ margin: '8px 0 0', color: '#999', fontSize: '14px' }}>
          © 2025 Apex Electrical & Electronics Center. All rights reserved.
        </Paragraph>
      </div>
    </div>
  )
}

export default Welcome
