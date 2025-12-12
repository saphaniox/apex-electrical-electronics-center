import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Input, InputNumber, Modal, message, Space, Select, Spin, Tooltip, Empty, Radio, Divider, Tag } from 'antd'
import { PlusOutlined, DownloadOutlined, PrinterOutlined, FilePdfOutlined, DeleteOutlined, EditOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, UserOutlined, FilterOutlined } from '@ant-design/icons'
import { invoicesAPI, salesAPI, productsAPI, exportToCSV } from '../services/api'
import { printInvoice, exportDataToPDFTable } from '../utils/printUtils'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import AdvancedSearchDrawer from '../components/AdvancedSearchDrawer'
import BackToTop from '../components/BackToTop'

function Invoices() {
  const { user } = useAuthStore()
  const [invoiceList, setInvoiceList] = useState([])
  const [availableSalesOrders, setAvailableSalesOrders] = useState([])
  const [availableProducts, setAvailableProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [invoiceForm] = Form.useForm()
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 10, total: 0 })
  const [invoiceMode, setInvoiceMode] = useState('sales_order') // 'sales_order' or 'direct'
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState([])
  const [editingInvoiceId, setEditingInvoiceId] = useState(null)
  const [originalStatus, setOriginalStatus] = useState(null)
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  // Check if user can create invoices based on role
  const canCreateInvoice = ['admin', 'manager', 'sales'].includes(user?.role)

  useEffect(() => {
    fetchAllInvoices()
    fetchAllSalesOrders()
    fetchAllProducts()
  }, [tablePageInfo.page])

  // Fetch all invoices with pagination
  const fetchAllInvoices = async () => {
    try {
      setIsLoading(true)
      const response = await invoicesAPI.getAll(tablePageInfo.page, tablePageInfo.limit)
      setInvoiceList(response.data.data || [])
      setTablePageInfo(prev => ({ ...prev, total: response.data.pagination?.total || 0 }))
    } catch (error) {
      message.error('Failed to fetch invoices')
      setInvoiceList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters to invoices
  const applyFilters = (filters) => {
    setActiveFilters(filters)
  }

  // Get filtered invoices
  const getFilteredInvoices = () => {
    let filtered = [...invoiceList]
    
    if (activeFilters.customer_name) {
      filtered = filtered.filter(invoice => 
        invoice.customer_name?.toLowerCase().includes(activeFilters.customer_name.toLowerCase())
      )
    }
    
    if (activeFilters.payment_status) {
      filtered = filtered.filter(invoice => invoice.payment_status === activeFilters.payment_status)
    }
    
    if (activeFilters.dateRange && activeFilters.dateRange.length === 2) {
      const [startDate, endDate] = activeFilters.dateRange
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.invoice_date)
        return invoiceDate >= startDate && invoiceDate <= endDate
      })
    }
    
    return filtered
  }

  // Fetch all available sales orders for invoice generation
  const fetchAllSalesOrders = async () => {
    try {
      const response = await salesAPI.getAll(1, 10000)
      setAvailableSalesOrders(response.data.data || [])
    } catch (error) {
      message.error('Failed to fetch sales orders')
    }
  }

  // Fetch all available products for direct invoice creation
  const fetchAllProducts = async () => {
    try {
      const response = await productsAPI.getAll(1, 10000)
      setAvailableProducts(response.data.data || [])
    } catch (error) {
      message.error('Failed to fetch products')
    }
  }

  // Show modal for creating new invoice
  const showInvoiceModal = () => {
    invoiceForm.resetFields()
    invoiceForm.setFieldsValue({ status: 'pending' })
    setInvoiceMode('sales_order')
    setSelectedInvoiceItems([])
    setEditingInvoiceId(null)
    setOriginalStatus(null)
    setIsModalVisible(true)
  }

  // Show modal for editing existing invoice
  const showEditInvoiceModal = (invoice) => {
    setEditingInvoiceId(invoice._id)
    setOriginalStatus(invoice.status)
    setInvoiceMode('direct') // Always use direct mode for editing
    
    // Pre-fill form
    invoiceForm.setFieldsValue({
      customer_name: invoice.customer_name,
      customer_phone: invoice.customer_phone,
      notes: invoice.notes,
      status: invoice.status
    })
    
    // Pre-fill items
    setSelectedInvoiceItems(invoice.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    })))
    
    setIsModalVisible(true)
  }

  // Add a new line item to the invoice
  const addInvoiceLineItem = () => {
    setSelectedInvoiceItems([...selectedInvoiceItems, { product_id: null, quantity: 1, custom_price: null }])
  }

  // Remove a line item from the invoice
  const removeInvoiceLineItem = (index) => {
    setSelectedInvoiceItems(selectedInvoiceItems.filter((_, i) => i !== index))
  }

  // Update line item
  const updateInvoiceLineItem = (index, field, value) => {
    const updatedItems = [...selectedInvoiceItems]
    updatedItems[index][field] = value
    setSelectedInvoiceItems(updatedItems)
  }

  // Handle invoice generation form submission
  const handleGenerateInvoice = async () => {
    try {
      const values = await invoiceForm.validateFields()
      
      let invoiceData = {
        notes: values.notes,
        status: values.status || 'pending'
      }

      if (invoiceMode === 'sales_order' && !editingInvoiceId) {
        // Generate from sales order (only for new invoices)
        invoiceData.sales_order_id = values.sales_order_id
      } else {
        // Generate directly with products OR editing existing invoice
        if (selectedInvoiceItems.length === 0) {
          message.error('Please add at least one product to the invoice')
          return
        }

        invoiceData.customer_name = values.customer_name
        invoiceData.customer_phone = values.customer_phone
        invoiceData.items = selectedInvoiceItems
        invoiceData.currency = values.currency || 'UGX'
      }
      
      if (editingInvoiceId) {
        // Update existing invoice
        await invoicesAPI.update(editingInvoiceId, invoiceData)
        message.success('Invoice updated successfully')
      } else {
        // Create new invoice
        await invoicesAPI.generate(invoiceData)
        message.success('Invoice generated successfully')
      }
      
      setIsModalVisible(false)
      setEditingInvoiceId(null)
      setTablePageInfo(prev => ({ ...prev, page: 1 }))
      fetchAllInvoices()
    } catch (error) {
      message.error(error.response?.data?.error || `Failed to ${editingInvoiceId ? 'update' : 'generate'} invoice`)
    }
  }

  // Download invoice as PDF file
  const handleDownloadInvoicePDF = (invoiceId) => {
    invoicesAPI.download(invoiceId)
  }

  // Print invoice with formatting
  const handlePrintInvoice = (invoice) => {
    printInvoice(invoice)
  }

  // Export all invoices as CSV file
  const handleExportInvoicesCSV = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredInvoices()
      
      if (filteredData.length === 0) {
        message.warning('No invoices to export')
        setIsLoading(false)
        return
      }
      
      const exportFormattedData = filteredData.map(inv => ({
        'Invoice #': inv.invoice_number,
        'Customer Name': inv.customer_name,
        'Customer Phone': inv.customer_phone,
        'Total Amount (UGX)': inv.total_amount,
        'Status': inv.status,
        'Date': new Date(inv.created_at).toLocaleDateString()
      }))
      exportToCSV(exportFormattedData, 'invoices.csv')
      message.success('Invoices exported successfully')
    } catch (error) {
      message.error('Failed to export invoices')
    } finally {
      setIsLoading(false)
    }
  }

  // Export all invoices as PDF file with formatting
  const handleExportInvoicesPDF = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredInvoices()
      
      if (filteredData.length === 0) {
        message.warning('No invoices to export')
        setIsLoading(false)
        return
      }
      
      const exportFormattedData = filteredData.map(inv => {
        const row = {
          'Invoice #': inv.invoice_number,
          'Customer Name': inv.customer_name,
          'Customer Phone': inv.customer_phone,
          'Total Amount (UGX)': inv.total_amount?.toLocaleString() || '0',
          'Status': inv.status
        }
        if (user?.role === 'admin') {
          row['Served By'] = inv.served_by_username || '-'
        }
        row['Date'] = new Date(inv.created_at).toLocaleDateString()
        return row
      })
      const columns = ['Invoice #', 'Customer Name', 'Customer Phone', 'Total Amount (UGX)', 'Status']
      if (user?.role === 'admin') {
        columns.push('Served By')
      }
      columns.push('Date')
      exportDataToPDFTable(
        exportFormattedData,
        'invoices.pdf',
        'Invoices Report',
        columns
      )
      message.success('Invoices exported to PDF successfully')
    } catch (error) {
      message.error('Failed to export invoices to PDF')
    } finally {
      setIsLoading(false)
    }
  }

  // Delete invoice (admin only)
  const handleDeleteInvoice = async (invoiceId) => {
    Modal.confirm({
      title: 'Delete Invoice',
      content: 'Are you sure you want to delete this invoice? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await invoicesAPI.delete(invoiceId)
          message.success('Invoice deleted successfully')
          fetchAllInvoices()
        } catch (error) {
          message.error(error.response?.data?.error || 'Failed to delete invoice')
        }
      }
    })
  }

  // Define table columns with invoice data and actions
  const isMobile = window.innerWidth <= 768
  const isSmallMobile = window.innerWidth <= 480

  const tableColumns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoice_number',
      key: 'invoice_number',
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      width: isMobile ? '25%' : 'auto'
    },
    {
      title: 'Amount',
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
      hidden: isSmallMobile,
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
      hidden: isSmallMobile || user?.role !== 'admin',
      render: (username) => username ? (
        <Space size="small">
          <UserOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{username}</span>
        </Space>
      ) : <span style={{ color: '#bfbfbf' }}>-</span>
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
      hidden: isSmallMobile,
      width: isMobile ? '15%' : 'auto'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '25%' : 'auto',
      render: (_, record) => (
        <Space size={isSmallMobile ? 0 : 'small'}>
          {canCreateInvoice && (
            <Tooltip title={record.status === 'completed' && user?.role !== 'admin' ? 'Completed invoices can only be edited by admin' : 'Edit'}>
              <Button
                type="default"
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<EditOutlined />}
                onClick={() => showEditInvoiceModal(record)}
                disabled={record.status === 'completed' && user?.role !== 'admin'}
                style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
              >
                {!isSmallMobile && 'Edit'}
              </Button>
            </Tooltip>
          )}
          {user?.role === 'admin' && (
            <Tooltip title="Delete Invoice">
              <Button
                danger
                size={isSmallMobile ? 'small' : 'middle'}
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteInvoice(record._id)}
                style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
              >
                {!isSmallMobile && 'Del'}
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Print">
            <Button
              type="primary"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<PrinterOutlined />}
              onClick={() => handlePrintInvoice(record)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
            >
              {!isSmallMobile && 'Print'}
            </Button>
          </Tooltip>
          <Tooltip title="Download">
            <Button
              type="dashed"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadInvoicePDF(record._id)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
            >
              {!isSmallMobile && 'DL'}
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ].filter(col => !col.hidden)

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: '20px' }}>
        <PageHeader
          title="Invoices"
          breadcrumbs={[{ label: 'Invoices' }]}
          extra={
            <Space wrap style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <Tooltip title="Filter invoices">
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
                  <Tooltip title="Export to PDF">
                    <Button
                      icon={<FilePdfOutlined />}
                      onClick={handleExportInvoicesPDF}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportInvoicesCSV}
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
                    <Button icon={<FilePdfOutlined />} size="small" onClick={handleExportInvoicesPDF} />
                    <Button icon={<DownloadOutlined />} size="small" onClick={handleExportInvoicesCSV} />
                  </Button.Group>
                </Tooltip>
              )}
              {canCreateInvoice && (
                <Tooltip title="Generate invoice">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showInvoiceModal}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {!isMobile && 'Generate Invoice'}
                  </Button>
                </Tooltip>
              )}
            </Space>
          }
        />

        {invoiceList.length === 0 && !isLoading ? (
          <Empty description="No invoices found" style={{ marginTop: '48px' }} />
        ) : (
          <Table
            columns={tableColumns}
            dataSource={getFilteredInvoices()}
            loading={isLoading}
            rowKey="_id"
            pagination={{
              pageSize: tablePageInfo.limit,
              total: getFilteredInvoices().length,
              current: tablePageInfo.page,
              onChange: (page) => setTablePageInfo(prev => ({ ...prev, page })),
              showTotal: (total) => `Total ${total} invoices`
            }}
          />
        )}

        <Modal
          title={editingInvoiceId ? "Edit Invoice" : "Generate New Invoice"}
          open={isModalVisible}
          onOk={handleGenerateInvoice}
          onCancel={() => {
            setIsModalVisible(false);
            setEditingInvoiceId(null);
            setOriginalStatus(null);
          }}
          okText={editingInvoiceId ? "Update Invoice" : "Generate Invoice"}
          width={isMobile ? '95vw' : 700}
          style={{ maxWidth: '95vw' }}
        >
          <Form
            form={invoiceForm}
            layout="vertical"
            requiredMark="optional"
          >
            {!editingInvoiceId && (
              <Form.Item label="Invoice Type">
                <Radio.Group 
                  value={invoiceMode} 
                  onChange={(e) => {
                    setInvoiceMode(e.target.value)
                    invoiceForm.resetFields()
                    setSelectedInvoiceItems([])
                  }}
                  buttonStyle="solid"
                >
                  <Radio.Button value="sales_order">From Sales Order</Radio.Button>
                  <Radio.Button value="direct">Direct Invoice</Radio.Button>
                </Radio.Group>
              </Form.Item>
            )}

            <Divider />

            {invoiceMode === 'sales_order' && !editingInvoiceId ? (
              // Mode 1: Generate from existing sales order
              <Form.Item
                label="Select Sales Order"
                name="sales_order_id"
                rules={[{ required: true, message: 'Please select a sales order' }]}
              >
                <Select placeholder="Select sales order" size="large">
                  {availableSalesOrders.map(s => {
                    const currency = s.currency || 'UGX';
                    const symbol = currency === 'USD' ? '$' : 'UGX';
                    const amount = currency === 'USD' 
                      ? `${symbol}${s.total_amount?.toLocaleString()}` 
                      : `${symbol} ${s.total_amount?.toLocaleString()}`;
                    return (
                      <Select.Option key={s._id} value={s._id}>
                        {s.customer_name} - {s.items?.length || 0} items - {amount}
                      </Select.Option>
                    );
                  })}
                </Select>
              </Form.Item>
            ) : (
              // Mode 2: Create invoice directly with products
              <>
                <Form.Item
                  label="Customer Name"
                  name="customer_name"
                  rules={[{ required: true, message: 'Please enter customer name' }]}
                >
                  <Input placeholder="e.g., Saphan" size="large" />
                </Form.Item>

                <Form.Item
                  label="Customer Phone"
                  name="customer_phone"
                  rules={[{ required: true, message: 'Please enter customer phone' }]}
                >
                  <Input placeholder="e.g., 0700 000 000" size="large" />
                </Form.Item>

                <Form.Item
                  label="Currency"
                  name="currency"
                  rules={[{ required: true, message: 'Please select currency' }]}
                  initialValue="UGX"
                >
                  <Select placeholder="Select currency" size="large">
                    <Select.Option value="UGX">UGX (Ugandan Shilling)</Select.Option>
                    <Select.Option value="USD">USD (US Dollar)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Products">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {selectedInvoiceItems.map((item, index) => {
                      const selectedProduct = availableProducts.find(p => p._id === item.product_id);
                      const defaultPrice = selectedProduct?.price || 0;
                      
                      return (
                        <div key={index} style={{ marginBottom: '16px', padding: '12px', border: '1px solid #f0f0f0', borderRadius: '8px', backgroundColor: '#fafafa', width: '100%' }}>
                          <Space style={{ width: '100%', marginBottom: 8 }} wrap>
                            <Select
                              placeholder="Select product"
                              value={item.product_id}
                              onChange={(value) => updateInvoiceLineItem(index, 'product_id', value)}
                              style={{ width: isMobile ? 150 : 250 }}
                            >
                              {availableProducts.map(p => (
                                <Select.Option key={p._id} value={p._id}>
                                  {p.name} - UGX {p.price?.toLocaleString()}
                                </Select.Option>
                              ))}
                            </Select>
                            <InputNumber
                              min={1}
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(value) => updateInvoiceLineItem(index, 'quantity', value)}
                              style={{ width: isMobile ? 60 : 80 }}
                            />
                            <Button
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => removeInvoiceLineItem(index)}
                            />
                          </Space>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px' }}>
                            <div style={{ fontSize: '12px', color: '#8c8c8c', minWidth: '140px' }}>
                              Default: UGX {defaultPrice.toLocaleString()}
                            </div>
                            <InputNumber
                              min={0}
                              value={item.custom_price}
                              onChange={(value) => updateInvoiceLineItem(index, 'custom_price', value)}
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
                      onClick={addInvoiceLineItem}
                      icon={<PlusOutlined />}
                      style={{ width: '100%' }}
                    >
                      Add Product
                    </Button>
                  </Space>
                </Form.Item>
              </>
            )}

            <Form.Item
              label="Invoice Status"
              name="status"
              rules={[{ required: true, message: 'Please select invoice status' }]}
            >
              <Select placeholder="Select status" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>
                <Select.Option value="pending" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>Pending</Select.Option>
                <Select.Option value="processing" disabled={originalStatus === 'completed' && user?.role !== 'admin'}>Processing</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Notes (Optional)"
              name="notes"
            >
              <Input.TextArea placeholder="Additional notes for invoice" rows={4} />
            </Form.Item>
          </Form>
        </Modal>

        <AdvancedSearchDrawer
          visible={searchDrawerVisible}
          onClose={() => setSearchDrawerVisible(false)}
          onApply={applyFilters}
          fields={[
            { name: 'customer_name', label: 'Customer Name', type: 'input' },
            { 
              name: 'payment_status', 
              label: 'Payment Status', 
              type: 'select',
              options: [
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'overdue', label: 'Overdue' }
              ]
            }
          ]}
        />
      </div>
    </Spin>
  )
}

export default Invoices