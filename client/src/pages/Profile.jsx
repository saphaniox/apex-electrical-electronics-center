import React, { useState, useEffect } from 'react'
import { Card, Avatar, Button, Upload, message, Space, Modal, Spin, Typography, Form, Input, Divider } from 'antd'
import { UserOutlined, UploadOutlined, DeleteOutlined, CameraOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons'
import { usersAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import BackToTop from '../components/BackToTop'

const { Title, Text } = Typography
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '')

function Profile() {
  const { user, setUser } = useAuthStore()
  const [profilePicture, setProfilePicture] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    if (user?.id) {
      fetchProfilePicture()
    }
  }, [user?.id])

  const fetchProfilePicture = async () => {
    try {
      const response = await usersAPI.getProfilePicture(user.id)
      setProfilePicture(response.data.profile_picture)
    } catch (error) {
      // No profile picture exists yet
      setProfilePicture(null)
    }
  }

  const handleUpload = async (info) => {
    const file = info.file.originFileObj || info.file

    // Validate file type
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('Please upload an image file (JPG, PNG, or GIF)')
      return
    }

    // Validate file size (5MB)
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('Image file size must be less than 5MB. Please choose a smaller image.')
      return
    }

    const formData = new FormData()
    formData.append('profile_picture', file)

    try {
      setIsLoading(true)
      const response = await usersAPI.uploadProfilePicture(formData)
      setProfilePicture(response.data.profile_picture)
      message.success('✅ Profile picture updated successfully!')
      
      // Update user in auth store
      setUser({ ...user, profile_picture: response.data.profile_picture })
    } catch (error) {
      message.error(error.response?.data||'Unable to upload profile picture. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: 'Remove Profile Picture',
      content: 'Are you sure you want to remove your profile picture?',
      okText: 'Yes, Remove',
      okType: 'danger',
      cancelText: 'No, Keep It',
      onOk: async () => {
        try {
          setIsLoading(true)
          await usersAPI.deleteProfilePicture()
          setProfilePicture(null)
          message.success('🗑️ Profile picture removed successfully')
          
          // Update user in auth store
          const updatedUser = { ...user }
          delete updatedUser.profile_picture
          setUser(updatedUser)
        } catch (error) {
          message.error(error.response?.data?.error || 'Unable to remove profile picture. Please try again.')
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const getProfilePictureUrl = () => {
    if (!profilePicture) return null
    return `${API_BASE_URL}/uploads/profiles/${profilePicture}`
  }

  const handlePasswordChange = async (values) => {
    try {
      setIsLoading(true)
      await usersAPI.changeOwnPassword(values.currentPassword, values.newPassword)
      message.success('🔒 Password changed successfully! Your account is now more secure.')
      setPasswordModalVisible(false)
      passwordForm.resetFields()
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to change password. Please check your current password and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader 
        title="My Profile"
        subtitle="Manage your profile picture and personal information"
      />

      <div style={{ flex: 1, padding: '24px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <Spin spinning={isLoading}>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Avatar
                size={150}
                icon={<UserOutlined />}
                src={getProfilePictureUrl()}
                style={{ 
                  marginBottom: '24px',
                  cursor: profilePicture ? 'pointer' : 'default',
                  border: '4px solid #f0f0f0'
                }}
                className="profile-avatar"
                onClick={() => profilePicture && setPreviewVisible(true)}
              />

              <Title level={3} className="profile-username">{user?.username}</Title>
              <Text type="secondary" className="profile-email" style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                {user?.email}
              </Text>
              <Text className="profile-role-badge" style={{ 
                display: 'inline-block',
                padding: '4px 12px',
                background: user?.role === 'admin' ? '#ff4d4f' : user?.role === 'manager' ? '#1890ff' : user?.role === 'sales' ? '#52c41a' : '#fa8c16',
                color: 'white',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                marginBottom: '32px'
              }}>
                {user?.role}
              </Text>

              <div className="profile-actions-container" style={{ marginTop: '32px' }}>
                <Space size="large" wrap className="profile-actions-space">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={() => false}
                    onChange={handleUpload}
                  >
                    <Button 
                      type="primary" 
                      icon={profilePicture ? <CameraOutlined /> : <UploadOutlined />}
                      size="large"
                      className="profile-action-btn"
                    >
                      {profilePicture ? 'Change Picture' : 'Upload Picture'}
                    </Button>
                  </Upload>

                  {profilePicture && (
                    <Button 
                      danger 
                      icon={<DeleteOutlined />}
                      size="large"
                      onClick={handleDelete}
                      className="profile-action-btn"
                    >
                      Delete Picture
                    </Button>
                  )}
                  
                  <Button 
                    icon={<LockOutlined />}
                    size="large"
                    onClick={() => setPasswordModalVisible(true)}
                    className="profile-action-btn"
                  >
                    Change Password
                  </Button>
                </Space>

                <div className="profile-info-text" style={{ marginTop: '24px', color: '#8c8c8c', fontSize: '14px' }}>
                  <p>• Accepted formats: JPG, PNG, GIF, WEBP</p>
                  <p>• Maximum file size: 5MB</p>
                </div>
              </div>
            </div>
          </Card>
        </Spin>

        {/* Password Change Modal */}
        <Modal
          title={<><KeyOutlined style={{ marginRight: 8 }} />Change Password</>}
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false)
            passwordForm.resetFields()
          }}
          footer={null}
          width={500}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            style={{ marginTop: 24 }}
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                { required: true, message: 'Please enter your current password' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                prefix={<KeyOutlined />}
                placeholder="Enter new password (min 6 characters)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('Passwords do not match'))
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<KeyOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setPasswordModalVisible(false)
                  passwordForm.resetFields()
                }}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" loading={isLoading}>
                  Change Password
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* Image Preview Modal */}
        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="auto"
          style={{ maxWidth: '90vw' }}
        >
        <img 
          src={getProfilePictureUrl()} 
          alt="Profile" 
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
        />
      </Modal>
      <BackToTop />
    </div>
  </div>
)
}

export default Profile