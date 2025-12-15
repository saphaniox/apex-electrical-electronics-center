import React, { useEffect, useState } from 'react'
import { Layout, Menu, Button, Avatar, Dropdown, Tooltip, Drawer } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ShoppingOutlined, FileOutlined, DashboardOutlined, LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined, TeamOutlined, LineChartOutlined, BugOutlined, DatabaseOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'
import DashboardContent from '../components/DashboardContent'
import Footer from '../components/Footer'
import Products from './Products'
import Customers from './Customers'
import Sales from './Sales'
import Invoices from './Invoices'
import Users from './Users'
import Returns from './Returns'
import Backup from './Backup'
import Profile from './Profile'
import Analytics from './Analytics'
import Debug from './Debug'
import { appConfig } from '../styles/theme'

const { Header, Sider, Content } = Layout
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }

    // Handle window resize
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setMobileDrawerVisible(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => setCurrentPage('dashboard')
    },
    {
      key: 'analytics',
      icon: <LineChartOutlined />,
      label: 'Analytics',
      onClick: () => setCurrentPage('analytics')
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Products',
      onClick: () => setCurrentPage('products')
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: 'Customers',
      onClick: () => setCurrentPage('customers')
    },
    {
      key: 'sales',
      icon: <ShoppingOutlined />,
      label: 'Sales Orders',
      onClick: () => setCurrentPage('sales')
    },
    {
      key: 'invoices',
      icon: <FileOutlined />,
      label: 'Invoices',
      onClick: () => setCurrentPage('invoices')
    },
    {
      key: 'returns',
      icon: <FileOutlined />,
      label: 'Returns & Refunds',
      onClick: () => setCurrentPage('returns')
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'Users',
      onClick: () => setCurrentPage('users')
    },
    {
      key: 'backup',
      icon: <DatabaseOutlined />,
      label: 'Backup & Restore',
      onClick: () => setCurrentPage('backup')
    },
    {
      key: 'debug',
      icon: <BugOutlined />,
      label: 'Debug',
      onClick: () => setCurrentPage('debug')
    }
  ]

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    // Users, Backup, and Debug menu are admin-only
    if ((item.key === 'users' || item.key === 'debug' || item.key === 'backup') && user?.role !== 'admin') return false
    
    // Admin and Manager can see all items
    if (user?.role === 'admin' || user?.role === 'manager') return true
    
    // Sales can see all except customers (based on business logic)
    if (user?.role === 'sales') {
      return ['dashboard', 'analytics', 'products', 'sales', 'invoices'].includes(item.key)
    }
    
    // Viewer can see everything (read-only access controlled by backend)
    if (user?.role === 'viewer') return true
    
    return false
  })

  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'My Profile',
        onClick: () => setCurrentPage('profile')
      },
      {
        key: 'user-info',
        label: `${user?.username} (${user?.role || 'user'})`,
        disabled: true,
        style: { cursor: 'default', opacity: 0.6 }
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: handleLogout
      }
    ]
  }

  const renderContent = () => {
    switch(currentPage) {
      case 'analytics':
        return <Analytics />
      case 'products':
        return <Products />
      case 'customers':
        return <Customers />
      case 'sales':
        return <Sales />
      case 'invoices':
        return <Invoices />
      case 'returns':
        return <Returns />
      case 'users':
        return <Users />
      case 'backup':
        return <Backup />
      case 'profile':
        return <Profile />
      case 'debug':
        return <Debug />
      default:
        return <DashboardContent page={currentPage} onNavigate={setCurrentPage} />
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Desktop Sider */}
      {!isMobile && (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          style={{ background: '#001529', position: 'fixed', height: '100vh', left: 0, top: 0, zIndex: 1000 }}
          width={200}
          collapsedWidth={80}
        >
          <div className="sidebar-brand" style={{ 
            color: 'white', 
            padding: collapsed ? '24px 10px' : '24px 20px', 
            textAlign: 'center', 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            transition: 'all 0.2s'
          }}>
            <div style={{ fontSize: collapsed ? '24px' : '32px', marginBottom: collapsed ? '0' : '12px', transition: 'all 0.2s' }}>{appConfig.logo}</div>
            {!collapsed && (
              <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', letterSpacing: '-0.2px', lineHeight: '1.3' }}>{appConfig.shopName}</h2>
            )}
          </div>
          <Menu theme="dark" mode="inline" items={filteredMenuItems} />
        </Sider>
      )}

      {/* Mobile Drawer Menu */}
      {isMobile && (
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px' }}>
              <span style={{ fontSize: '20px' }}>{appConfig.logo}</span>
              <span style={{ fontWeight: '600' }}>{appConfig.shopName}</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={Math.min(280, window.innerWidth * 0.8)}
          bodyStyle={{ padding: 0 }}
        >
          <Menu 
            theme="light" 
            mode="inline" 
            items={filteredMenuItems}
            onClick={() => setMobileDrawerVisible(false)}
          />
        </Drawer>
      )}

      <Layout style={{ marginLeft: !isMobile ? (collapsed ? 80 : 200) : 0, transition: 'all 0.2s' }}>
        <Header style={{ 
          background: '#fff', 
          padding: isMobile ? '0 12px' : '0 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          borderBottom: '1px solid #f0f0f0', 
          height: 'auto', 
          minHeight: isMobile ? '60px' : '64px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          overflow: 'visible'
        }}>
          {isMobile ? (
            <Tooltip title="Open menu">
              <Button
                type="text"
                size="large"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                style={{ fontSize: '18px' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title={collapsed ? 'Expand menu' : 'Collapse menu'}>
              <Button
                type="text"
                size="large"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '18px' }}
              />
            </Tooltip>
          )}
          <div className="user-section" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer', 
            marginLeft: 'auto',
            zIndex: 1001
          }}>
            <Dropdown 
              menu={userMenu} 
              trigger={['click']} 
              placement="bottomRight"
              getPopupContainer={trigger => trigger.parentElement}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: isMobile ? '6px' : '0' }}>
                <Avatar 
                  size={isMobile ? 48 : 40}
                  icon={<UserOutlined />}
                  src={user?.profile_picture ? `${API_BASE_URL}/uploads/profiles/${user.profile_picture}` : null}
                  style={{ 
                    border: isMobile ? '3px solid #1890ff' : '1px solid #d9d9d9', 
                    cursor: 'pointer',
                    boxShadow: isMobile ? '0 3px 15px rgba(24, 144, 255, 0.6)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {!user?.profile_picture && user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                {!isMobile && <span>{user?.username}</span>}
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ 
          margin: '0', 
          overflowY: 'auto', 
          overflowX: 'hidden',
          background: '#f5f5f5', 
          minHeight: 'calc(100vh - 64px)', 
          display: 'flex', 
          flexDirection: 'column'
        }}>
          <div style={{ flex: 1 }}>
            {renderContent()}
          </div>
          <Footer />
        </Content>
      </Layout>
    </Layout>
  )
}

export default Dashboard
