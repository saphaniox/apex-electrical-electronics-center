import React from 'react'
import { Navigate } from 'react-router-dom'
import { Empty, Button, Space } from 'antd'
import { LockOutlined, ContactsOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

/**
 * ProtectedRoute component to restrict access based on user role
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {string|string[]} allowedRoles - Role(s) that can access this route
 * @param {React.ReactNode} fallback - Component to show if not authorized (default: access denied message)
 */
function ProtectedRoute({ children, allowedRoles, fallback = null }) {
  const { user } = useAuthStore()

  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Normalize allowedRoles to array
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  // If user doesn't have required role, show fallback or access denied message
  if (!roles.includes(user.role)) {
    return fallback || (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px',
        background: '#f5f5f5'
      }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Access Restricted"
          style={{ marginTop: 0 }}
        >
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <LockOutlined style={{ fontSize: '48px', color: '#999', marginBottom: '16px' }} />
            <h2 style={{ color: '#666', marginBottom: '8px' }}>Access Denied</h2>
            <p style={{ color: '#999', marginBottom: '20px' }}>
              Your current role (<strong>{user.role}</strong>) doesn't have access to this page.
            </p>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Please contact an administrator to request access or upgrade your role.
            </p>
            <Space>
              <Button
                type="primary"
                icon={<ContactsOutlined />}
                onClick={() => window.location.href = '/dashboard'}
              >
                Back to Dashboard
              </Button>
            </Space>
          </div>
        </Empty>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
