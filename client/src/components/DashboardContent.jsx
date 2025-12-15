import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Table, Tag, Button, message, Alert, Skeleton, Empty, Space, Select, Tooltip } from 'antd'
import { reportsAPI, productsAPI, salesAPI } from '../services/api'
import { ArrowUpOutlined, ArrowDownOutlined, ShoppingCartOutlined, AlertOutlined, DollarOutlined, ReloadOutlined, ShoppingOutlined, FileTextOutlined, TeamOutlined, BarChartOutlined } from '@ant-design/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts'
import { useAuthStore } from '../store/authStore'

function DashboardContent({ page, onNavigate }) {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [dailyStats, setDailyStats] = useState(null)
  const [lowStockItems, setLowStockItems] = useState([])
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [trendData, setTrendData] = useState([])
  const [selectedDateRange, setSelectedDateRange] = useState('7')

  // Load dashboard data on mount and when date range changes
  useEffect(() => {
    if (user) {
      fetchDashboardMetrics()
    }
  }, [selectedDateRange, user])

  // Fetch all dashboard data including metrics, alerts, and trend
  const fetchDashboardMetrics = async () => {
    setIsLoadingCards(true)
    setIsLoadingChart(true)
    try {
      const [summaryRes, alertsRes, chartRes, dailyRes] = await Promise.all([
        reportsAPI.salesSummary(),
        reportsAPI.lowStock(),
        reportsAPI.salesTrend(),
        reportsAPI.dailyAnalytics()
      ])
      
      setStats(summaryRes.data)
      setLowStockItems(alertsRes.data.items || [])
      setTrendData(chartRes.data || [])
      setDailyStats(dailyRes.data)
    } catch (error) {
      message.error('Failed to load dashboard metrics')
    } finally {
      setIsLoadingCards(false)
      setIsLoadingChart(false)
    }
  }

  // Manual refresh handler
  const handleRefreshDashboard = () => {
    fetchDashboardMetrics()
    message.success('Dashboard refreshed!')
  }

  // Prepare data for the sales trend chart
  const chartData = (trendData || []).map(item => ({
    name: item._id,
    sales: item.sales || 0,
    orders: item.orders || 0
  }))

  // Helper component for metric cards with consistent styling
  const MetricCard = ({ title, value, prefix, suffix, icon, color, tooltip, loading: isCardLoading }) => (
    <Tooltip title={tooltip}>
      <Card
        hoverable
        style={{
          borderTop: `4px solid ${color}`,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
          e.currentTarget.style.transform = 'translateY(-4px)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        {isCardLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <Statistic
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icon}
                {title}
              </span>
            }
            value={value || 0}
            prefix={prefix}
            precision={0}
            suffix={suffix}
            valueStyle={{ color: color, fontSize: '28px', fontWeight: 'bold' }}
          />
        )}
      </Card>
    </Tooltip>
  )

  return (
    <div style={{ padding: window.innerWidth <= 768 ? '16px' : '24px', maxWidth: '100%', overflowX: 'hidden' }}>
      {/* Header Section: Greeting + Refresh Button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: window.innerWidth <= 480 ? 'flex-start' : 'center',
        flexDirection: window.innerWidth <= 480 ? 'column' : 'row',
        gap: window.innerWidth <= 480 ? '12px' : '0',
        marginBottom: window.innerWidth <= 768 ? '20px' : '32px' 
      }}>
        <div style={{ width: window.innerWidth <= 480 ? '100%' : 'auto' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: window.innerWidth <= 768 ? '24px' : '32px', 
            fontWeight: '700',
            lineHeight: '1.2'
          }}>
            Welcome back, {user?.username}! 👋
          </h1>
          <p style={{ margin: 0, color: '#999', fontSize: window.innerWidth <= 768 ? '13px' : '14px' }}>
            Here's what's happening with your business today
          </p>
        </div>
        <Tooltip title="Refresh all dashboard data">
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefreshDashboard}
            loading={isLoadingChart}
            shape="circle"
            size={window.innerWidth <= 768 ? 'middle' : 'large'}
            style={{ flexShrink: 0 }}
          />
        </Tooltip>
      </div>

      {/* Alert for low stock items requiring reorder */}
      {lowStockItems.length > 0 && (
        <Alert
          message="⚠️ Low Stock Alert"
          description={`${lowStockItems.length} product(s) are running low on inventory and need to be reordered soon`}
          type="warning"
          closable
          showIcon
          style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '24px', borderRadius: '6px' }}
        />
      )}

      {/* Summary Section with KPI Cards */}
      <div style={{ marginBottom: window.innerWidth <= 768 ? '20px' : '32px' }}>
        <h2 style={{ 
          fontSize: window.innerWidth <= 768 ? '16px' : '18px', 
          fontWeight: '600', 
          marginBottom: window.innerWidth <= 768 ? '12px' : '16px' 
        }}>
          📊 Key Performance Indicators
        </h2>
        <Row gutter={[{ xs: 12, sm: 16, lg: 16 }, { xs: 12, sm: 16, lg: 16 }]}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <MetricCard
              title="Total Sales"
              value={stats?.total_sales || 0}
              prefix="UGX "
              icon={<DollarOutlined style={{ fontSize: '18px' }} />}
              color="#52c41a"
              tooltip="Total revenue from all completed sales orders"
              loading={isLoadingCards}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <MetricCard
              title="Total Orders"
              value={stats?.total_orders || 0}
              icon={<ShoppingCartOutlined style={{ fontSize: '18px' }} />}
              color="#1890ff"
              tooltip="Total number of sales orders created"
              loading={isLoadingCards}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <MetricCard
              title="Average Order Value"
              value={stats?.avg_order_value || 0}
              prefix="UGX "
              icon={<BarChartOutlined style={{ fontSize: '18px' }} />}
              color="#fa8c16"
              tooltip="Average value per sales order across all transactions"
              loading={isLoadingCards}
            />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <MetricCard
              title="Low Stock Items"
              value={lowStockItems.length}
              icon={<AlertOutlined style={{ fontSize: '18px' }} />}
              color={lowStockItems.length > 0 ? '#cf1322' : '#52c41a'}
              tooltip="Number of products below minimum stock level"
              loading={isLoadingCards}
            />
          </Col>
        </Row>
      </div>

      {/* Today's Performance Section */}
      {dailyStats && (
        <div style={{ marginBottom: window.innerWidth <= 768 ? '20px' : '32px' }}>
          <h2 style={{ 
            fontSize: window.innerWidth <= 768 ? '16px' : '18px', 
            fontWeight: '600', 
            marginBottom: window.innerWidth <= 768 ? '12px' : '16px' 
          }}>
            📈 Today's Performance
          </h2>
          <Row gutter={[{ xs: 12, sm: 16, lg: 16 }, { xs: 12, sm: 16, lg: 16 }]}>
            <Col xs={24} sm={12} md={12} lg={6}>
              <MetricCard
                title="Today's Revenue"
                value={dailyStats.total_revenue_ugx || 0}
                prefix="UGX "
                icon={<DollarOutlined style={{ fontSize: '18px' }} />}
                color="#1890ff"
                tooltip="Total revenue from sales today"
                loading={isLoadingCards}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <MetricCard
                title="Today's Gross Profit"
                value={dailyStats.gross_profit || 0}
                prefix="UGX "
                icon={<BarChartOutlined style={{ fontSize: '18px' }} />}
                color="#52c41a"
                tooltip="Profit before expenses (Revenue - Cost of Goods)"
                loading={isLoadingCards}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <MetricCard
                title="Today's Expenses"
                value={dailyStats.total_expenses || 0}
                prefix="UGX "
                icon={<ShoppingOutlined style={{ fontSize: '18px' }} />}
                color="#fa8c16"
                tooltip="Total operational expenses incurred today"
                loading={isLoadingCards}
              />
            </Col>
            <Col xs={24} sm={12} md={12} lg={6}>
              <MetricCard
                title="Today's Net Profit"
                value={dailyStats.net_profit || 0}
                prefix="UGX "
                icon={dailyStats.net_profit >= 0 ? <ArrowUpOutlined style={{ fontSize: '18px' }} /> : <ArrowDownOutlined style={{ fontSize: '18px' }} />}
                color={dailyStats.net_profit >= 0 ? '#52c41a' : '#cf1322'}
                tooltip="Actual profit after all expenses (Gross Profit - Expenses)"
                loading={isLoadingCards}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* Sales Trend Section with Chart */}
      {chartData.length > 0 && (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>
              <BarChartOutlined />
              Sales Trend Analysis
            </div>
          }
          extra={
            window.innerWidth > 480 && (
              <Select
                value={selectedDateRange}
                onChange={setSelectedDateRange}
                style={{ width: '140px' }}
                options={[
                  { label: 'Last 7 Days', value: '7' },
                  { label: 'Last 30 Days', value: '30' },
                ]}
              />
            )
          }
          style={{ marginBottom: window.innerWidth <= 768 ? '16px' : '24px' }}
          bodyStyle={{ padding: window.innerWidth <= 768 ? '12px' : '24px' }}
        >
          {window.innerWidth <= 480 && (
            <div style={{ marginBottom: '12px' }}>
              <Select
                value={selectedDateRange}
                onChange={setSelectedDateRange}
                style={{ width: '100%' }}
                options={[
                  { label: 'Last 7 Days', value: '7' },
                  { label: 'Last 30 Days', value: '30' },
                ]}
              />
            </div>
          )}
          {isLoadingChart ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={window.innerWidth <= 768 ? 250 : 320}>
              <LineChart
                data={chartData}
                margin={{ 
                  top: 5, 
                  right: window.innerWidth <= 768 ? 10 : 30, 
                  left: window.innerWidth <= 768 ? -20 : 0, 
                  bottom: 5 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: window.innerWidth <= 768 ? 11 : 12 }}
                />
                <YAxis 
                  tick={{ fontSize: window.innerWidth <= 768 ? 11 : 12 }}
                />
                <ChartTooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    fontSize: window.innerWidth <= 768 ? '12px' : '14px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: window.innerWidth <= 768 ? '11px' : '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#52c41a"
                  name="Sales Revenue (UGX)"
                  strokeWidth={2}
                  dot={{ fill: '#52c41a', r: window.innerWidth <= 768 ? 3 : 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#1890ff"
                  name="Order Count"
                  strokeWidth={2}
                  dot={{ fill: '#1890ff', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No sales data available for the selected period" />
          )}
        </Card>
      )}

      {/* Quick Actions Section */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingOutlined />
            Quick Actions
          </div>
        }
        style={{ marginBottom: '24px' }}
      >
        <Space wrap>
          <Tooltip title="View and manage your product inventory">
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => onNavigate && onNavigate('products')}
            >
              Manage Products
            </Button>
          </Tooltip>
          <Tooltip title="Create a new sales order for a customer">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => onNavigate && onNavigate('sales')}
            >
              Create Sale
            </Button>
          </Tooltip>
          <Tooltip title="View all customer records and information">
            <Button
              icon={<TeamOutlined />}
              onClick={() => onNavigate && onNavigate('customers')}
            >
              View Customers
            </Button>
          </Tooltip>
          <Tooltip title="Generate and manage customer invoices">
            <Button
              icon={<FileTextOutlined />}
              onClick={() => onNavigate && onNavigate('invoices')}
            >
              View Invoices
            </Button>
          </Tooltip>
        </Space>
      </Card>

      {/* Low Stock Alert Table - Shows products needing immediate reorder */}
      {lowStockItems.length > 0 ? (
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cf1322' }}>
              <AlertOutlined />
              Urgent: Reorder Required ({lowStockItems.length} items)
            </div>
          }
          extra={
            <Button 
              type="primary" 
              danger
              onClick={() => onNavigate && onNavigate('products')}
            >
              Manage Inventory
            </Button>
          }
          style={{ marginBottom: '24px' }}
        >
          <Table
            columns={[
              {
                title: 'Product Name',
                dataIndex: 'name',
                key: 'name',
                render: (text) => <strong style={{ cursor: 'pointer', color: '#1890ff' }}>{text}</strong>
              },
              {
                title: 'SKU',
                dataIndex: 'sku',
                key: 'sku'
              },
              {
                title: 'Current Stock',
                dataIndex: 'quantity',
                key: 'quantity',
                render: (qty) => <Tag color="red">{qty} units</Tag>
              },
              {
                title: 'Unit Price',
                dataIndex: 'price',
                key: 'price',
                render: (price) => `UGX ${price?.toLocaleString() || 0}`
              }
            ]}
            dataSource={lowStockItems}
            pagination={false}
            rowKey="_id"
            size="small"
            onRow={(record) => ({
              onClick: () => onNavigate && onNavigate('products'),
              style: { cursor: 'pointer' }
            })}
          />
        </Card>
      ) : !isLoadingCards && !isLoadingChart ? (
        <Card>
          <Empty
            description="✨ All products have healthy stock levels"
            style={{ paddingTop: '48px', paddingBottom: '48px' }}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      ) : null}
    </div>
  )
}

export default DashboardContent
