import https from 'https';

const API_URL = 'https://apex-electrical-electronics-center.onrender.com/api';
let authToken = '';

// Helper function to make API requests
function makeRequest(path, method = 'GET', data = null, useAuth = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (useAuth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 APEX ELECTRICAL & ELECTRONICS - SYSTEM TEST\n');
  console.log('=' .repeat(60));
  
  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Login
  console.log('\n📌 TEST 1: User Authentication');
  try {
    const loginData = {
      username: 'admin',
      password: 'Admin@123456'
    };
    
    const loginResult = await makeRequest('/auth/login', 'POST', loginData);
    
    if (loginResult.status === 200 && loginResult.data.token) {
      authToken = loginResult.data.token;
      console.log('   ✅ Login successful');
      console.log(`   User: ${loginResult.data.user.username}`);
      console.log(`   Role: ${loginResult.data.user.role}`);
      passedTests++;
    } else {
      console.log('   ❌ Login failed:', loginResult.status);
      console.log('   Response:', loginResult.data);
      failedTests++;
      // Try to continue with other tests that don't require auth
    }
  } catch (error) {
    console.log('   ❌ Login error:', error.message);
    failedTests++;
  }

  // Test 2: Fetch Products
  console.log('\n📌 TEST 2: Product Management');
  try {
    const productsResult = await makeRequest('/products?page=1&limit=10', 'GET', null, true);
    
    if (productsResult.status === 200 && productsResult.data.data) {
      console.log(`   ✅ Products fetched: ${productsResult.data.data.length} items`);
      console.log(`   Total products: ${productsResult.data.pagination.total}`);
      if (productsResult.data.data.length > 0) {
        console.log(`   Sample: ${productsResult.data.data[0].name}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Products fetch failed:', productsResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Products error:', error.message);
    failedTests++;
  }

  // Test 3: Fetch Customers
  console.log('\n📌 TEST 3: Customer Management');
  try {
    const customersResult = await makeRequest('/customers?page=1&limit=10', 'GET', null, true);
    
    if (customersResult.status === 200 && customersResult.data.data) {
      console.log(`   ✅ Customers fetched: ${customersResult.data.data.length} customers`);
      console.log(`   Total customers: ${customersResult.data.pagination.total}`);
      if (customersResult.data.data.length > 0) {
        console.log(`   Sample: ${customersResult.data.data[0].name}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Customers fetch failed:', customersResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Customers error:', error.message);
    failedTests++;
  }

  // Test 4: Fetch Sales Orders
  console.log('\n📌 TEST 4: Sales Order Management');
  try {
    const salesResult = await makeRequest('/sales?page=1&limit=10', 'GET', null, true);
    
    if (salesResult.status === 200 && salesResult.data.data) {
      console.log(`   ✅ Sales orders fetched: ${salesResult.data.data.length} orders`);
      console.log(`   Total sales: ${salesResult.data.pagination.total}`);
      if (salesResult.data.data.length > 0) {
        console.log(`   Sample: Order for ${salesResult.data.data[0].customer_name}`);
        console.log(`   Status: ${salesResult.data.data[0].status}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Sales orders fetch failed:', salesResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Sales orders error:', error.message);
    failedTests++;
  }

  // Test 5: Fetch Invoices
  console.log('\n📌 TEST 5: Invoice Management');
  try {
    const invoicesResult = await makeRequest('/invoices?page=1&limit=10', 'GET', null, true);
    
    if (invoicesResult.status === 200 && invoicesResult.data.data) {
      console.log(`   ✅ Invoices fetched: ${invoicesResult.data.data.length} invoices`);
      console.log(`   Total invoices: ${invoicesResult.data.pagination.total}`);
      if (invoicesResult.data.data.length > 0) {
        console.log(`   Sample: ${invoicesResult.data.data[0].invoice_number}`);
        console.log(`   Payment status: ${invoicesResult.data.data[0].payment_status}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Invoices fetch failed:', invoicesResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Invoices error:', error.message);
    failedTests++;
  }

  // Test 6: Fetch Returns
  console.log('\n📌 TEST 6: Returns Management');
  try {
    const returnsResult = await makeRequest('/returns?page=1&limit=10', 'GET', null, true);
    
    if (returnsResult.status === 200 && returnsResult.data.data) {
      console.log(`   ✅ Returns fetched: ${returnsResult.data.data.length} returns`);
      console.log(`   Total returns: ${returnsResult.data.pagination.total}`);
      if (returnsResult.data.data.length > 0) {
        console.log(`   Sample status: ${returnsResult.data.data[0].status}`);
        console.log(`   Reason: ${returnsResult.data.data[0].reason}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Returns fetch failed:', returnsResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Returns error:', error.message);
    failedTests++;
  }

  // Test 7: Analytics - Daily Report
  console.log('\n📌 TEST 7: Analytics - Daily Report');
  try {
    const dailyResult = await makeRequest('/reports/daily', 'GET', null, true);
    
    if (dailyResult.status === 200) {
      console.log('   ✅ Daily analytics working');
      console.log(`   Total sales: UGX ${dailyResult.data.total_sales?.toLocaleString() || 0}`);
      console.log(`   Total profit: UGX ${dailyResult.data.total_profit?.toLocaleString() || 0}`);
      console.log(`   Orders today: ${dailyResult.data.orders_count || 0}`);
      passedTests++;
    } else {
      console.log('   ❌ Daily analytics failed:', dailyResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Daily analytics error:', error.message);
    failedTests++;
  }

  // Test 8: Analytics - Profit Report
  console.log('\n📌 TEST 8: Analytics - Profit Report');
  try {
    const profitResult = await makeRequest('/reports/profit', 'GET', null, true);
    
    if (profitResult.status === 200) {
      console.log('   ✅ Profit analytics working');
      console.log(`   Total revenue: UGX ${profitResult.data.total_revenue?.toLocaleString() || 0}`);
      console.log(`   Total profit: UGX ${profitResult.data.total_profit?.toLocaleString() || 0}`);
      console.log(`   Profit margin: ${profitResult.data.profit_margin?.toFixed(2) || 0}%`);
      passedTests++;
    } else {
      console.log('   ❌ Profit analytics failed:', profitResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Profit analytics error:', error.message);
    failedTests++;
  }

  // Test 9: Product Demand Analytics
  console.log('\n📌 TEST 9: Product Demand Analytics');
  try {
    const demandResult = await makeRequest('/products/demand', 'GET', null, true);
    
    if (demandResult.status === 200) {
      console.log('   ✅ Product demand analytics working');
      if (demandResult.data.top_sellers && demandResult.data.top_sellers.length > 0) {
        console.log(`   Top seller: ${demandResult.data.top_sellers[0].name}`);
        console.log(`   Units sold: ${demandResult.data.top_sellers[0].total_sold}`);
      }
      passedTests++;
    } else {
      console.log('   ❌ Product demand failed:', demandResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Product demand error:', error.message);
    failedTests++;
  }

  // Test 10: User Management
  console.log('\n📌 TEST 10: User Management');
  try {
    const usersResult = await makeRequest('/users', 'GET', null, true);
    
    if (usersResult.status === 200 && Array.isArray(usersResult.data)) {
      console.log(`   ✅ Users fetched: ${usersResult.data.length} users`);
      const roles = usersResult.data.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      console.log('   Roles:', JSON.stringify(roles));
      passedTests++;
    } else {
      console.log('   ❌ Users fetch failed:', usersResult.status);
      failedTests++;
    }
  } catch (error) {
    console.log('   ❌ Users error:', error.message);
    failedTests++;
  }

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! System is fully operational.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

runTests().catch(console.error);
