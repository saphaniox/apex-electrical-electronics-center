import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Input, InputNumber, Modal, message, Space, Spin, Popconfirm, Tooltip, Empty, Tabs, Card, Statistic, Row, Col, Tag, Alert, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, PrinterOutlined, FilePdfOutlined, TrophyOutlined, FallOutlined, BarChartOutlined, WarningOutlined, ExclamationCircleOutlined, FilterOutlined } from '@ant-design/icons'
import { productsAPI, exportToCSV } from '../services/api'
import { printTable, exportDataToPDFTable } from '../utils/printUtils'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import AdvancedSearchDrawer from '../components/AdvancedSearchDrawer'
import BackToTop from '../components/BackToTop'

function Products() {
  const { user } = useAuthStore()
  const [productList, setProductList] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [productForm] = Form.useForm()
  const [tablePageInfo, setTablePageInfo] = useState({ page: 1, limit: 50, total: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [demandData, setDemandData] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [lowStockCount, setLowStockCount] = useState(0)
  const [searchDrawerVisible, setSearchDrawerVisible] = useState(false)
  const [activeFilters, setActiveFilters] = useState({})

  // Check if user can perform admin actions based on role
  const canEdit = user?.role === 'admin'
  const canDelete = user?.role === 'admin'

  useEffect(() => {
    fetchAllProducts()
    fetchProductDemand()
  }, [searchQuery])

  // Fetch all products without pagination
  const fetchAllProducts = async () => {
    try {
      setIsLoading(true)
      const response = await productsAPI.getAll(1, 10000, searchQuery)
      const products = response.data.data || []
      setProductList(products)
      setTablePageInfo(prev => ({ ...prev, total: response.data.pagination?.total || products.length }))
      
      // Count low stock items
      const lowStock = products.filter(p => p.is_low_stock || p.quantity <= (p.low_stock_threshold || 10))
      setLowStockCount(lowStock.length)
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to load products. Please refresh the page.')
      setProductList([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch product demand analytics
  const fetchProductDemand = async () => {
    try {
      const response = await productsAPI.getDemand()
      setDemandData(response.data)
    } catch (error) {
      console.error('Failed to fetch demand data:', error)
    }
  }

  // Apply filters to products
  const applyFilters = (filters) => {
    setActiveFilters(filters)
  }

  // Get filtered products
  const getFilteredProducts = () => {
    let filtered = [...productList]
    
    if (activeFilters.name) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(activeFilters.name.toLowerCase())
      )
    }
    
    if (activeFilters.sku) {
      filtered = filtered.filter(product => 
        product.sku?.toLowerCase().includes(activeFilters.sku.toLowerCase())
      )
    }
    
    if (activeFilters.price_min !== undefined) {
      filtered = filtered.filter(product => product.price >= activeFilters.price_min)
    }
    
    if (activeFilters.price_max !== undefined) {
      filtered = filtered.filter(product => product.price <= activeFilters.price_max)
    }
    
    if (activeFilters.stock_level) {
      if (activeFilters.stock_level === 'low') {
        filtered = filtered.filter(product => product.quantity <= (product.low_stock_threshold || 10))
      } else if (activeFilters.stock_level === 'in_stock') {
        filtered = filtered.filter(product => product.quantity > (product.low_stock_threshold || 10))
      } else if (activeFilters.stock_level === 'out_of_stock') {
        filtered = filtered.filter(product => product.quantity === 0)
      }
    }
    
    return filtered
  }

  // Show form modal for creating or editing a product
  const showProductModal = (product = null) => {
    if (product) {
      setSelectedProductId(product._id)
      productForm.setFieldsValue({
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price || 0,
        quantity: product.quantity,
        sku: product.sku,
        low_stock_threshold: product.low_stock_threshold || 10
      })
    } else {
      setSelectedProductId(null)
      productForm.resetFields()
    }
    setIsModalVisible(true)
  }

  // Handle product form submission (create or update)
  const handleSaveProduct = async () => {
    try {
      const values = await productForm.validateFields()
      
      if (selectedProductId) {
        await productsAPI.update(selectedProductId, values)
        message.success('✅ Product updated successfully!')
      } else {
        await productsAPI.create(values)
        message.success('✅ New product added to inventory!')
      }
      
      setIsModalVisible(false)
      setTablePageInfo(prev => ({ ...prev, page: 1 }))
      fetchAllProducts()
    } catch (error) {
      message.error(error.response?.data?.error || 'Unable to save product. Please check all fields and try again.')
    }
  }

  // Delete a product after confirmation
  const handleDeleteProduct = (productId) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to permanently delete this product? This action cannot be undone and will remove all product history.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'No, Keep It',
      onOk: async () => {
        try {
          await productsAPI.delete(productId)
          message.success('🗑️ Product deleted successfully')
          fetchAllProducts()
        } catch (error) {
          message.error('Unable to delete product. It may be referenced in existing orders.')
        }
      }
    })
  }

  // Export all products as CSV file
  const handleExportProductsCSV = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredProducts()
      if (filteredData.length === 0) {
        message.warning('No products available to export. Try adjusting your filters or adding products first.')
        return
      }
      const exportFormattedData = filteredData.map(p => ({
        'Product Name': p.name,
        'SKU': p.sku,
        'Description': p.description,
        'Price (UGX)': p.price,
        'Cost Price (UGX)': p.cost_price || 0,
        'Profit (UGX)': p.profit || 0,
        'Profit Margin (%)': p.profit_margin?.toFixed(2) || '0.00',
        'Quantity': p.quantity,
        'Created': new Date(p.created_at).toLocaleDateString()
      }))
      exportToCSV(exportFormattedData, 'products.csv')
      message.success('✅ Products exported to CSV successfully!')
    } catch (error) {
      message.error('Unable to export products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Print current products table with formatting
  const handlePrintProductsTable = () => {
    const dataToUse = getFilteredProducts()
    if (dataToUse.length === 0) {
      message.warning('No products available to print. Please add some products first.')
      return
    }
    printTable('products-table', 'Products Inventory List')
  }

  // Export products as PDF file with formatting
  const handleExportProductsPDF = async () => {
    try {
      setIsLoading(true)
      const filteredData = getFilteredProducts()
      if (filteredData.length === 0) {
        message.warning('No products to export')
        return
      }
      const exportFormattedData = filteredData.map(p => ({
        'Product Name': p.name,
        'SKU': p.sku,
        'Description': p.description,
        'Price (UGX)': p.price?.toLocaleString() || '0',
        'Profit Margin (%)': p.profit_margin?.toFixed(2) || '0.00',
        'Quantity': p.quantity,
        'Created': new Date(p.created_at).toLocaleDateString()
      }))
      exportDataToPDFTable(
        exportFormattedData,
        'products.pdf',
        'Products Inventory Report',
        ['Product Name', 'SKU', 'Description', 'Price (UGX)', 'Profit Margin (%)', 'Quantity', 'Created']
      )
      message.success('Products exported to PDF successfully')
    } catch (error) {
      message.error('Failed to export products to PDF')
    } finally {
      setIsLoading(false)
    }
  }

  // Define table columns with product data and actions
  const isMobile = window.innerWidth <= 768
  const isSmallMobile = window.innerWidth <= 480

  // Get demand level for a product
  const getProductDemand = (productId) => {
    if (!demandData) return null
    const product = demandData.all_products.find(p => p._id === productId)
    return product ? product.demand_level : null
  }

  // Get sales stats for a product
  const getProductStats = (productId) => {
    if (!demandData) return { total_sold: 0, order_count: 0 }
    const product = demandData.all_products.find(p => p._id === productId)
    return product ? { 
      total_sold: product.total_sold, 
      order_count: product.order_count,
      total_revenue: product.total_revenue
    } : { total_sold: 0, order_count: 0, total_revenue: 0 }
  }

  // Render demand badge
  const renderDemandBadge = (demandLevel) => {
    if (!demandLevel) return <Tag color="default">N/A</Tag>
    
    const colors = {
      high: 'green',
      medium: 'orange',
      low: 'blue',
      none: 'default'
    }
    
    const labels = {
      high: 'High Demand',
      medium: 'Medium',
      low: 'Low',
      none: 'No Sales'
    }
    
    return <Tag color={colors[demandLevel]}>{labels[demandLevel]}</Tag>
  }

  const tableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: isMobile ? '35%' : 'auto'
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      hidden: isSmallMobile
    },
    {
      title: 'Demand',
      key: 'demand',
      hidden: isMobile,
      render: (_, record) => {
        const demandLevel = getProductDemand(record._id)
        const stats = getProductStats(record._id)
        return (
          <Tooltip title={`Sold: ${stats.total_sold} units in ${stats.order_count} orders`}>
            {renderDemandBadge(demandLevel)}
          </Tooltip>
        )
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      hidden: isMobile,
      ellipsis: true
    },
    {
      title: 'Cost Price',
      dataIndex: 'cost_price',
      key: 'cost_price',
      render: (cost_price) => `UGX ${(cost_price || 0)?.toLocaleString?.() || 0}`,
      tooltip: 'Price you paid to buy this product',
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Selling Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `UGX ${price?.toLocaleString() || 0}`,
      width: isMobile ? '25%' : 'auto'
    },
    {
      title: 'Profit per Unit',
      dataIndex: 'profit',
      key: 'profit',
      hidden: isMobile,
      render: (profit, record) => {
        const profitValue = profit || 0
        const margin = record.profit_margin || 0
        const color = margin > 30 ? '#52c41a' : margin > 15 ? '#faad14' : '#ff4d4f'
        return (
          <Tooltip title={`Profit Margin: ${margin.toFixed(1)}% (Selling Price - Cost Price)`}>
            <span style={{ color, fontWeight: 500 }}>
              UGX {profitValue.toLocaleString()}
              <br />
              <small>({margin.toFixed(1)}%)</small>
            </span>
          </Tooltip>
        )
      }
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => {
        const threshold = record.low_stock_threshold || 10
        const isCritical = qty === 0
        const isLow = qty > 0 && qty <= threshold
        
        if (isCritical) {
          return (
            <Badge count={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}>
              <Tag color="error" icon={<WarningOutlined />} style={{ fontWeight: 'bold' }}>
                OUT OF STOCK
              </Tag>
            </Badge>
          )
        }
        
        if (isLow) {
          return (
            <Tag color="warning" icon={<WarningOutlined />} style={{ fontWeight: 'bold' }}>
              {qty} (Low Stock)
            </Tag>
          )
        }
        
        return <span style={{ color: '#52c41a', fontWeight: 'bold' }}>{qty}</span>
      },
      width: isMobile ? '20%' : 'auto'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: isMobile ? '20%' : 'auto',
      render: (_, record) => (
        <Space size={isSmallMobile ? 0 : 'small'}>
          <Tooltip title="Edit">
            <Button
              type="primary"
              size={isSmallMobile ? 'small' : 'middle'}
              icon={<EditOutlined />}
              disabled={!canEdit}
              onClick={() => showProductModal(record)}
              style={{ fontSize: isSmallMobile ? '10px' : '14px', padding: isSmallMobile ? '2px 4px' : '6px 16px' }}
            >
              {!isSmallMobile && 'Edit'}
            </Button>
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Product"
              description="Are you sure?"
              onConfirm={() => handleDeleteProduct(record._id)}
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
        {/* Low Stock Alert Banner */}
        {lowStockCount > 0 && (
          <Alert
            message={`Low Stock Alert: ${lowStockCount} product(s) need restocking`}
            description={window.innerWidth > 480 ? "Some products are running low on stock. Please review and restock soon." : "Products need restocking"}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            closable
            style={{ marginBottom: window.innerWidth <= 768 ? 16 : 20 }}
          />
        )}
        
        <PageHeader
          title="Products"
          breadcrumbs={[{ label: 'Products' }]}
          extra={
            <Space wrap style={{ justifyContent: 'flex-end', gap: '8px' }}>
              <Tooltip title="Filter products">
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
                  <Tooltip title="Print all products">
                    <Button
                      icon={<PrinterOutlined />}
                      onClick={handlePrintProductsTable}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      Print
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to PDF">
                    <Button
                      icon={<FilePdfOutlined />}
                      onClick={handleExportProductsPDF}
                      size={isMobile ? 'small' : 'middle'}
                    >
                      PDF
                    </Button>
                  </Tooltip>
                  <Tooltip title="Export to CSV">
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={handleExportProductsCSV}
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
                    <Button icon={<PrinterOutlined />} size="small" onClick={handlePrintProductsTable} />
                    <Button icon={<FilePdfOutlined />} size="small" onClick={handleExportProductsPDF} />
                    <Button icon={<DownloadOutlined />} size="small" onClick={handleExportProductsCSV} />
                  </Button.Group>
                </Tooltip>
              )}
              {canEdit && (
                <Tooltip title="Add new product">
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => showProductModal()}
                    size={isMobile ? 'small' : 'middle'}
                  >
                    {!isMobile && 'Add Product'}
                  </Button>
                </Tooltip>
              )}
            </Space>
          }
        />

        <div style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '20px' }}>
          <Input
            placeholder={window.innerWidth <= 480 ? "Search..." : "Search products..."}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setTablePageInfo(prev => ({ ...prev, page: 1 }))
            }}
            style={{ maxWidth: isMobile ? '100%' : '300px' }}
            size={isMobile ? 'middle' : 'large'}
          />
        </div>

        {demandData && (
          <Row gutter={{ xs: 8, sm: 12, md: 16 }} style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '20px' }}>
            <Col xs={12} sm={12} md={6}>
              <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                <Statistic
                  title="Total Products"
                  value={demandData.statistics.total_products}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                <Statistic
                  title="High Demand"
                  value={demandData.high_demand.length}
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#52c41a', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                <Statistic
                  title="Low Demand"
                  value={demandData.low_demand.length}
                  prefix={<FallOutlined />}
                  valueStyle={{ color: '#1890ff', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                />
              </Card>
            </Col>
            <Col xs={12} sm={12} md={6}>
              <Card bodyStyle={{ padding: window.innerWidth <= 768 ? '16px' : '24px' }}>
                <Statistic
                  title="No Sales Yet"
                  value={demandData.statistics.products_without_sales}
                  valueStyle={{ color: '#8c8c8c', fontSize: window.innerWidth <= 768 ? '20px' : '24px' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size={isMobile ? 'small' : 'large'}
          items={[
            {
              key: 'all',
              label: 'All Products',
              children: productList.length === 0 && !isLoading ? (
                <Empty description="No products found" style={{ marginTop: '48px' }} />
              ) : (
                <Table
                  id="products-table"
                  columns={tableColumns}
                  dataSource={getFilteredProducts()}
                  loading={isLoading}
                  rowKey="_id"
                  scroll={{ x: 'max-content' }}
                  size={isMobile ? 'small' : 'middle'}
                  pagination={{
                    pageSize: 100,
                    total: tablePageInfo.total,
                    showTotal: (total) => `Total ${total} products`,
                    simple: isSmallMobile,
                    showSizeChanger: !isMobile,
                    pageSizeOptions: ['50', '100', '200']
                  }}
                />
              )
            },
            {
              key: 'high-demand',
              label: (
                <span>
                  <TrophyOutlined /> High Demand
                </span>
              ),
              children: demandData ? (
                <Table
                  scroll={{ x: 'max-content' }}
                  size={isMobile ? 'small' : 'middle'}
                  columns={[
                    { title: 'Product Name', dataIndex: 'name', key: 'name' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku', responsive: ['sm'] },
                    { 
                      title: 'Total Sold', 
                      dataIndex: 'total_sold', 
                      key: 'total_sold',
                      sorter: (a, b) => b.total_sold - a.total_sold,
                      render: (val) => <Tag color="green">{val} units</Tag>
                    },
                    { 
                      title: 'Orders', 
                      dataIndex: 'order_count', 
                      key: 'order_count',
                      sorter: (a, b) => b.order_count - a.order_count,
                      responsive: ['md']
                    },
                    { 
                      title: 'Revenue', 
                      dataIndex: 'total_revenue', 
                      key: 'total_revenue',
                      sorter: (a, b) => b.total_revenue - a.total_revenue,
                      render: (val) => `UGX ${val?.toLocaleString() || 0}`
                    },
                    { 
                      title: 'Current Stock', 
                      dataIndex: 'current_stock', 
                      key: 'current_stock',
                      render: (qty) => <span style={{ color: qty <= 5 ? '#ff4d4f' : '#1890ff', fontWeight: 'bold' }}>{qty}</span>
                    }
                  ]}
                  dataSource={demandData.high_demand}
                  rowKey="_id"
                  pagination={isMobile ? { simple: true, pageSize: 5 } : false}
                />
              ) : (
                <Spin />
              )
            },
            {
              key: 'low-demand',
              label: (
                <span>
                  <FallOutlined /> Low Demand
                </span>
              ),
              children: demandData ? (
                <Table
                  scroll={{ x: 'max-content' }}
                  size={isMobile ? 'small' : 'middle'}
                  columns={[
                    { title: 'Product Name', dataIndex: 'name', key: 'name' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku', responsive: ['sm'] },
                    { 
                      title: 'Total Sold', 
                      dataIndex: 'total_sold', 
                      key: 'total_sold',
                      sorter: (a, b) => a.total_sold - b.total_sold,
                      render: (val) => <Tag color="blue">{val} units</Tag>
                    },
                    { 
                      title: 'Orders', 
                      dataIndex: 'order_count', 
                      key: 'order_count',
                      responsive: ['md']
                    },
                    { 
                      title: 'Revenue', 
                      dataIndex: 'total_revenue', 
                      key: 'total_revenue',
                      render: (val) => `UGX ${val?.toLocaleString() || 0}`
                    },
                    { 
                      title: 'Current Stock', 
                      dataIndex: 'current_stock', 
                      key: 'current_stock',
                      render: (qty) => <span style={{ color: qty <= 5 ? '#ff4d4f' : '#1890ff', fontWeight: 'bold' }}>{qty}</span>
                    }
                  ]}
                  dataSource={demandData.low_demand}
                  rowKey="_id"
                  pagination={isMobile ? { simple: true, pageSize: 5 } : false}
                />
              ) : (
                <Spin />
              )
            }
          ]}
        />

        <Modal
          title={selectedProductId ? 'Edit Product' : 'Add Product'}
          open={isModalVisible}
          onOk={handleSaveProduct}
          onCancel={() => setIsModalVisible(false)}
          okText={selectedProductId ? 'Update' : 'Create'}
          width={isMobile ? '95vw' : 500}
          style={{ maxWidth: '95vw' }}
        >
          <Form
            form={productForm}
            layout="vertical"
            requiredMark="optional"
          >
            <Form.Item
              label="Product Name"
              name="name"
              rules={[{ required: true, message: 'Please enter product name' }]}
            >
              <Input placeholder="e.g., Phase Monitor 3-Phase" />
            </Form.Item>

            <Form.Item
              label="SKU (Stock Keeping Unit)"
              name="sku"
              rules={[{ required: true, message: 'Please enter SKU' }]}
            >
              <Input placeholder="e.g., PM3P-001" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <Input.TextArea placeholder="Product description" rows={3} />
            </Form.Item>

            <Form.Item
              label="Selling Price (UGX)"
              name="price"
              rules={[{ required: true, message: 'Please enter selling price' }]}
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Cost Price (UGX)"
              name="cost_price"
              tooltip="The amount you paid to buy this product (used to calculate profit)"
              rules={[{ required: true, message: 'Please enter cost price' }]}
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Initial Quantity"
              name="quantity"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber
                min={0}
                placeholder="0"
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              label="Low Stock Threshold"
              name="low_stock_threshold"
              initialValue={10}
              tooltip="You'll be alerted when stock falls below this number"
              rules={[{ required: true, message: 'Please enter low stock threshold' }]}
            >
              <InputNumber
                min={0}
                placeholder="10"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        </Modal>

        <AdvancedSearchDrawer
          visible={searchDrawerVisible}
          onClose={() => setSearchDrawerVisible(false)}
          onApply={applyFilters}
          fields={[
            { name: 'name', label: 'Product Name', type: 'input' },
            { name: 'sku', label: 'SKU', type: 'input' },
            { name: 'price_min', label: 'Min Price (UGX)', type: 'number' },
            { name: 'price_max', label: 'Max Price (UGX)', type: 'number' },
            { 
              name: 'stock_level', 
              label: 'Stock Level', 
              type: 'select',
              options: [
                { value: 'low', label: 'Low Stock' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' }
              ]
            }
          ]}
        />
      </div>
    </Spin>
  )
}

export default Products