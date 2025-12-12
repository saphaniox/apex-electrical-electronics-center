import React, { useState, useEffect } from 'react'
import { FloatButton } from 'antd'
import { ArrowUpOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

function BackToTop({ showBackButton = true }) {
  const [visible, setVisible] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const toggleVisible = () => {
      const scrolled = document.documentElement.scrollTop
      setVisible(scrolled > 300)
    }

    window.addEventListener('scroll', toggleVisible)
    return () => window.removeEventListener('scroll', toggleVisible)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const goBack = () => {
    navigate(-1)
  }

  if (!visible) return null

  return (
    <FloatButton.Group shape="circle" style={{ right: 24, bottom: 24 }}>
      {showBackButton && (
        <FloatButton
          icon={<ArrowLeftOutlined />}
          tooltip="Go Back"
          onClick={goBack}
        />
      )}
      <FloatButton
        icon={<ArrowUpOutlined />}
        tooltip="Back to Top"
        onClick={scrollToTop}
      />
    </FloatButton.Group>
  )
}

export default BackToTop
