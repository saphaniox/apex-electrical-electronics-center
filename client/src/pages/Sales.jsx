import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Input, InputNumber, Modal, message, Space, Spin, Popconfirm, Tooltip, Empty, Select, Tag, Timeline, Drawer, Descriptions } from 'antd'
import { PlusOutlined, DeleteOutlined, DownloadOutlined, PrinterOutlined, FilePdfOutlined, EditOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, UserOutlined, HistoryOutlined, FilterOutlined } from '@ant-design/icons'
import { salesAPI, productsAPI, exportToCSV } from '../services/api'
import { printTable, printSalesOrder, exportDataToPDFTable } from '../utils/printUtils'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import AdvancedSearchDrawer from '../components/AdvancedSearchDrawer'
import BackToTop from '../components/BackToTop'

function Sales() {
  const { user } = useAuthStore()
  const [salesOrderList, setSalesOrderList] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [saleOrderForm] = Form.useForm()
  const [selectedOrderItems, setSelectedOrderItems] = useState([])
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 50, total: 0 })
  const [editingOrderId, setEditingOrderId] = useState(null)
  const [originalStatus, setOriginalStatus] = useState(null)
  const [auditDrawerVisible, setAuditDrawerVisible] = useState(false)
  const [selectedOrderHistory, setSelectedOrderHistory] = useState(null)
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  // Check if user can create/edit sales orders
  const canCreateOrder = ['admin', 'manager', 'sales'].includes(user?.role)

  useEffect(() => {
    fetchAllSalesOrders()
    fetchAllAvailableProducts()
  }, [tablePageInfo.page])

  // Fetch all sales orders with pagination
  const fetchAllSalesOrders = async () => {
    try {
      setIsLoading(true)
      const response = await salesAPI.getAll(tablePageInfo.page, tablePageInfo.limit)
      setSalesOrderList(response.data.data || [])
      setTablePageInfo(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
    } catch (error) {
      message.error('Failed to fetch sales orders')
      setSalesOrderList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters to sales orders
  const applyFilters = (filters) => {
    setActiveFilters(filters)
  }

  // Get filtered sales orders
  const getFilteredSalesOrders = () => {
    let filtered = [...salesOrderList]
    
    if (activeFilters.customer_name) {
      filtered = filtered.filter(order => 
        order.customer_name?.toLowerCase().includes(activeFilters.customer_name.toLowerCase())
      )
    }
    
    if (activeFilters.customer_phone) {
      filtered = filtered.filter(order => 
        order.customer_phone?.includes(activeFilters.customer_phone)
      )
    }
    
    if (activeFilters.status) {
      filtered = filtered.filter(order => order.status === activeFilters.status)
    }
    
    if (activeFilters.dateRange && activeFilters.dateRange.length === 2) {
      const [startDate, endDate] = activeFilters.dateRange
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.order_date)
        return orderDate >= startDate && orderDate <= endDate
      })
    }
    
    return filtered
  }

  // Fetch all available products for order selection
  const fetchAllAvailableProducts = async () => {
    try {
      const response = await productsAPI.getAll(1, 100)
      setAvailableProducts(response.data.data || [])
    } catch (error) {
      message.error('Unable to load products. Please check your connection and try again.')
    }
  }

  // Show modal for creating new sales order
  const showSalesOrderModal = () => {
    saleOrderForm.resetFields()
    saleOrderForm.setFieldsValue({ status: 'pending' })
    setSelectedOrderItems([])
    setEditingOrderId(null)
    setOriginalStatus(null)
    setIsModalVisible(true)
  }

  // Show modal for editing existing sales order
  const showEditSalesOrderModal = (order) => {
    setEditingOrderId(order._id)
    setOriginalStatus(order.status)
    saleOrderForm.setFieldsValue({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      status: order.status
    })
    setSelectedOrderItems(order.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    })))
    setIsModalVisible(true)
  }

  // Add a new line item to the current order
  const addOrderLineItem = () => {
    setSelectedOrderItems([...selectedOrderItems, { product_id: null, quantity: 1, custom_price: null }])
  }

  // Remove a line item from the current order
  const removeOrderLineItem = (index) => {
    setSelectedOrderItems(selectedOrderItems.filter((_, i) => i !== index))
  }

  // Update line item
  const updateOrderLineItem = (index, field, value) => {
    const updatedItems = [...selectedOrderItems]
    updatedItems[index][field] = value
    setSelectedOrderItems(updatedItems)
  }

  // Handle sales order form submission (create or update)
  const handleSaveSalesOrder = async () => {
    try {
      const values = await saleOrderForm.validateFields()
      
      if (selectedOrderItems.length === 0) {
        message.error('Please add at least one product item to the order')
        return
      }
      
      const orderData = {
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        items: selectedOrderItems,
        status: values.status || 'completed',
        currency: values.currency || 'UGX'
      }

      if (editingOrderId) {
        // Update existing order
        await salesAPI.update(editingOrderId, orderData)
        message.success('Sales order updated successfully')
      } else {
        // Create new order
        await salesAPI.create(orderData)
        message.success('Sales order created successfully')
      }
      
      setIsModalVisible(false)
      setTablePageInfo(prev => ({ ...prev, page: 1 }))
      fetchAllSalesOrders()
    } catch (error) {
      message.error(error.response?.data?.error || `Failed to ${editingOrderId ? 'update' : 'create'} sales order`)
    }
  }

  // Export sales orders as CSV file
  const handleExportSalesOrdersCSV = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredSalesOrders()
      if (filteredData.length === 0) {
        message.warning('No sales orders to export')
        return
      }
      const exportFormattedData = filteredData.map(s => ({
        'Order ID': s._id,
        'Customer Name': s.customer_name,
        'Customer Phone': s.customer_phone,
        'Items Count': s.items?.length || 0,
        'Total Amount (UGX)': s.total_amount,
        'Status': s.status,
        'Date': new Date(s.order_date).toLocaleDateString()
      }))
      exportToCSV(exportFormattedData, 'sales_orders.csv')
      message.success('Sales orders exported successfully')
    } catch (error) {
      message.error('Failed to export sales orders')
    } finally {
      setIsLoading(false)
    }
  }

  // Print sales orders table with formatting
  const handlePrintSalesOrdersTable = () => {
    const dataToUse = getFilteredSalesOrders()
    if (dataToUse.length === 0) {
      message.warning('No sales orders to print')
      return
    }
    printTable('sales-table', 'Sales Orders Report')
  }

  // Delete sales order (admin only)
  const handleDeleteSalesOrder = async (orderId) => {
    Modal.confirm({
      title: 'Delete Sales Order',
      content: 'Are you sure you want to delete this sales order? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await salesAPI.delete(orderId)
          message.success('Sales order deleted successfully')
          fetchAllSalesOrders()
        } catch (error) {
          message.error(error.response?.data?.error || 'Failed to delete sales order')
        }
      }
    })
  }

  // Export sales orders as PDF file with formatting
  const handleExportSalesOrdersPDF = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredSalesOrders()
      if (filteredData.length === 0) {
        message.warning('No sales orders to export')
        return
      }
      const exportFormattedData = filteredData.map(s => {
        const row = {
          'Order ID': s._id.substring(0, 8),
          'Customer Name': s.customer_name,
          'Customer Phone': s.customer_phone,
          'Items Count': s.items?.length || 0,
          'Total Amount (UGX)': s.total_amount?.toLocaleString() || '0',
          'Status': s.status
        }
        if (user?.role === 'admin') {
          row['Served By'] = s.served_by_username || '-'
        }
        row['Date'] = new Date(s.order_date).toLocaleDateString()
        return row
      })
      const columns = ['Order ID', 'Customer Name', 'Customer Phone', 'Items Count', 'Total Amount (UGX)', 'Status']
      if (user?.role === 'admin') {
        columns.push('Served By')
      }
      columns.push('Date')
      exportDataToPDFTable(
        exportFormattedData,
        'sales_orders.pdf',
        'Sales Orders Report',
        columns
      )
      message.success('Sales orders exported to PDF successfully')
    } catch (error) {
      message.error('Failed to export sales orders to PDF')
    } finally {
      setIsLoading(false)
    }
  }

  // Define table columns with sales order data
  const isMobile = window.innerWidth <= 768
  const isSmallMobile = window.innerWidth <= 480

  const tableColumns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => id.substring(0, 8),
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: isMobile ? '25%' : 'auto'
    },
    {
      title: 'Phone',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
      hidden: isSmallMobile
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => items?.length || 0,
      hidden: isSmallMobile,
      width: isMobile ? '12%' : 'auto'
    },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (total, record) => {
        const currency = record.currency || 'UGX';
        const symbol = currency === 'USD' ? '$' : 'UGX';
        const formatted = total?.toLocaleString() || 0;
        return currency === 'USD' ? `${symbol}${formatted}` : `${symbol} ${formatted}`;
      },
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      hidden: isMobile,
      width: isMobile ? '15%' : 'auto',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending' },
          processing: { color: 'processing', icon: <SyncOutlined spin />, text: 'Processing' },
          completed: { color: 'success', icon: <CheckCircleOutlined />, text: 'Completed' }
        }
        const config = statusConfig[status] || statusConfig.pending
        return (
          <Tag icon={config.icon} color={config.color} style={{ fontWeight: 500, padding: '4px 12px', fontSize: '13px' }}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Served By',
      dataIndex: 'served_by_username',
      key: 'served_by_username',
      hidden: isMobile || user?.role !== 'admin',
      render: (username) => username ? (
        <Space size="small">
          <UserOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{username}</span>
        </Space>
      ) : <span style={{ color: '#bfbfbf' }}>-</span>
    },
    {
      title: 'Date',
      dataIndex: 'order_date',
      key: 'order_date',
      render: (date) => new Date(date).toLocaleDateString(),
      hidden: isSmallMobile,
      width: isMobile ? '15%' : 'auto'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '20%' : 'auto',
      className: 'actions-column no-print',
      render: (_, record) => (
        <Space size="small">
          {record.edit_history?.length > 0 && (
            <Tooltip title="View Edit History">
              <Button
                type="default"
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<HistoryOutlined />}
                onClick={() => {
                  setSelectedOrderHistory(record)
                  setAuditDrawerVisible(true)
                }}
                style={{ fontSize: isSmallMobile ? '10px' : '14px' }}
              >
                {!isSmallMobile && 'History'}
              </Button>
            </Tooltip>
          )}
          {canCreateOrder && (
            <Tooltip title={record.status === 'completed' && user?.role !== 'admin' ? 'Completed orders can only be edited by admin' : 'Edit Order'}>
              <Button
                type="default"
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<EditOutlined />}
                onClick={() => showEditSalesOrderModal(record)}
                disabled={record.status === 'completed' && user?.role !== 'admin'}
                style={{ fontSize: isSmallMobile ? '10px' : '14px' }}
              >
                {!isSmallMobile && 'Edit'}
              </Button>
            </Tooltip>
          )}
          {user?.role === 'admin' && (
            <Tooltip title="Delete Order">
              <Button
                danger
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSalesOrder(record._id)}
                style={{ fontSize: isSmallMobile ? '10px' : '14px' }}
              >
                {!isSmallMobile && 'Delete'}
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Print Sales Order">
            <Button
              type="primary"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<PrinterOutlined />}
              onClick={() => printSalesOrder(record)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px' }}
            >
              {!isSmallMobile && 'Print'}
            </Button>
          </Tooltip>
        </Space>
      ),
    }
  ].filter(col => !col.hidden)

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: window.innerWidth <= 768 ? '12px' : '20px' }}>
        <PageHeader
          title="Sales Orders"
          breadcrumbs={[{ label: 'Sales Orders' }]}
          extra={
            <Space wrap style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <Tooltip title="Filter sales orders">
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
                  <Tooltip title="Print all sales orders">
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={handlePrintSalesOrdersTable}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      Print
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to PDF">
                    <Button
                      icon={<FilePdfOutlined />}
                      onClick={handleExportSalesOrdersPDF}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportSalesOrdersCSV}
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
                    <Button icon={<PrinterOutlined />} size="small" onClick={handlePrintSalesOrdersTable} />
                    <Button icon={<FilePdfOutlined />} size="small" onClick={handleExportSalesOrdersPDF} />
                    <Button icon={<DownloadOutlined />} size="small" onClick={handleExportSalesOrdersCSV} />
                  </Button.Group>
                </Tooltip>
              )}
              {canCreateOrder && (
                <Tooltip title="Create new order">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showSalesOrderModal}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {!isMobile && 'New Order'}
                  </Button>
                </Tooltip>
              )}
            </Space>
          }
        />

        {salesOrderList.length === 0 && !isLoading ? (
          <Empty description="No sales orders found" style={{ marginTop: '48px' }} />
        ) : (
          <Table
            id="sales-table"
            columns={tableColumns}
            dataSource={getFilteredSalesOrders()}
            loading={isLoading}
            rowKey="_id"
            scroll={{ x: 'max-content' }}
            size={isMobile ? 'small' : 'middle'}
            pagination={{
              pageSize: tablePageInfo.limit,
              total: getFilteredSalesOrders().length,
              current: tablePageInfo.page,
              onChange: (page, pageSize) => setTablePageInfo(prev => ({ ...prev, page, limit: pageSize || prev.limit })),
              showTotal: (total) => `Total ${total} orders`,
              simple: isSmallMobile,
              showSizeChanger: !isMobile,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
          />
        )}

        <Modal
          title={editingOrderId ? "Edit Sales Order" : "Create New Sales Order"}
          open={isModalVisible}
          onOk={handleSaveSalesOrder}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingOrderId(null);
            setOriginalStatus(null);
          }}
          okText={editingOrderId ? "Update Order" : "Create Order"}
          width={isMobile ? '95vw' : 700}
          style={{ maxWidth: '95vw' }}
        >
          <Form
            form={saleOrderForm}
            layout="vertical"
            requiredMark="optional"
          >
            <Form.Item
              label="Customer Name"
              name="customer_name"
              rules={[{ required: true, message: 'Please enter customer name' }]}
            >
              <Input placeholder="e.g., Saphan" />
            </Form.Item>

            <Form.Item
              label="Customer Phone"
              name="customer_phone"
              rules={[{ required: true, message: 'Please enter customer phone number' }]}
            >
              <Input placeholder="e.g., 0700 000 000" />
            </Form.Item>

            <Form.Item
              label="Currency"
              name="currency"
              rules={[{ required: true, message: 'Please select currency' }]}
              initialValue="UGX"
            >
              <Select placeholder="Select currency">
                <Select.Option value="UGX">UGX (Ugandan Shilling)</Select.Option>
                <Select.Option value="USD">USD (US Dollar)</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Order Status"
              name="status"
              rules={[{ required: true, message: 'Please select order status' }]}
            >
              <Select placeholder="Select status" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>
                <Select.Option value="pending" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>Pending</Select.Option>
                <Select.Option value="processing" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>Processing</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
              </Select>
            </Form.Item>

            <div style={{ marginTop: '20px' }}>
              <h3>Order Line Items</h3>
              {selectedOrderItems.length === 0 && <p style={{ color: '#999' }}>No items added yet</p>}
              {selectedOrderItems.map((item, index) => {
                const selectedProduct = availableProducts.find(p => p._id === item.product_id);
                const defaultPrice = selectedProduct?.price || 0;
                
                return (
                  <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Select
                        showSearch
                        style={{ flex: '1 1 200px' }}
                        placeholder="Search and select product"
                        value={item.product_id || undefined}
                        onChange={(value) => {
                          const newItems = [...selectedOrderItems]
                          newItems[index].product_id = value
                          setSelectedOrderItems(newItems)
                        }}
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={availableProducts.map(p => ({
                          value: p._id,
                          label: `${p.name} - UGX ${p.price?.toLocaleString()} (Stock: ${p.quantity})`
                        }))}
                      />
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(value) => {
                          const newItems = [...selectedOrderItems]
                          newItems[index].quantity = value
                          setSelectedOrderItems(newItems)
                        }}
                        style={{ width: '100px' }}
                        placeholder="Qty"
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeOrderLineItem(index)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', minWidth: '140px' }}>
                        Default: UGX {defaultPrice.toLocaleString()}
                      </div>
                      <InputNumber
                        min={0}
                        value={item.custom_price}
                        onChange={(value) => {
                          const newItems = [...selectedOrderItems]
                          newItems[index].custom_price = value
                          setSelectedOrderItems(newItems)
                        }}
                        style={{ flex: 1, minWidth: '200px' }}
                        placeholder={`Custom price (or use default UGX ${defaultPrice.toLocaleString()})`}
                        formatter={value => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      />
                    </div>
                  </div>
                );
              })}
              <Button
                type="dashed"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={addOrderLineItem}
              >
                + Add Line Item
              </Button>
            </div>
          </Form>
        </Modal>

        {/* Audit Trail Drawer */}
        <Drawer
          title={
            <Space>
              <HistoryOutlined />
              <span>Edit History - Order {selectedOrderHistory?._id?.substring(0, 8)}</span>
            </Space>
          }
          width={window.innerWidth > 768 ? 700 : '95vw'}
          open={auditDrawerVisible}
          onClose={() => {
            setAuditDrawerVisible(false)
            setSelectedOrderHistory(null)
          }}
        >
          {selectedOrderHistory && (
            <div>
              <Descriptions bordered size="small" column={1} style={{ marginBottom: 20 }}>
                <Descriptions.Item label="Customer">{selectedOrderHistory.customer_name}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedOrderHistory.customer_phone}</Descriptions.Item>
                <Descriptions.Item label="Order Date">
                  {new Date(selectedOrderHistory.order_date).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Current Status">
                  <Tag color={
                    selectedOrderHistory.status === 'completed' ? 'success' : 
                    selectedOrderHistory.status === 'processing' ? 'processing' : 'warning'
                  }>
                    {selectedOrderHistory.status?.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              <h3 style={{ marginBottom: 16 }}>Edit Timeline</h3>
              <Timeline
                mode="left"
                items={selectedOrderHistory.edit_history?.map((edit, index) => ({
                  color: 'blue',
                  children: (
                    <div key={index}>
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        <UserOutlined /> {edit.edited_by_username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: 8 }}>
                        {new Date(edit.edited_at).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 8 }}>
                        {edit.changes.map((change, idx) => (
                          <div key={idx} style={{ marginBottom: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                            <strong>Field:</strong> <Tag>{change.field}</Tag>
                            <br />
                            {change.field !== 'items' && change.field !== 'total_amount' ? (
                              <>
                                <div style={{ marginTop: 4 }}>
                                  <strong>Old Value:</strong> {String(change.old_value)}
                                </div>
                                <div style={{ marginTop: 4 }}>
                                  <strong>New Value:</strong> <span style={{ color: '#52c41a', fontWeight: 500 }}>{String(change.new_value)}</span>
                                </div>
                              </>
                            ) : (
                              <div style={{ marginTop: 4 }}>
                                <em>{change.field === 'items' ? 'Items modified' : 'Total amount recalculated'}</em>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }))}
              />
            </div>
          )}
        </Drawer>

        <AdvancedSearchDrawer
          visible={searchDrawerVisible}
          onClose={() => setSearchDrawerVisible(false)}
          onApply={applyFilters}
          fields={[
            { name: 'customer_name', label: 'Customer Name', type: 'input' },
            { name: 'customer_phone', label: 'Customer Phone', type: 'input' },
            { 
              name: 'status', 
              label: 'Status', 
              type: 'select',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'processing', label: 'Processing' },
                { value: 'completed', label: 'Completed' }
              ]
            }
          ]}
        />
      </div>
    </Spin>
  )
}

export default Sales