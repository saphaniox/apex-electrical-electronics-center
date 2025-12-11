import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Input, Modal, message, Space, Popconfirm, Tooltip, Empty, Spin, Drawer, Row, Col, Card, Statistic, Tag, Descriptions } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, FilePdfOutlined, DownloadOutlined, HistoryOutlined, ShoppingOutlined, DollarOutlined, CalendarOutlined, FilterOutlined } from '@ant-design/icons'
import { customersAPI, exportToCSV } from '../services/api'
import { printTable, exportDataToPDFTable } from '../utils/printUtils'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import AdvancedSearchDrawer from '../components/AdvancedSearchDrawer'

function Customers() {
  const { user } = useAuthStore()
  const [customerList, setCustomerList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(null)
  const [customerForm] = Form.useForm()
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 10, total: 0 })
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [purchaseHistory, setPurchaseHistory] = useState(null)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  // Check if user can perform admin actions based on role
  const canEdit = ['admin', 'manager'].includes(user?.role)
  const canDelete = user?.role === 'admin'

  useEffect(() => {
    fetchAllCustomers()
  }, [tablePageInfo.page])

  // Fetch all customers with pagination
  const fetchAllCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await customersAPI.getAll(tablePageInfo.page, tablePageInfo.limit)
      setCustomerList(response.data.data)
      setTablePageInfo(prev => ({ ...prev, total: response.data.pagination.total }))
    } catch (error) {
      message.error('Unable to load customers. Please refresh the page to try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters to customers
  const applyFilters = (filters) => {
    setActiveFilters(filters)
  }

  // Get filtered customers
  const getFilteredCustomers = () => {
    let filtered = [...customerList]
    
    if (activeFilters.name) {
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(activeFilters.name.toLowerCase())
      )
    }
    
    if (activeFilters.phone) {
      filtered = filtered.filter(customer => 
        customer.phone?.includes(activeFilters.phone)
      )
    }
    
    if (activeFilters.email) {
      filtered = filtered.filter(customer => 
        customer.email?.toLowerCase().includes(activeFilters.email.toLowerCase())
      )
    }
    
    return filtered
  }

  // Show form modal for creating or editing a customer
  const showCustomerModal = (customer = null) => {
    if (customer) {
      setSelectedCustomerId(customer._id)
      customerForm.setFieldsValue({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address
      })
    } else {
      setSelectedCustomerId(null)
      customerForm.resetFields()
    }
    setIsModalVisible(true)
  }

  // Handle customer form submission (create or update)
  const handleSaveCustomer = async () => {
    try {
      const values = await customerForm.validateFields()
      
      if (selectedCustomerId) {
        await customersAPI.update(selectedCustomerId, values)
        message.success('✅ Customer information updated successfully!')
      } else {
        await customersAPI.create(values)
        message.success('✅ New customer added to your records!')
      }
      
      setIsModalVisible(false)
      fetchAllCustomers()
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to save customer. Please check all fields and try again.')
    }
  }

  // Delete a customer after confirmation
  const handleDeleteCustomer = (id) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: 'Are you sure you want to permanently delete this customer? This will remove all their information and cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Keep',
      onOk: async () => {
        try {
          await customersAPI.delete(id)
          message.success('🗑️ Customer deleted successfully')
          fetchAllCustomers()
        } catch (error) {
          message.error('Unable to delete customer. They may have existing orders or invoices.')
        }
      }
    })
  }

  // Print customers table with formatting
  const handlePrintCustomersTable = () => {
    const dataToUse = getFilteredCustomers()
    if (dataToUse.length === 0) {
      message.warning('No customers available to print. Add some customers first or adjust your filters.')
      return
    }
    printTable('customers-table', 'Customers List')
  }

  // Export customers as CSV file
  const handleExportCustomersCSV = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredCustomers()
      if (filteredData.length === 0) {
        message.warning('No customers available to export. Try adding customers or adjusting filters.')
        return
      }
      const exportData = filteredData.map(c => ({
        'Name': c.name,
        'Phone': c.phone,
        'Email': c.email,
        'Address': c.address,
        'Total Purchases': c.total_purchases,
        'Total Spent (UGX)': c.total_spent
      }))
      exportToCSV(exportData, 'customers.csv')
      message.success('✅ Customer list exported to CSV successfully!')
    } catch (error) {
      message.error('Unable to export customers. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Export customers as PDF file with formatting
  const handleExportCustomersPDF = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredCustomers()
      if (filteredData.length === 0) {
        message.warning('No customers to export')
        return
      }
      const exportData = filteredData.map(c => ({
        'Name': c.name,
        'Phone': c.phone,
        'Email': c.email,
        'Address': c.address,
        'Total Purchases': c.total_purchases,
        'Total Spent (UGX)': c.total_spent?.toLocaleString() || '0'
      }))
      exportDataToPDFTable(
        exportData,
        'customers.pdf',
        'Customers Report',
        ['Name', 'Phone', 'Email', 'Address', 'Total Purchases', 'Total Spent (UGX)']
      )
      message.success('Customers exported to PDF successfully')
    } catch (error) {
      message.error('Failed to export customers to PDF')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch customer purchase history
  const handleViewHistory = async (customer) => {
    try {
      setHistoryLoading(true)
      setHistoryDrawerVisible(true)
      const response = await customersAPI.getPurchaseHistory(customer._id)
      setPurchaseHistory({
        customer,
        ...response.data.data
      })
    } catch (error) {
      message.error('Unable to load purchase history. Please try again.')
      setHistoryDrawerVisible(false)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Define table columns with customer data and actions
  const isMobile = window.innerWidth <= 768
  const isSmallMobile = window.innerWidth <= 480

  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? '30%' : 'auto'
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      hidden: isSmallMobile
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      hidden: isMobile,
      ellipsis: true
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      hidden: isMobile
    },
    {
      title: 'Purchases',
      dataIndex: 'total_purchases',
      key: 'total_purchases',
      hidden: isSmallMobile,
      width: isMobile ? '15%' : 'auto'
    },
    {
      title: 'Spent',
      dataIndex: 'total_spent',
      key: 'total_spent',
      render: (total) => `UGX ${total?.toLocaleString() || 0}`,
      hidden: isMobile,
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '25%' : 'auto',
      render: (_, record) => (
        <Space size={isSmallMobile ? 0 : 'small'}>
          <Tooltip title="View History">
            <Button
              type="default"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<HistoryOutlined />}
              onClick={() => handleViewHistory(record)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
            >
              {!isSmallMobile && 'History'}
            </Button>
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<EditOutlined />}
              disabled={!canEdit}
              onClick={() => showCustomerModal(record)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
            >
              {!isSmallMobile && 'Edit'}
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Customer"
              description="Are you sure?"
              onConfirm={() => handleDeleteCustomer(record._id)}
              okText="Yes"
              okType="danger"
              cancelText="No"
              disabled={!canDelete}
            >
              <Button
                danger
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<DeleteOutlined />}
                disabled={!canDelete}
                style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ].filter(col => !col.hidden)

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: window.innerWidth <= 768 ? '12px' : '20px' }}>
        <PageHeader
          title="Customers"
          breadcrumbs={[{ label: 'Customers' }]}
          extra={
            <Space wrap style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <Tooltip title="Filter customers">
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setSearchDrawerVisible(true)}
                  size={isMobile ? 'small' : 'middle'}
                >
                  {!isMobile && 'Filters'}
                </Button>
              </Tooltip>
              {!isSmallMobile && (
                <>
                  <Tooltip title="Print all customers">
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={handlePrintCustomersTable}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      Print
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to PDF">
                    <Button
                      icon={<FilePdfOutlined />}
                      onClick={handleExportCustomersPDF}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportCustomersCSV}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      CSV
                    </Button>
                  </Tooltip>
                </>
              )}
              {isSmallMobile && (
                <Tooltip title="More options">
                  <Button.Group>
                    <Button icon={<PrinterOutlined />} size="small" onClick={handlePrintCustomersTable} />
                    <Button icon={<FilePdfOutlined />} size="small" onClick={handleExportCustomersPDF} />
                    <Button icon={<DownloadOutlined />} size="small" onClick={handleExportCustomersCSV} />
                  </Button.Group>
                </Tooltip>
              )}
              {canEdit && (
                <Tooltip title="Add new customer">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showCustomerModal()}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {!isMobile && 'Add Customer'}
                  </Button>
                </Tooltip>
              )}
            </Space>
          }
        />

        {customerList.length === 0 && !isLoading ? (
          <Empty description="No customers found" style={{ marginTop: '48px' }} />
        ) : (
          <Table
            id="customers-table"
            columns={tableColumns}
            dataSource={getFilteredCustomers()}
            loading={isLoading}
            rowKey="_id"
            scroll={{ x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              pageSize: tablePageInfo.limit,
              total: getFilteredCustomers().length,
              current: tablePageInfo.page,
              onChange: (page) => setTablePageInfo(prev => ({ ...prev, page })),
              showTotal: (total) => `Total ${total} customers`,
              simple: isSmallMobile,
              showSizeChanger: !isMobile
            }}
          />
        )}

        <Modal
          title={selectedCustomerId ? 'Edit Customer' : 'Add Customer'}
          open={isModalVisible}
          onOk={handleSaveCustomer}
          onCancel={() => setIsModalVisible(false)}
          okText={selectedCustomerId ? 'Update' : 'Create'}
          width={isMobile ? '95vw' : 500}
          style={{ maxWidth: '95vw' }}
        >
          <Form
            form={customerForm}
            layout="vertical"
            requiredMark="optional"
          >
            <Form.Item
              label="Customer Name"
              name="name"
              rules={[{ required: true, message: 'Please enter customer name' }]}
            >
              <Input placeholder="e.g., Saphan" />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phone"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="e.g., 0700 000 000" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: 'email', message: 'Invalid email' }]}
            >
              <Input placeholder="e.g., john@example.com" />
            </Form.Item>

            <Form.Item
              label="Address"
              name="address"
            >
              <Input.TextArea placeholder="Customer address" rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        {/* Purchase History Drawer */}
        <Drawer
          title={
            <Space>
              <HistoryOutlined />
              <span>Purchase History - {purchaseHistory?.customer?.name}</span>
            </Space>
          }
          width={window.innerWidth > 768 ? 800 : '95vw'}
          open={historyDrawerVisible}
          onClose={() => {
            setHistoryDrawerVisible(false)
            setPurchaseHistory(null)
          }}
          loading={historyLoading}
        >
          {purchaseHistory && (
            <div style={{ paddingBottom: 20 }}>
              {/* Customer Info */}
              <Descriptions bordered size="small" column={1} style={{ marginBottom: 20 }}>
                <Descriptions.Item label="Phone">{purchaseHistory.customer.phone}</Descriptions.Item>
                <Descriptions.Item label="Email">{purchaseHistory.customer.email || 'N/A'}</Descriptions.Item>
                <Descriptions.Item label="Address">{purchaseHistory.customer.address || 'N/A'}</Descriptions.Item>
              </Descriptions>

              {/* Statistics Cards */}
              <Row gutter={{ xs: 8, sm: 12, md: 16 }} style={{ marginBottom: window.innerWidth <= 768 ? 16 : 24 }}>
                <Col xs={12} sm={12} md={6}>
                  <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                    <Statistic
                      title="Total Orders"
                      value={purchaseHistory.statistics?.total_orders || 0}
                      prefix={<ShoppingOutlined />}
                      valueStyle={{ color: '#1890ff', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                    <Statistic
                      title="Total Spent"
                      value={purchaseHistory.statistics?.total_spent || 0}
                      prefix={<DollarOutlined />}
                      suffix="UGX"
                      valueStyle={{ color: '#52c41a', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                    <Statistic
                      title="Avg Order Value"
                      value={purchaseHistory.statistics?.avg_order_value || 0}
                      prefix={<DollarOutlined />}
                      suffix="UGX"
                      precision={0}
                      valueStyle={{ color: '#faad14', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                    />
                  </Card>
                </Col>
                <Col xs={12} sm={12} md={6}>
                  <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                    <Statistic
                      title="Last Order"
                      value={
                        purchaseHistory.statistics?.last_order_date
                          ? new Date(purchaseHistory.statistics.last_order_date).toLocaleDateString()
                          : 'N/A'
                      }
                      prefix={<CalendarOutlined />}
                      valueStyle={{ fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Top Products */}
              {purchaseHistory.top_products?.length > 0 && (
                <Card 
                  title="Top Purchased Products" 
                  style={{ marginBottom: window.innerWidth <= 768 ? 16 : 24 }}
                  bodyStyle={{ padding: window.innerWidth <= 768 ? '12px' : '24px' }}
                >
                  <Table
                    dataSource={purchaseHistory.top_products}
                    rowKey="product_name"
                    pagination={false}
                    size={window.innerWidth <= 768 ? 'small' : 'middle'}
                    scroll={{ x: 'max-content' }}
                    columns={[
                      {
                        title: 'Product',
                        dataIndex: 'product_name',
                        key: 'product_name',
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'total_quantity',
                        key: 'total_quantity',
                        render: (qty) => <Tag color="blue">{qty}</Tag>,
                      },
                    ]}
                  />
                </Card>
              )}

              {/* Order History */}
              <Card 
                title={`Order History (${purchaseHistory.orders?.length || 0})`}
                bodyStyle={{ padding: window.innerWidth <= 768 ? '12px' : '24px' }}
              >
                {purchaseHistory.orders?.length > 0 ? (
                  <Table
                    dataSource={purchaseHistory.orders}
                    rowKey="_id"
                    pagination={{ pageSize: 5, simple: window.innerWidth <= 768 }}
                    size={window.innerWidth <= 768 ? 'small' : 'middle'}
                    scroll={{ x: 'max-content' }}
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'created_at',
                        key: 'created_at',
                        render: (date) => new Date(date).toLocaleDateString(),
                      },
                      {
                        title: 'Items',
                        dataIndex: 'items',
                        key: 'items',
                        render: (items) => items?.length || 0,
                        responsive: ['sm']
                      },
                      {
                        title: 'Total (UGX)',
                        dataIndex: 'total_amount_ugx',
                        key: 'total_amount_ugx',
                        render: (amount) => amount?.toLocaleString() || 0,
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => (
                          <Tag color={status === 'completed' ? 'success' : status === 'processing' ? 'processing' : 'warning'}>
                            {status?.toUpperCase()}
                          </Tag>
                        ),
                      },
                    ]}
                  />
                ) : (
                  <Empty description="No orders found" />
                )}
              </Card>
            </div>
          )}
        </Drawer>

        <AdvancedSearchDrawer
          visible={searchDrawerVisible}
          onClose={() => setSearchDrawerVisible(false)}
          onApply={applyFilters}
          fields={[
            { name: 'name', label: 'Customer Name', type: 'input' },
            { name: 'phone', label: 'Phone Number', type: 'input' },
            { name: 'email', label: 'Email', type: 'input' }
          ]}
        />
      </div>
    </Spin>
  )
}

export default Customers
