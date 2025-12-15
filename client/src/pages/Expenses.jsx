import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Input, InputNumber, Modal, message, Space, DatePicker, Tag, Popconfirm, Card, Statistic, Row, Col } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, DollarOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons'
import PageHeader from '../components/PageHeader'
import { useAuthStore } from '../store/authStore'
import dayjs from 'dayjs'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function Expenses() {
  const { user } = useAuthStore()
  const [expenses, setExpenses] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingExpense, setEditingExpense] = useState(null)
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 50, total: 0 })
  const [summary, setSummary] = useState({ totalExpenses: 0, totalCount: 0 })

  useEffect(() => {
    fetchExpenses()
    fetchSummary()
  }, [tablePageInfo.page, tablePageInfo.limit])

  const fetchExpenses = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${API_BASE_URL}/expenses?page=${tablePageInfo.page}&limit=${tablePageInfo.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      const data = await response.json()
      
      if (response.ok) {
        setExpenses(data.data || [])
        setTablePageInfo(prev => ({ ...prev, total: data.pagination?.total || 0 }))
      } else {
        message.error(data.error || 'Failed to fetch expenses')
      }
    } catch (error) {
      message.error('Failed to fetch expenses')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/expenses/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setSummary({
          totalExpenses: data.totalExpenses || 0,
          totalCount: data.totalCount || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  const showModal = (expense = null) => {
    setEditingExpense(expense)
    if (expense) {
      form.setFieldsValue({
        amount: expense.amount,
        description: expense.description,
        category: expense.category,
        date: expense.date ? dayjs(expense.date) : dayjs()
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ date: dayjs() })
    }
    setIsModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setIsLoading(true)

      const token = localStorage.getItem('token')
      const url = editingExpense 
        ? `${API_BASE_URL}/expenses/${editingExpense._id}`
        : `${API_BASE_URL}/expenses`
      
      const method = editingExpense ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: values.amount,
          description: values.description,
          category: values.category,
          date: values.date.toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        message.success(editingExpense ? 'Expense updated successfully' : 'Expense recorded successfully')
        setIsModalVisible(false)
        form.resetFields()
        setEditingExpense(null)
        fetchExpenses()
        fetchSummary()
      } else {
        message.error(data.error || 'Failed to save expense')
      }
    } catch (error) {
      message.error('Failed to save expense')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        message.success('Expense deleted successfully')
        fetchExpenses()
        fetchSummary()
      } else {
        message.error(data.error || 'Failed to delete expense')
      }
    } catch (error) {
      message.error('Failed to delete expense')
    } finally {
      setIsLoading(false)
    }
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      width: 120
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => category ? (
        <Tag color="blue">{category}</Tag>
      ) : <Tag color="default">Uncategorized</Tag>,
      width: 150
    },
    {
      title: 'Amount (UGX)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `UGX ${amount.toLocaleString()}`,
      sorter: (a, b) => a.amount - b.amount,
      width: 150
    },
    {
      title: 'Added By',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this expense?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
      width: 160
    }
  ]

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle="Track daily expenses and operational costs"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={summary.totalExpenses}
              prefix="UGX"
              valueStyle={{ color: '#cf1322' }}
              suffix=""
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Records"
              value={summary.totalCount}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Average Expense"
              value={summary.totalCount > 0 ? Math.round(summary.totalExpenses / summary.totalCount) : 0}
              prefix="UGX"
            />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
          size="large"
        >
          Add Expense
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={expenses}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          pageSize: tablePageInfo.limit,
          total: tablePageInfo.total,
          current: tablePageInfo.page,
          onChange: (page, pageSize) => setTablePageInfo({ page, limit: pageSize || tablePageInfo.limit }),
          showTotal: (total) => `Total ${total} expenses`,
          pageSizeOptions: ['10', '20', '50', '100'],
          showSizeChanger: true
        }}
      />

      <Modal
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalVisible(false)
          form.resetFields()
          setEditingExpense(null)
        }}
        okText={editingExpense ? "Update" : "Add"}
        confirmLoading={isLoading}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ date: dayjs() }}
        >
          <Form.Item
            name="amount"
            label="Amount (UGX)"
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 1, message: 'Amount must be greater than 0' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter amount"
              prefix="UGX"
              min={1}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/UGX\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="What was this expense for? (e.g., Breakfast, Lunch, Transport)"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category (Optional)"
          >
            <Input placeholder="e.g., Food, Transport, Utilities" />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Expenses
