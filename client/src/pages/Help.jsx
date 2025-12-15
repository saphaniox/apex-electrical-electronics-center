import React, { useState } from 'react'
import { Card, Collapse, Typography, Input, Tag, Space, Divider, Row, Col, Button, Alert } from 'antd'
import {
  SearchOutlined,
  QuestionCircleOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SettingOutlined,
  DollarOutlined,
  SafetyOutlined,
  RocketOutlined,
  TeamOutlined,
  ShoppingOutlined,
  PrinterOutlined,
  DownloadOutlined,
  BookOutlined
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Panel } = Collapse
const { Search } = Input

function Help() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKeys, setActiveKeys] = useState([])

  const helpSections = [
    {
      key: 'getting-started',
      title: 'Getting Started',
      icon: <RocketOutlined />,
      tag: 'Basics',
      tagColor: 'blue',
      items: [
        {
          question: 'How do I log in to the system?',
          answer: (
            <>
              <Paragraph>
                1. Navigate to the login page<br />
                2. Enter your registered email address<br />
                3. Enter your password<br />
                4. Click the "Login" button
              </Paragraph>
              <Alert message="First Time User?" description="Contact your administrator to create an account for you." type="info" showIcon />
            </>
          )
        },
        {
          question: 'How do I navigate the dashboard?',
          answer: (
            <Paragraph>
              The dashboard is your home screen showing:<br />
              • <strong>Key Performance Indicators (KPIs)</strong> - Total sales, orders, and averages<br />
              • <strong>Today's Performance</strong> - Daily revenue, profit, expenses, and net profit<br />
              • <strong>Sales Trend Analysis</strong> - Visual charts of your sales over time<br />
              • <strong>Low Stock Alerts</strong> - Products that need reordering<br />
              <br />
              Use the sidebar menu to access different sections like Products, Sales, Customers, etc.
            </Paragraph>
          )
        },
        {
          question: 'What are the different user roles?',
          answer: (
            <Paragraph>
              • <Tag color="red">Admin</Tag> - Full access to all features including user management<br />
              • <Tag color="blue">Manager</Tag> - Access to sales, products, and reports but cannot manage users<br />
              • <Tag color="green">Staff</Tag> - Basic access to create sales and view products<br />
              <br />
              <Text type="secondary">Your role determines which menu items and features you can access.</Text>
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'products',
      title: 'Product Management',
      icon: <ShoppingOutlined />,
      tag: 'Products',
      tagColor: 'green',
      items: [
        {
          question: 'How do I add a new product?',
          answer: (
            <Paragraph>
              1. Go to <strong>Products</strong> from the sidebar<br />
              2. Click the <strong>"Add Product"</strong> button<br />
              3. Fill in the product details:<br />
              &nbsp;&nbsp;&nbsp;• Product Name<br />
              &nbsp;&nbsp;&nbsp;• Category<br />
              &nbsp;&nbsp;&nbsp;• Cost Price (what you paid)<br />
              &nbsp;&nbsp;&nbsp;• Selling Price (what customers pay)<br />
              &nbsp;&nbsp;&nbsp;• Stock Quantity<br />
              &nbsp;&nbsp;&nbsp;• Minimum Stock Level (for alerts)<br />
              4. Click <strong>"Add Product"</strong> to save
            </Paragraph>
          )
        },
        {
          question: 'How do I edit or delete a product?',
          answer: (
            <Paragraph>
              <strong>To Edit:</strong><br />
              1. Find the product in the products table<br />
              2. Click the <strong>Edit</strong> icon in the Actions column<br />
              3. Update the information<br />
              4. Click <strong>"Update Product"</strong><br />
              <br />
              <strong>To Delete:</strong><br />
              1. Click the <strong>Delete</strong> icon in the Actions column<br />
              2. Confirm the deletion<br />
              <br />
              <Alert message="Warning" description="Deleting a product cannot be undone. Make sure you really want to remove it." type="warning" showIcon />
            </Paragraph>
          )
        },
        {
          question: 'How do I search for products?',
          answer: (
            <Paragraph>
              Use the search bar at the top of the Products page to search by:<br />
              • Product name<br />
              • Category<br />
              • SKU/Code<br />
              <br />
              The search updates in real-time as you type. You can also use the advanced search drawer for more filters.
            </Paragraph>
          )
        },
        {
          question: 'What are low stock alerts?',
          answer: (
            <Paragraph>
              When a product's quantity falls below its minimum stock level, it appears in:<br />
              • The <strong>Low Stock Items</strong> card on the dashboard<br />
              • A warning alert banner<br />
              • Highlighted in red in the products table<br />
              <br />
              This helps you reorder products before running out of stock.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'sales',
      title: 'Sales & Orders',
      icon: <ShoppingCartOutlined />,
      tag: 'Sales',
      tagColor: 'orange',
      items: [
        {
          question: 'How do I create a new sale?',
          answer: (
            <Paragraph>
              1. Go to <strong>Sales</strong> from the sidebar<br />
              2. Click <strong>"New Sale"</strong><br />
              3. Select or create a customer<br />
              4. Add items to the order:<br />
              &nbsp;&nbsp;&nbsp;• Search for the product<br />
              &nbsp;&nbsp;&nbsp;• Enter quantity<br />
              &nbsp;&nbsp;&nbsp;• Price auto-fills but can be adjusted<br />
              5. Choose payment method (Cash/Card/Mobile Money)<br />
              6. Select currency (UGX/USD)<br />
              7. Add notes if needed<br />
              8. Click <strong>"Create Sale"</strong>
            </Paragraph>
          )
        },
        {
          question: 'How do I view or edit a sale?',
          answer: (
            <Paragraph>
              <strong>To View:</strong><br />
              Click on any sale in the sales table to view full details including:<br />
              • Customer information<br />
              • Items ordered<br />
              • Prices and totals<br />
              • Payment method<br />
              • Sale date and status<br />
              <br />
              <strong>To Edit:</strong><br />
              Click the <strong>Edit</strong> icon to modify sale details. You can update quantities, prices, or payment information.
            </Paragraph>
          )
        },
        {
          question: 'How do I change the number of sales displayed per page?',
          answer: (
            <Paragraph>
              At the bottom of the sales table, you'll see pagination controls:<br />
              • Use the dropdown to select: <Tag>10</Tag> <Tag>20</Tag> <Tag>50</Tag> or <Tag>100</Tag> items per page<br />
              • Default is 50 items per page<br />
              • Use the arrow buttons to navigate between pages
            </Paragraph>
          )
        },
        {
          question: 'How do I print or export sales data?',
          answer: (
            <Paragraph>
              <strong>Print Sales List:</strong><br />
              Click the <PrinterOutlined /> <strong>Print</strong> button to print the current sales table.<br />
              <br />
              <strong>Export to CSV:</strong><br />
              Click the <DownloadOutlined /> <strong>Export CSV</strong> button to download all sales data as a spreadsheet.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'customers',
      title: 'Customer Management',
      icon: <TeamOutlined />,
      tag: 'Customers',
      tagColor: 'purple',
      items: [
        {
          question: 'How do I add a new customer?',
          answer: (
            <Paragraph>
              1. Go to <strong>Customers</strong> from the sidebar<br />
              2. Click <strong>"Add Customer"</strong><br />
              3. Enter customer details:<br />
              &nbsp;&nbsp;&nbsp;• Full Name (required)<br />
              &nbsp;&nbsp;&nbsp;• Email<br />
              &nbsp;&nbsp;&nbsp;• Phone Number<br />
              &nbsp;&nbsp;&nbsp;• Address<br />
              4. Click <strong>"Add Customer"</strong> to save<br />
              <br />
              <Alert message="Quick Tip" description="You can also create customers directly when making a sale." type="info" showIcon />
            </Paragraph>
          )
        },
        {
          question: 'How do I view customer purchase history?',
          answer: (
            <Paragraph>
              1. Find the customer in the customers table<br />
              2. Click the <strong>View</strong> icon<br />
              3. The customer details page shows:<br />
              &nbsp;&nbsp;&nbsp;• Contact information<br />
              &nbsp;&nbsp;&nbsp;• Total purchases<br />
              &nbsp;&nbsp;&nbsp;• Complete purchase history<br />
              &nbsp;&nbsp;&nbsp;• Last purchase date
            </Paragraph>
          )
        },
        {
          question: 'How do I export customer data?',
          answer: (
            <Paragraph>
              Click the <DownloadOutlined /> <strong>Export CSV</strong> button on the Customers page to download all customer data including their contact information and purchase statistics.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'expenses',
      title: 'Expenses Tracking',
      icon: <DollarOutlined />,
      tag: 'Finance',
      tagColor: 'red',
      items: [
        {
          question: 'How do I record daily expenses?',
          answer: (
            <Paragraph>
              1. Go to <strong>Expenses</strong> from the sidebar<br />
              2. Click <strong>"Add Expense"</strong><br />
              3. Fill in the expense details:<br />
              &nbsp;&nbsp;&nbsp;• Amount (in UGX)<br />
              &nbsp;&nbsp;&nbsp;• Description (e.g., "Breakfast for staff")<br />
              &nbsp;&nbsp;&nbsp;• Category (e.g., "Meals", "Transport", "Utilities")<br />
              &nbsp;&nbsp;&nbsp;• Date<br />
              4. Click <strong>"Add Expense"</strong><br />
              <br />
              The expense is automatically subtracted from your profit calculations.
            </Paragraph>
          )
        },
        {
          question: 'How do expenses affect my profits?',
          answer: (
            <Paragraph>
              The system calculates two types of profit:<br />
              <br />
              <strong>Gross Profit</strong> = Revenue - Cost of Goods<br />
              <Text type="secondary">This is profit before expenses</Text><br />
              <br />
              <strong>Net Profit</strong> = Gross Profit - Total Expenses<br />
              <Text type="secondary">This is your actual profit after all costs</Text><br />
              <br />
              You can see both values in:<br />
              • Today's Performance on the dashboard<br />
              • Analytics page for different time periods<br />
              • Expense summary statistics
            </Paragraph>
          )
        },
        {
          question: 'How do I view expense summaries?',
          answer: (
            <Paragraph>
              The Expenses page shows:<br />
              • <strong>Total Expenses</strong> - Sum of all recorded expenses<br />
              • <strong>Total Records</strong> - Number of expense entries<br />
              • <strong>Average Expense</strong> - Mean expense per entry<br />
              <br />
              You can filter expenses by date range and see how they impact your daily net profit on the dashboard.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'analytics',
      title: 'Analytics & Reports',
      icon: <BarChartOutlined />,
      tag: 'Reports',
      tagColor: 'cyan',
      items: [
        {
          question: 'What analytics are available?',
          answer: (
            <Paragraph>
              The system provides several analytics views:<br />
              <br />
              <strong>Dashboard Analytics:</strong><br />
              • Total sales and revenue<br />
              • Average order value<br />
              • Today's performance (revenue, profit, expenses)<br />
              • Sales trend charts (7-day or 30-day)<br />
              <br />
              <strong>Analytics Page:</strong><br />
              • Profit analytics by period (daily, weekly, monthly)<br />
              • Revenue breakdown by currency<br />
              • Expense tracking and ratios<br />
              • Product demand analysis<br />
              • Customer purchase patterns
            </Paragraph>
          )
        },
        {
          question: 'How do I read the profit analytics?',
          answer: (
            <Paragraph>
              On the Analytics page, select a time period to see:<br />
              <br />
              <strong>Revenue Metrics:</strong><br />
              • Total Revenue<br />
              • Total Cost (what you paid for goods sold)<br />
              • Gross Profit (revenue minus cost)<br />
              • Overall Margin percentage<br />
              <br />
              <strong>Expense Metrics:</strong><br />
              • Total Expenses (operational costs)<br />
              • Net Profit (actual profit after expenses)<br />
              • Expense Ratio (expenses as % of revenue)<br />
              <br />
              Net profit is shown in <Tag color="green">green</Tag> if positive or <Tag color="red">red</Tag> if negative.
            </Paragraph>
          )
        },
        {
          question: 'What is product demand analysis?',
          answer: (
            <Paragraph>
              Product demand analysis shows which products are selling the most:<br />
              • Top selling products by quantity<br />
              • Revenue generated per product<br />
              • Trending items<br />
              <br />
              This helps you identify:<br />
              • What to stock more of<br />
              • Which products to promote<br />
              • Slow-moving inventory
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'invoices',
      title: 'Invoices',
      icon: <FileTextOutlined />,
      tag: 'Documents',
      tagColor: 'geekblue',
      items: [
        {
          question: 'How do I generate an invoice?',
          answer: (
            <Paragraph>
              1. Go to <strong>Invoices</strong> from the sidebar<br />
              2. Click <strong>"Generate Invoice"</strong><br />
              3. Select a sales order to invoice<br />
              4. The system automatically creates a professional invoice with:<br />
              &nbsp;&nbsp;&nbsp;• Your business details<br />
              &nbsp;&nbsp;&nbsp;• Customer information<br />
              &nbsp;&nbsp;&nbsp;• Itemized list of products<br />
              &nbsp;&nbsp;&nbsp;• Prices and totals<br />
              &nbsp;&nbsp;&nbsp;• Payment terms<br />
              5. Click <strong>"Generate"</strong>
            </Paragraph>
          )
        },
        {
          question: 'How do I download or print an invoice?',
          answer: (
            <Paragraph>
              From the Invoices page:<br />
              1. Find the invoice in the table<br />
              2. Click the <DownloadOutlined /> <strong>Download</strong> icon to save as PDF<br />
              3. Or click <strong>View</strong> to see the invoice on screen<br />
              4. Use your browser's print function (Ctrl+P) to print<br />
              <br />
              Invoices are formatted professionally and ready to send to customers.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'users',
      title: 'User Management',
      icon: <UserOutlined />,
      tag: 'Admin Only',
      tagColor: 'red',
      items: [
        {
          question: 'How do I add a new user? (Admin only)',
          answer: (
            <Paragraph>
              1. Go to <strong>Users</strong> from the sidebar<br />
              2. Click <strong>"Add User"</strong><br />
              3. Enter user details:<br />
              &nbsp;&nbsp;&nbsp;• Full Name<br />
              &nbsp;&nbsp;&nbsp;• Email (used for login)<br />
              &nbsp;&nbsp;&nbsp;• Password<br />
              &nbsp;&nbsp;&nbsp;• Role (Admin/Manager/Staff)<br />
              4. Click <strong>"Add User"</strong><br />
              <br />
              <Alert message="Admin Feature" description="Only administrators can create and manage user accounts." type="warning" showIcon />
            </Paragraph>
          )
        },
        {
          question: 'How do I change a user\'s role?',
          answer: (
            <Paragraph>
              1. Find the user in the Users table<br />
              2. Click the role dropdown in their row<br />
              3. Select the new role:<br />
              &nbsp;&nbsp;&nbsp;• <Tag color="red">Admin</Tag> - Full access<br />
              &nbsp;&nbsp;&nbsp;• <Tag color="blue">Manager</Tag> - Sales and reports<br />
              &nbsp;&nbsp;&nbsp;• <Tag color="green">Staff</Tag> - Basic access<br />
              4. Confirm the change<br />
              <br />
              The user's permissions update immediately.
            </Paragraph>
          )
        },
        {
          question: 'How do I reset a user\'s password?',
          answer: (
            <Paragraph>
              As an admin:<br />
              1. Go to the Users page<br />
              2. Find the user<br />
              3. Click the <strong>Reset Password</strong> button<br />
              4. Enter a new password<br />
              5. Click <strong>"Update Password"</strong><br />
              <br />
              Inform the user of their new password securely.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'profile',
      title: 'Profile Settings',
      icon: <SettingOutlined />,
      tag: 'Account',
      tagColor: 'default',
      items: [
        {
          question: 'How do I update my profile?',
          answer: (
            <Paragraph>
              1. Click your avatar in the top right<br />
              2. Select <strong>"Profile"</strong><br />
              3. Update your information:<br />
              &nbsp;&nbsp;&nbsp;• Full Name<br />
              &nbsp;&nbsp;&nbsp;• Email<br />
              &nbsp;&nbsp;&nbsp;• Phone Number<br />
              4. Click <strong>"Update Profile"</strong>
            </Paragraph>
          )
        },
        {
          question: 'How do I change my password?',
          answer: (
            <Paragraph>
              From your Profile page:<br />
              1. Scroll to the "Change Password" section<br />
              2. Enter your current password<br />
              3. Enter your new password<br />
              4. Confirm your new password<br />
              5. Click <strong>"Change Password"</strong><br />
              <br />
              <Alert message="Security Tip" description="Use a strong password with letters, numbers, and symbols. Don't share your password with anyone." type="info" showIcon />
            </Paragraph>
          )
        },
        {
          question: 'How do I upload a profile picture?',
          answer: (
            <Paragraph>
              1. Go to your Profile page<br />
              2. Click on your current avatar or the <strong>"Upload Picture"</strong> button<br />
              3. Select an image file (JPG, PNG)<br />
              4. The image uploads automatically<br />
              <br />
              Your new profile picture will appear in the header and throughout the system.
            </Paragraph>
          )
        }
      ]
    },
    {
      key: 'troubleshooting',
      title: 'Troubleshooting',
      icon: <SafetyOutlined />,
      tag: 'Support',
      tagColor: 'magenta',
      items: [
        {
          question: 'I forgot my password. What should I do?',
          answer: (
            <Paragraph>
              Contact your system administrator to reset your password. They can:<br />
              1. Access the Users management page<br />
              2. Find your account<br />
              3. Set a new temporary password for you<br />
              4. Provide you with the new password securely<br />
              <br />
              Once you log in, immediately change your password from your Profile page.
            </Paragraph>
          )
        },
        {
          question: 'Why can\'t I see certain menu items?',
          answer: (
            <Paragraph>
              Menu items are restricted based on your user role:<br />
              <br />
              <Tag color="green">Staff</Tag> can access:<br />
              • Dashboard, Products, Sales, Customers, Profile<br />
              <br />
              <Tag color="blue">Manager</Tag> additionally gets:<br />
              • Analytics, Invoices, Expenses, Reports<br />
              <br />
              <Tag color="red">Admin</Tag> gets everything including:<br />
              • User Management, System Settings<br />
              <br />
              Contact your administrator if you need access to additional features.
            </Paragraph>
          )
        },
        {
          question: 'The page refreshed and I lost my place. How do I prevent this?',
          answer: (
            <Paragraph>
              The system now automatically remembers which page you were on! When you refresh:<br />
              • You'll return to the same page you were viewing<br />
              • Your navigation state is preserved<br />
              • No need to navigate back manually<br />
              <br />
              This feature works automatically - no configuration needed.
            </Paragraph>
          )
        },
        {
          question: 'Numbers in reports don\'t match. What should I check?',
          answer: (
            <Paragraph>
              Common causes and solutions:<br />
              <br />
              <strong>1. Date Range:</strong> Make sure you're looking at the same time period<br />
              <strong>2. Currency:</strong> Check if you're comparing UGX to USD amounts<br />
              <strong>3. Expenses:</strong> Remember that Net Profit = Gross Profit - Expenses<br />
              <strong>4. Filters:</strong> Clear any active filters or search queries<br />
              <br />
              If numbers still don't add up, contact your administrator with:<br />
              • The specific reports you're comparing<br />
              • The date ranges you're using<br />
              • Screenshots if possible
            </Paragraph>
          )
        },
        {
          question: 'How do I report a bug or request a feature?',
          answer: (
            <Paragraph>
              Contact your system administrator with:<br />
              • A clear description of the issue or feature request<br />
              • Steps to reproduce (for bugs)<br />
              • Screenshots if applicable<br />
              • What you expected to happen vs. what actually happened<br />
              <br />
              Your feedback helps improve the system for everyone!
            </Paragraph>
          )
        }
      ]
    }
  ]

  // Filter sections based on search query
  const filteredSections = helpSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      section.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.items.length > 0)

  // Auto-expand sections when searching
  React.useEffect(() => {
    if (searchQuery) {
      setActiveKeys(filteredSections.map(s => s.key))
    } else {
      setActiveKeys([])
    }
  }, [searchQuery])

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <BookOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={2}>Help & Documentation</Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>
          Find answers to common questions and learn how to use all features
        </Paragraph>
      </div>

      {/* Search Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Search
          placeholder="Search for help topics (e.g., 'how to add product', 'change password', 'view reports')"
          allowClear
          enterButton="Search"
          size="large"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Card>

      {/* Quick Links */}
      {!searchQuery && (
        <Card title="🚀 Quick Start Guides" style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<ShoppingCartOutlined />}
                onClick={() => {
                  setSearchQuery('create a new sale')
                }}
                block
              >
                How to Create a Sale
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<ShoppingOutlined />}
                onClick={() => {
                  setSearchQuery('add a new product')
                }}
                block
              >
                How to Add Products
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={() => {
                  setSearchQuery('record daily expenses')
                }}
                block
              >
                How to Record Expenses
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<BarChartOutlined />}
                onClick={() => {
                  setSearchQuery('analytics are available')
                }}
                block
              >
                Understanding Analytics
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<UserOutlined />}
                onClick={() => {
                  setSearchQuery('change my password')
                }}
                block
              >
                Change Your Password
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setSearchQuery('generate an invoice')
                }}
                block
              >
                Generate Invoices
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Help Sections */}
      {filteredSections.length > 0 ? (
        filteredSections.map(section => (
          <Card
            key={section.key}
            title={
              <Space>
                {section.icon}
                <span>{section.title}</span>
                <Tag color={section.tagColor}>{section.tag}</Tag>
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <Collapse
              activeKey={activeKeys}
              onChange={setActiveKeys}
              expandIconPosition="end"
            >
              {section.items.map((item, index) => (
                <Panel
                  header={
                    <Text strong>
                      <QuestionCircleOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                      {item.question}
                    </Text>
                  }
                  key={`${section.key}-${index}`}
                >
                  {item.answer}
                </Panel>
              ))}
            </Collapse>
          </Card>
        ))
      ) : (
        <Card>
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <SearchOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Title level={4} type="secondary">No results found</Title>
            <Paragraph type="secondary">
              Try different keywords or browse the categories above
            </Paragraph>
            <Button type="primary" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </div>
        </Card>
      )}

      {/* Footer */}
      <Divider />
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Alert
          message="Need More Help?"
          description={
            <Paragraph style={{ margin: 0 }}>
              If you can't find the answer you're looking for, contact your system administrator for assistance.
              They can help with technical issues, feature requests, and account management.
            </Paragraph>
          }
          type="info"
          showIcon
        />
      </div>
    </div>
  )
}

export default Help
