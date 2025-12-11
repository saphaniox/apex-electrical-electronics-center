import React, { useEffect, useState } from 'react'
import { Table, Button, Modal, message, Space, Spin, Card, Statistic, Alert, Tag } from 'antd'
import { CloudUploadOutlined, CloudDownloadOutlined, DeleteOutlined, ExclamationCircleOutlined, SaveOutlined, DatabaseOutlined } from '@ant-design/icons'
import { backupAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'

function Backup() {
  const { user } = useAuthStore()
  const [backupsList, setBackupsList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBackups()
    }
  }, [user])

  const fetchBackups = async () => {
    try {
      setIsLoading(true)
      const response = await backupAPI.getAll()
      setBackupList(response.data.data || [])
    } catch (error) {
      message.error('Unable to load backup list. Please refresh and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateBackup = async () => {
    Modal.confirm({
      title: 'Create Database Backup',
      icon: <ExclamationCircleOutlined />,
      content: 'This will create a full backup of the database. Continue?',
      okText: 'Create Backup',
      onOk: async () => {
        try {
          setIsCreating(true)
          await backupAPI.create()
          message.success('Backup created successfully')
          fetchBackups()
        } catch (error) {
          message.error(error.response?.data?.error || 'Failed to create backup')
        } finally {
          setIsCreating(false)
        }
      }
    })
  }

  const handleRestoreBackup = (backupName) => {
    Modal.confirm({
      title: 'Restore Database',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <div>
          <Alert
            message="WARNING: This action will overwrite all current data!"
            description="All existing data will be replaced with the backup data. This action cannot be undone."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p>Backup to restore: <strong>{backupName}</strong></p>
          <p>Are you absolutely sure you want to continue?</p>
        </div>
      ),
      okText: 'Yes, Restore Database',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setIsLoading(true)
          await backupAPI.restore(backupName)
          message.success('Database restored successfully')
          setTimeout(() => {
            window.location.reload()
          }, 2000)
        } catch (error) {
          message.error(error.response?.data?.error || 'Failed to restore backup')
        } finally {
          setIsLoading(false)
        }
      }
    })
  }

  const handleDownloadBackup = async (backupName) => {
    try {
      message.loading({ content: 'Preparing download...', key: 'download' })
      const response = await backupAPI.download(backupName)
      
      // Create blob and download
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${backupName}.zip`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      message.success({ content: 'Backup downloaded successfully', key: 'download' })
    } catch (error) {
      message.error({ content: 'Failed to download backup', key: 'download' })
    }
  }

  const handleDeleteBackup = (backupName) => {
    Modal.confirm({
      title: 'Delete Backup',
      content: `Are you sure you want to delete the backup "${backupName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await backupAPI.delete(backupName)
          message.success('Backup deleted successfully')
          fetchBackups()
        } catch (error) {
          message.error('Failed to delete backup')
        }
      }
    })
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const columns = [
    {
      title: 'Backup Name',
      dataIndex: 'backup_name',
      key: 'backup_name',
      render: (name) => <Tag color="blue" icon={<DatabaseOutlined />}>{name}</Tag>
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleString(),
      sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
    },
    {
      title: 'Created By',
      dataIndex: 'created_by_username',
      key: 'created_by_username',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatBytes(size),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<CloudUploadOutlined />}
            onClick={() => handleRestoreBackup(record.backup_name)}
          >
            Restore
          </Button>
          <Button
            type="default"
            size="small"
            icon={<CloudDownloadOutlined />}
            onClick={() => handleDownloadBackup(record.backup_name)}
          >
            Download
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteBackup(record.backup_name)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ]

  if (user?.role !== 'admin') {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Access Denied"
          description="Only administrators can access backup and restore functionality."
          type="error"
          showIcon
        />
      </div>
    )
  }

  return (
    <Spin spinning={isLoading || isCreating}>
      <div style={{ padding: '20px' }}>
        <PageHeader
          title="Database Backup & Restore"
          breadcrumbs={[{ label: 'System' }, { label: 'Backup & Restore' }]}
          extra={
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleCreateBackup}
              loading={isCreating}
              size="large"
            >
              Create Backup
            </Button>
          }
        />

        <Alert
          message="Database Backup Management"
          description="Create, restore, and manage database backups. Regular backups are essential for data protection and disaster recovery."
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Card style={{ marginBottom: 20 }}>
          <Statistic
            title="Total Backups"
            value={backupsList.length}
            prefix={<DatabaseOutlined />}
            suffix="backups available"
          />
        </Card>

        <Table
          columns={columns}
          dataSource={backupsList}
          rowKey="backup_name"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} backups`
          }}
        />

        <Alert
          message="Backup Best Practices"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>Create backups regularly (at least daily for production systems)</li>
              <li>Store backup files in a secure location separate from the database server</li>
              <li>Test restore procedures periodically to ensure backups are valid</li>
              <li>Keep multiple backup versions for different recovery points</li>
              <li>Monitor backup size and storage space</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 20 }}
        />
      </div>
    </Spin>
  )
}

export default Backup
