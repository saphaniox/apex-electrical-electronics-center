import React from 'react'
import { Layout } from 'antd'

const { Footer: AntFooter } = Layout

function Footer() {
  return (
    <AntFooter style={{ textAlign: 'center', background: '#fafafa', borderTop: '1px solid #f0f0f0', padding: '16px 24px', fontSize: '14px', color: '#666' }}>
      <div style={{ marginBottom: '8px' }}>
        <strong style={{ color: '#333', fontSize: '15px' }}>Apex Electrical & Electronics Center</strong>
        <br />
        <span style={{ fontSize: '13px' }}>Maya Nanziga, Kampala Uganda</span>
      </div>
      <p style={{ margin: 0 }}>
        Designed and powered by{' '}
        <a
          href="https://www.sap-technologies.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1890ff', fontWeight: '600', textDecoration: 'none', transition: 'color 0.3s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#40a9ff'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#1890ff'}
        >
          SAP Technologies Uganda
        </a>
      </p>
    </AntFooter>
  )
}

export default Footer
