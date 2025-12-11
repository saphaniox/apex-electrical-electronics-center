import React, { useEffect, useState } from 'react'
import { Table, Select, message, Space, Spin, Tag, Empty, Card, Typography, Button, Tooltip, Modal, Input, Form } from 'antd'
import { UserOutlined, CrownOutlined, TeamOutlined, EyeOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { usersAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'

const { Option } = Select
const { Text } = Typography

function Users() {
  const { user } = useAuthStore()
  const [userList, setUserList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    fetchAllUsers()
  }, [])

  // Fetch all users
  const fetchAllUsers = async () => {
    try {
      setIsLoading(true)
      const response = await usersAPI.getAll()
      setUserList(response.data || [])
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to fetch users')
      setUserList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Update user role
  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersAPI.updateRole(userId, newRole)
      message.success('User role updated successfully')
      fetchAllUsers() // Refresh the list
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update user role')
    }
  }

  // Delete user (admin only)
  const handleDeleteUser = (userId) => {
    Modal.confirm({
      title: 'Delete User Account',
      content: 'Are you sure you want to permanently delete this user account? This action cannot be undone and will remove all their data.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Cancel',
      onOk: async () => {
        try {
          await usersAPI.delete(userId)
          message.success('🗑️ User account deleted successfully')
          fetchAllUsers()
        } catch (error) {
          message.error(error.response?.data?.error || 'Unable to delete user. They may have existing records in the system.')
        }
      }
    })
  }

  // Show change password modal
  const showChangePasswordModal = (userData) => {
    setSelectedUser(userData)
    passwordForm.resetFields()
    setPasswordModalVisible(true)
  }

  // Handle password change
  const handleChangePassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      await usersAPI.changePassword(selectedUser.id, values.newPassword)
      message.success(`Password updated successfully for ${selectedUser.username}`)
      setPasswordModalVisible(false)
      passwordForm.resetFields()
      setSelectedUser(null)
    } catch (error) {
      if (error.response) {
        message.error(error.response?.data?.error || 'Failed to change password')
      }
      // If validation error, don't close modal
    }
  }

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <CrownOutlined />
      case 'manager':
        return <TeamOutlined />
      case 'sales':
        return <UserOutlined />
      case 'viewer':
        return <EyeOutlined />
      default:
        return <UserOutlined />
    }
  }

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'red'
      case 'manager':
        return 'blue'
      case 'sales':
        return 'green'
      case 'viewer':
        return 'orange'
      default:
        return 'default'
    }
  }

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: '25%',
      render: (text, record) => (
        <Space>
          {getRoleIcon(record.role)}
          <Text strong>{text}</Text>
          {record.id === user?.id && <Tag color="cyan">You</Tag>}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: '30%',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: '20%',
      render: (role) => (
        <Tag icon={getRoleIcon(role)} color={getRoleColor(role)}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Change Role',
      key: 'action',
      width: '25%',
      render: (_, record) => (
        <Select
          value={record.role}
          style={{ width: 150 }}
          onChange={(value) => handleRoleChange(record.id, value)}
          disabled={record.id === user?.id} // Prevent self-role change
        >
          <Option value="admin">
            <Space>
              <CrownOutlined />
              Admin
            </Space>
          </Option>
          <Option value="manager">
            <Space>
              <TeamOutlined />
              Manager
            </Space>
          </Option>
          <Option value="sales">
            <Space>
              <UserOutlined />
              Sales
            </Space>
          </Option>
          <Option value="viewer">
            <Space>
              <EyeOutlined />
              Viewer
            </Space>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '20%',
      render: (_, record) => (
        <Space>
          <Tooltip title="Change Password">
            <Button
              type="primary"
              icon={<KeyOutlined />}
              onClick={() => showChangePasswordModal(record)}
            >
              Password
            </Button>
          </Tooltip>
          <Tooltip title={record.id === user?.id ? 'Cannot delete yourself' : 'Delete User'}>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record.id)}
              disabled={record.id === user?.id}
            >
              Delete
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PageHeader />
      <div style={{ flex: 1, padding: '24px' }}>
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>User Management</h2>
            <Text type="secondary">View and manage user roles and permissions</Text>
          </div>

          <div style={{ marginBottom: '16px', padding: '12px', background: '#f0f2f5', borderRadius: '4px' }}>
            <Text strong>Role Descriptions:</Text>
            <ul style={{ marginTop: '8px', marginBottom: 0 }}>
              <li><Tag color="red" icon={<CrownOutlined />}>ADMIN</Tag> - Full access to all features including user management</li>
              <li><Tag color="blue" icon={<TeamOutlined />}>MANAGER</Tag> - Can manage products, customers, and sales (cannot delete products)</li>
              <li><Tag color="green" icon={<UserOutlined />}>SALES</Tag> - Can create sales orders and generate invoices (cannot manage products/customers)</li>
              <li><Tag color="orange" icon={<EyeOutlined />}>VIEWER</Tag> - Read-only access to all data</li>
            </ul>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={userList}
              rowKey="id"
              pagination={false}
              locale={{
                emptyText: (
                  <Empty
                    description="No users found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                ),
              }}
            />
          )}
        </Card>

        {/* Change Password Modal */}
        <Modal
          title={`Change Password - ${selectedUser?.username}`}
          open={passwordModalVisible}
          onOk={handleChangePassword}
          onCancel={() => {
            setPasswordModalVisible(false)
            passwordForm.resetFields()
            setSelectedUser(null)
          }}
          okText="Change Password"
          cancelText="Cancel"
        >
          <Form
            form={passwordForm}
            layout="vertical"
          >
            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                placeholder="Enter new password (min 6 characters)"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              label="Confirm Password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm password' },
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
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  )
}

export default Users
