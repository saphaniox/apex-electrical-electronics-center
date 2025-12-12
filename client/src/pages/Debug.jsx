import React, { useState } from 'react'
import { Card, Button, Space, message, Collapse, Tag, Typography, Row, Col, Divider, Spin, Alert } from 'antd'
import { BugOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, ApiOutlined, DatabaseOutlined, LockOutlined, FileTextOutlined, ShoppingOutlined, TeamOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons'
import { productsAPI, customersAPI, salesAPI, invoicesAPI, reportsAPI, authAPI } from '../services/api'
import { useAuthStore } from '../store/authStore'
import PageHeader from '../components/PageHeader'
import BackToTop from '../components/BackToTop'

const { Panel } = Collapse
const { Title, Text, Paragraph } = Typography

function Debug() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState({})

  // Helper to run a test and track results
  const runTest = async (testName, testFn) => {
    setIsLoading(true)
    try {
      const result = await testFn()
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'success', message: result || 'Test passed', timestamp: new Date().toLocaleTimeString() }
      }))
      message.success(`${testName} - Success`)
      return true
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Test failed'
      setTestResults(prev => ({
        ...prev,
        [testName]: { status: 'error', message: errorMsg, timestamp: new Date().toLocaleTimeString() }
      }))
      message.error(`${testName} - Failed: ${errorMsg}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Authentication Tests
  const testAuthToken = async () => {
    return runTest('Auth Token Validation', async () => {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No token found in localStorage')
      return `Token exists: ${token.substring(0, 20)}...`
    })
  }

  const testCurrentUser = async () => {
    return runTest('Current User Info', async () => {
      if (!user) throw new Error('No user in auth store')
      return `User: ${user.username} | Role: ${user.role}`
    })
  }

  // Product Tests
  const testGetProducts = async () => {
    return runTest('GET Products', async () => {
      const response = await productsAPI.getAll(1, 5)
      const count = response.data.data?.length || 0
      return `Retrieved ${count} products`
    })
  }

  const testCreateProduct = async () => {
    return runTest('CREATE Product', async () => {
      const testProduct = {
        name: `Debug Test Product ${Date.now()}`,
        description: 'Test product created by debug panel',
        price: 10000,
        quantity: 100,
        category: 'Test'
      }
      const response = await productsAPI.create(testProduct)
      return `Created product ID: ${response.data._id}`
    })
  }

  // Customer Tests
  const testGetCustomers = async () => {
    return runTest('GET Customers', async () => {
      const response = await customersAPI.getAll(1, 5)
      const count = response.data.data?.length || 0
      return `Retrieved ${count} customers`
    })
  }

  const testCreateCustomer = async () => {
    return runTest('CREATE Customer', async () => {
      const testCustomer = {
        name: `Debug Customer ${Date.now()}`,
        phone: `+256${Math.floor(Math.random() * 1000000000)}`,
        email: `debug${Date.now()}@test.com`,
        address: '123 Debug Street'
      }
      const response = await customersAPI.create(testCustomer)
      return `Created customer ID: ${response.data._id}`
    })
  }

  // Sales Order Tests
  const testGetSalesOrders = async () => {
    return runTest('GET Sales Orders', async () => {
      const response = await salesAPI.getAll(1, 5)
      const count = response.data.data?.length || 0
      return `Retrieved ${count} sales orders`
    })
  }

  const testCreateSalesOrderUGX = async () => {
    return runTest('CREATE Sales Order (UGX)', async () => {
      const products = await productsAPI.getAll(1, 1)
      if (!products.data.data?.length) throw new Error('No products available')
      
      const testOrder = {
        customer_name: `Debug Customer ${Date.now()}`,
        customer_phone: '+256700000000',
        currency: 'UGX',
        items: [{ product_id: products.data.data[0]._id, quantity: 2 }],
        status: 'pending'
      }
      const response = await salesAPI.create(testOrder)
      return `Created UGX order: ${response.data.total_amount} UGX`
    })
  }

  const testCreateSalesOrderUSD = async () => {
    return runTest('CREATE Sales Order (USD)', async () => {
      const products = await productsAPI.getAll(1, 1)
      if (!products.data.data?.length) throw new Error('No products available')
      
      const testOrder = {
        customer_name: `Debug Customer ${Date.now()}`,
        customer_phone: '+256700000000',
        currency: 'USD',
        items: [{ product_id: products.data.data[0]._id, quantity: 2 }],
        status: 'pending'
      }
      const response = await salesAPI.create(testOrder)
      return `Created USD order: $${response.data.total_amount}`
    })
  }

  // Invoice Tests
  const testGetInvoices = async () => {
    return runTest('GET Invoices', async () => {
      const response = await invoicesAPI.getAll(1, 5)
      const count = response.data.data?.length || 0
      return `Retrieved ${count} invoices`
    })
  }

  const testGenerateInvoiceFromOrder = async () => {
    return runTest('GENERATE Invoice from Sales Order', async () => {
      const orders = await salesAPI.getAll(1, 1)
      if (!orders.data.data?.length) throw new Error('No sales orders available')
      
      const invoiceData = {
        sales_order_id: orders.data.data[0]._id,
        notes: 'Debug test invoice',
        status: 'pending'
      }
      const response = await invoicesAPI.generate(invoiceData)
      return `Generated invoice: ${response.data.invoice_number}`
    })
  }

  const testGenerateDirectInvoiceUGX = async () => {
    return runTest('GENERATE Direct Invoice (UGX)', async () => {
      const products = await productsAPI.getAll(1, 1)
      if (!products.data.data?.length) throw new Error('No products available')
      
      const invoiceData = {
        customer_name: `Debug Customer ${Date.now()}`,
        customer_phone: '+256700000000',
        currency: 'UGX',
        items: [{ product_id: products.data.data[0]._id, quantity: 1 }],
        notes: 'Debug direct invoice UGX',
        status: 'pending'
      }
      const response = await invoicesAPI.generate(invoiceData)
      return `Generated UGX invoice: ${response.data.total_amount} UGX`
    })
  }

  const testGenerateDirectInvoiceUSD = async () => {
    return runTest('GENERATE Direct Invoice (USD)', async () => {
      const products = await productsAPI.getAll(1, 1)
      if (!products.data.data?.length) throw new Error('No products available')
      
      const invoiceData = {
        customer_name: `Debug Customer ${Date.now()}`,
        customer_phone: '+256700000000',
        currency: 'USD',
        items: [{ product_id: products.data.data[0]._id, quantity: 1 }],
        notes: 'Debug direct invoice USD',
        status: 'pending'
      }
      const response = await invoicesAPI.generate(invoiceData)
      return `Generated USD invoice: $${response.data.total_amount}`
    })
  }

  // Analytics Tests
  const testDailyAnalytics = async () => {
    return runTest('GET Daily Analytics', async () => {
      const response = await reportsAPI.dailyAnalytics()
      const data = response.data
      return `Today: ${data.total_revenue_ugx} UGX / $${data.total_revenue_usd} USD | Orders: ${data.total_orders}`
    })
  }

  const testPeriodAnalytics = async () => {
    return runTest('GET Period Analytics (Week)', async () => {
      const response = await reportsAPI.periodAnalytics('week')
      const data = response.data
      return `Week: ${data.total_revenue_ugx} UGX / $${data.total_revenue_usd} USD | Orders: ${data.total_orders}`
    })
  }

  const testStockReport = async () => {
    return runTest('GET Stock Report', async () => {
      const response = await reportsAPI.stockStatus()
      const count = response.data.length || 0
      return `Stock report: ${count} products tracked`
    })
  }

  const testTopProducts = async () => {
    return runTest('GET Top Products', async () => {
      const response = await reportsAPI.topProducts()
      const count = response.data.length || 0
      return `Top products: ${count} items`
    })
  }

  const testProductDemand = async () => {
    return runTest('GET Product Demand Analytics', async () => {
      const response = await reportsAPI.productDemand()
      const high = response.data.high_demand?.length || 0
      const medium = response.data.medium_demand?.length || 0
      const low = response.data.low_demand?.length || 0
      return `High: ${high} | Medium: ${medium} | Low: ${low}`
    })
  }

  // Currency Conversion Tests
  const testCurrencyConversion = async () => {
    return runTest('Currency Conversion Logic', async () => {
      const EXCHANGE_RATE = 3700
      const ugx = 100000
      const usd = ugx / EXCHANGE_RATE
      const backToUgx = usd * EXCHANGE_RATE
      
      if (Math.abs(ugx - backToUgx) > 1) throw new Error('Conversion mismatch')
      return `100,000 UGX = $${usd.toFixed(2)} USD | Reverse: ${backToUgx} UGX`
    })
  }

  // Role-Based Access Tests
  const testRoleAccess = async () => {
    return runTest('Role-Based Access Control', async () => {
      const role = user?.role
      const canCreateProduct = ['admin', 'manager'].includes(role)
      const canDeleteProduct = role === 'admin'
      const canCreateInvoice = ['admin', 'manager', 'sales'].includes(role)
      
      return `Role: ${role} | Create Product: ${canCreateProduct} | Delete Product: ${canDeleteProduct} | Create Invoice: ${canCreateInvoice}`
    })
  }

  // Run all tests
  const runAllTests = async () => {
    setTestResults({})
    message.info('Running all debug tests...')
    
    await testAuthToken()
    await testCurrentUser()
    await testGetProducts()
    await testGetCustomers()
    await testGetSalesOrders()
    await testGetInvoices()
    await testDailyAnalytics()
    await testPeriodAnalytics()
    await testStockReport()
    await testTopProducts()
    await testProductDemand()
    await testCurrencyConversion()
    await testRoleAccess()
    
    message.success('All read-only tests completed!')
  }

  // Run all write tests (creates data)
  const runWriteTests = async () => {
    setTestResults({})
    message.warning('Running write tests (will create test data)...')
    
    if (user?.role === 'admin' || user?.role === 'manager') {
      await testCreateProduct()
    }
    
    if (user?.role === 'admin' || user?.role === 'manager') {
      await testCreateCustomer()
    }
    
    await testCreateSalesOrderUGX()
    await testCreateSalesOrderUSD()
    
    if (['admin', 'manager', 'sales'].includes(user?.role)) {
      await testGenerateDirectInvoiceUGX()
      await testGenerateDirectInvoiceUSD()
      await testGenerateInvoiceFromOrder()
    }
    
    message.success('All write tests completed!')
  }

  const clearResults = () => {
    setTestResults({})
    message.info('Test results cleared')
  }

  const renderTestResult = (testName) => {
    const result = testResults[testName]
    if (!result) return null

    return (
      <Alert
        type={result.status === 'success' ? 'success' : 'error'}
        icon={result.status === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
        message={
          <div>
            <Text strong>{testName}</Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
              {result.timestamp}
            </Text>
          </div>
        }
        description={result.message}
        style={{ marginBottom: 8 }}
        showIcon
      />
    )
  }

  const isMobile = window.innerWidth <= 768

  return (
    <Spin spinning={isLoading}>
      <div style={{ padding: isMobile ? '10px' : '20px' }}>
        <PageHeader
          title="Debug & Testing Panel"
          breadcrumbs={[{ label: 'Debug' }]}
          icon={<BugOutlined />}
        />

        <Alert
          message="Admin Debug Panel"
          description={`Current User: ${user?.username} | Role: ${user?.role} | This panel allows you to test all API endpoints and system functionality.`}
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={runAllTests}
              block
              size="large"
            >
              Run All Read Tests
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              type="primary"
              danger
              icon={<ApiOutlined />}
              onClick={runWriteTests}
              block
              size="large"
            >
              Run Write Tests
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<CloseCircleOutlined />}
              onClick={clearResults}
              block
              size="large"
            >
              Clear Results
            </Button>
          </Col>
        </Row>

        <Collapse defaultActiveKey={['results']} style={{ marginBottom: 20 }}>
          <Panel header={`Test Results (${Object.keys(testResults).length})`} key="results">
            {Object.keys(testResults).length === 0 ? (
              <Text type="secondary">No test results yet. Run tests to see results here.</Text>
            ) : (
              Object.keys(testResults).map(testName => renderTestResult(testName))
            )}
          </Panel>
        </Collapse>

        <Divider>Individual Tests</Divider>

        <Collapse accordion>
          <Panel header={<><LockOutlined /> Authentication & Authorization Tests</>} key="auth">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testAuthToken} block>Test Auth Token</Button>
              <Button onClick={testCurrentUser} block>Test Current User Info</Button>
              <Button onClick={testRoleAccess} block>Test Role-Based Access Control</Button>
              {renderTestResult('Auth Token Validation')}
              {renderTestResult('Current User Info')}
              {renderTestResult('Role-Based Access Control')}
            </Space>
          </Panel>

          <Panel header={<><ShoppingOutlined /> Product Tests</>} key="products">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testGetProducts} block>GET Products</Button>
              {(['admin', 'manager'].includes(user?.role)) && (
                <Button onClick={testCreateProduct} block type="primary" danger>
                  CREATE Test Product
                </Button>
              )}
              {renderTestResult('GET Products')}
              {renderTestResult('CREATE Product')}
            </Space>
          </Panel>

          <Panel header={<><TeamOutlined /> Customer Tests</>} key="customers">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testGetCustomers} block>GET Customers</Button>
              {(['admin', 'manager'].includes(user?.role)) && (
                <Button onClick={testCreateCustomer} block type="primary" danger>
                  CREATE Test Customer
                </Button>
              )}
              {renderTestResult('GET Customers')}
              {renderTestResult('CREATE Customer')}
            </Space>
          </Panel>

          <Panel header={<><ShoppingCartOutlined /> Sales Order Tests</>} key="sales">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testGetSalesOrders} block>GET Sales Orders</Button>
              <Button onClick={testCreateSalesOrderUGX} block type="primary" danger>
                CREATE Sales Order (UGX)
              </Button>
              <Button onClick={testCreateSalesOrderUSD} block type="primary" danger>
                CREATE Sales Order (USD)
              </Button>
              {renderTestResult('GET Sales Orders')}
              {renderTestResult('CREATE Sales Order (UGX)')}
              {renderTestResult('CREATE Sales Order (USD)')}
            </Space>
          </Panel>

          <Panel header={<><FileTextOutlined /> Invoice Tests</>} key="invoices">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testGetInvoices} block>GET Invoices</Button>
              {(['admin', 'manager', 'sales'].includes(user?.role)) && (
                <>
                  <Button onClick={testGenerateInvoiceFromOrder} block type="primary" danger>
                    GENERATE Invoice from Sales Order
                  </Button>
                  <Button onClick={testGenerateDirectInvoiceUGX} block type="primary" danger>
                    GENERATE Direct Invoice (UGX)
                  </Button>
                  <Button onClick={testGenerateDirectInvoiceUSD} block type="primary" danger>
                    GENERATE Direct Invoice (USD)
                  </Button>
                </>
              )}
              {renderTestResult('GET Invoices')}
              {renderTestResult('GENERATE Invoice from Sales Order')}
              {renderTestResult('GENERATE Direct Invoice (UGX)')}
              {renderTestResult('GENERATE Direct Invoice (USD)')}
            </Space>
          </Panel>

          <Panel header={<><DatabaseOutlined /> Analytics & Reports Tests</>} key="analytics">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testDailyAnalytics} block>GET Daily Analytics</Button>
              <Button onClick={testPeriodAnalytics} block>GET Period Analytics</Button>
              <Button onClick={testStockReport} block>GET Stock Report</Button>
              <Button onClick={testTopProducts} block>GET Top Products</Button>
              <Button onClick={testProductDemand} block>GET Product Demand</Button>
              {renderTestResult('GET Daily Analytics')}
              {renderTestResult('GET Period Analytics (Week)')}
              {renderTestResult('GET Stock Report')}
              {renderTestResult('GET Top Products')}
              {renderTestResult('GET Product Demand Analytics')}
            </Space>
          </Panel>

          <Panel header={<><DollarOutlined /> Currency Tests</>} key="currency">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button onClick={testCurrencyConversion} block>Test Currency Conversion</Button>
              {renderTestResult('Currency Conversion Logic')}
              <Card size="small" style={{ marginTop: 10 }}>
                <Title level={5}>Exchange Rate Information</Title>
                <Paragraph>
                  <Text strong>Current Rate:</Text> 1 USD = 3,700 UGX<br />
                  <Text strong>UGX → USD:</Text> Amount / 3700<br />
                  <Text strong>USD → UGX:</Text> Amount × 3700
                </Paragraph>
              </Card>
            </Space>
          </Panel>
        </Collapse>

        <Card style={{ marginTop: 20 }} title="System Information">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Text strong>API Base URL:</Text><br />
              <Tag color="blue">{import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}</Tag>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Current User:</Text><br />
              <Tag color="green">{user?.username}</Tag>
              <Tag color="purple">{user?.role}</Tag>
            </Col>
            <Col xs={24} md={12}>
              <Text strong>Auth Token:</Text><br />
              <Tag color="orange">{localStorage.getItem('token') ? 'Present' : 'Missing'}</Tag>
            </Col>
            <Col xs={24} md={12}>
          <Text strong>Environment:</Text><br />
          <Tag color="red">{import.meta.env.MODE}</Tag>
        </Col>
      </Row>
    </Card>
    <BackToTop />
  </div>
</Spin>
)
}

export default Debug