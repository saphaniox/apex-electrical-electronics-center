import React from 'react'
import { Breadcrumb, Space } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

/**
 * Reusable Page Header with breadcrumbs and title
 * @param {string} title - Page title
 * @param {array} breadcrumbs - Array of { label, href? } objects. First item is always Dashboard.
 * @param {node} extra - Optional extra content (buttons, etc.) to display on the right
 */
function PageHeader({ title, breadcrumbs = [], extra = null }) {
  const defaultBreadcrumbs = [
    { label: 'Dashboard', href: '/dashboard', icon: <HomeOutlined /> },
    ...(breadcrumbs || []),
  ]

  const isMobile = window.innerWidth <= 768

  return (
    <div className="page-header" style={{ marginBottom: '24px' }}>
      {!isMobile && (
        <Breadcrumb
          items={defaultBreadcrumbs.map((item, idx) => ({
            title: item.href ? (
              <a href={item.href} style={{ textDecoration: 'none' }}>
                {item.icon && <span style={{ marginRight: '4px' }}>{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <>
                {item.icon && <span style={{ marginRight: '4px' }}>{item.icon}</span>}
                {item.label}
              </>
            ),
          }))}
          style={{ marginBottom: '12px' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '32px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.5px', flex: 1, minWidth: 0 }}>{title}</h1>
        {extra && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Space size={[8, 8]}>{extra}</Space>
          </div>
        )}
      </div>
    </div>
  )
}

export default PageHeader
