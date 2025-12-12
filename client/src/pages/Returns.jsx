import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Modal, message, Space, Tooltip, Spin, Select, Input, InputNumber, Tag, Card, Statistic, Row, Col } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, DeleteOutlined, ShoppingCartOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { returnsAPI, salesAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import BackToTop from '../components/BackToTop'

const { TextArea } = Input
const { Option } = Select

function Returns() {
  const { user } = useAuthStore()
  const [returnsList, setReturnsList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [returnForm] = Form.useForm()
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState('')
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [returnItems, setReturnItems] = useState([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })

  const canApprove = ['admin', 'manager'].includes(user?.role)
  const canDelete = user?.role === 'admin'

  useEffect(() => {
    fetchReturns()
  }, [tablePageInfo.page, statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      const response = await returnsAPI.getAll(tablePageInfo.page, tablePageInfo.limit, statusFilter)
      setReturnsList(response.data.data || [])
      setTablePageInfo(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
      
      // Calculate stats
      const allReturns = await returnsAPI.getAll(1, 10000)
      const data = allReturns.data.data || []
      setStats({
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length
      })
    } catch (error) {
      message.error('Failed to fetch returns')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchOrders = async () => {
    try {
      const response = await salesAPI.getAll(1, 1000)
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Failed to fetch orders')
    }
  }

  const showReturnModal = () => {
    returnForm.resetFields()
    setSelectedOrder(null)
    setReturnItems([])
    setIsModalVisible(true)
  }

  const handleOrderChange = (orderId) => {
    const order = orders.find(o => o._id === orderId)
    setSelectedOrder(order)
    setReturnItems(order?.items?.map(item => ({
      product_id: item.product_id._id || item.product_id,
      product_name: item.product_name,
      max_quantity: item.quantity,
      return_quantity: 0
    })) || [])
  }

  const handleReturnQuantityChange = (index, quantity) => {
    const newItems = [...returnItems]
    newItems[index].return_quantity = quantity
    setReturnItems(newItems)
  }

  const handleCreateReturn = async () => {
    try {
      const values = await returnForm.validateFields()
      
      const itemsToReturn = returnItems
        .filter(item => item.return_quantity > 0)
        .map(item => ({
          product_id: item.product_id,
          quantity: item.return_quantity
        }))

      if (itemsToReturn.length === 0) {
        message.error('Please select at least one item to return')
        return
      }

      await returnsAPI.create({
        order_id: values.order_id,
        items: itemsToReturn,
        reason: values.reason,
        refund_method: values.refund_method
      })

      message.success('Return request created successfully')
      setIsModalVisible(false)
      fetchReturns()
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to create return request')
    }
  }

  const handleApproveReturn = async (id) => {
    Modal.confirm({
      title: 'Approve Return',
      content: 'This will restore inventory and mark the return as approved. Continue?',
      okText: 'Approve',
      okType: 'primary',
      onOk: async () => {
        try {
          await returnsAPI.approve(returnId)
          message.success('✅ Return approved! Inventory has been restored automatically.')
          fetchAllReturns()
        } catch (error) {
          message.error(error.response?.data?.error || 'Unable to approve return. Please try again.')
        }
      }
    })
  }

  const handleRejectReturn = (id) => {
    Modal.confirm({
      title: 'Reject Return',
      content: (
        <Form
          id="reject-form"
          layout="vertical"
        >
          <Form.Item
            name="rejection_reason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea rows={3} placeholder="Enter rejection reason..." />
          </Form.Item>
        </Form>
      ),
      okText: 'Reject',
      okType: 'danger',
      onOk: async () => {
        const form = document.getElementById('reject-form')
        const formData = new FormData(form)
        const rejection_reason = formData.get('rejection_reason')
        
        if (!rejection_reason) {
          message.error('Please provide a rejection reason')
          return Promise.reject()
        }

        try {
          await returnsAPI.reject(id, rejection_reason)
          message.success('Return rejected')
          fetchReturns()
        } catch (error) {
          message.error('Failed to reject return')
        }
      }
    })
  }

  const handleDeleteReturn = async (id) => {
    Modal.confirm({
      title: 'Delete Return',
      content: 'Are you sure you want to delete this return? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await returnsAPI.delete(id)
          message.success('Return deleted successfully')
          fetchReturns()
        } catch (error) {
          message.error('Failed to delete return')
        }
      }
    })
  }

  const isMobile = window.innerWidth <= 768

  const columns = [
    {
      title: 'Return ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => id.substring(0, 8),
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Phone',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      hidden: isMobile,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
    },
    {
      title: 'Refund Amount',
      dataIndex: 'total_refund_amount',
      key: 'total_refund_amount',
      render: (amount, record) => {
        const currency = record.currency || 'UGX'
        return currency === 'USD' ? `$${amount?.toLocaleString()}` : `UGX ${amount?.toLocaleString()}`
      },
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      hidden: isMobile,
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'warning',
          approved: 'success',
          rejected: 'error'
        }
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>
      },
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      hidden: isMobile,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && canApprove && (
            <>
              <Tooltip title="Approve Return">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApproveReturn(record._id)}
                >
                  {!isMobile && 'Approve'}
                </Button>
              </Tooltip>
              <Tooltip title="Reject Return">
                <Button
                  danger
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => handleRejectReturn(record._id)}
                >
                  {!isMobile && 'Reject'}
                </Button>
              </Tooltip>
            </>
          )}
          {canDelete && (
            <Tooltip title="Delete Return">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteReturn(record._id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ].filter(col => !col.hidden)

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: '20px' }}>
        <PageHeader
          title="Returns & Refunds"
          breadcrumbs={[{ label: 'Returns & Refunds' }]}
          extra={
            <Space wrap>
              <Select
                placeholder="Filter by status"
                style={{ width: 150 }}
                allowClear
                onChange={setStatusFilter}
                value={statusFilter || undefined}
              >
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showReturnModal}
              >
                Create Return
              </Button>
            </Space>
          }
        />

        {/* Statistics Cards */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Pending Returns"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Approved Returns"
                value={stats.approved}
                prefix={<CheckOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Rejected Returns"
                value={stats.rejected}
                prefix={<CloseOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={returnsList}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: tablePageInfo.page,
            pageSize: tablePageInfo.limit,
            total: tablePageInfo.total,
            onChange: (page) => setTablePageInfo(prev => ({ ...prev, page }))
          }}
        />

        {/* Create Return Modal */}
        <Modal
          title="Create Return Request"
          open={isModalVisible}
          onOk={handleCreateReturn}
          onCancel={() => setIsModalVisible(false)}
          width={700}
          okText="Submit Return"
        >
          <Form form={returnForm} layout="vertical">
            <Form.Item
              name="order_id"
              label="Select Order"
              rules={[{ required: true, message: 'Please select an order' }]}
            >
              <Select
                placeholder="Select order to return"
                showSearch
                optionFilterProp="children"
                onChange={handleOrderChange}
              >
                {orders.map(order => (
                  <Option key={order._id} value={order._id}>
                    {order._id.substring(0, 8)} - {order.customer_name} - {order.currency === 'USD' ? '$' : 'UGX'}{order.total_amount?.toLocaleString()}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedOrder && (
              <div style={{ marginBottom: 16 }}>
                <h4>Select Items to Return:</h4>
                {returnItems.map((item, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ flex: 1 }}>{item.product_name}</span>
                    <span style={{ width: '100px' }}>Max: {item.max_quantity}</span>
                    <InputNumber
                      min={0}
                      max={item.max_quantity}
                      value={item.return_quantity}
                      onChange={(value) => handleReturnQuantityChange(index, value)}
                      placeholder="Qty"
                      style={{ width: '80px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            <Form.Item
              name="reason"
              label="Return Reason"
              rules={[{ required: true, message: 'Please provide a reason' }]}
            >
              <Select placeholder="Select reason">
                <Option value="Defective Product">Defective Product</Option>
                <Option value="Wrong Item">Wrong Item</Option>
                <Option value="Customer Changed Mind">Customer Changed Mind</Option>
                <Option value="Damaged During Shipping">Damaged During Shipping</Option>
                <Option value="Not as Described">Not as Described</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="refund_method"
              label="Refund Method"
              initialValue="cash"
              rules={[{ required: true }]}
            >
              <Select>
                <Option value="cash">Cash</Option>
                <Option value="mobile_money">Mobile Money</Option>
                <Option value="bank_transfer">Bank Transfer</Option>
            <Option value="store_credit">Store Credit</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
    <BackToTop />
  </div>
</Spin>
)
}

export default Returns