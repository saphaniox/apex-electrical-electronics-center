# 🧪 MANUAL TESTING CHECKLIST

## Production URL
**Frontend:** https://apex-electrical-electronics-center.vercel.app

## Test Credentials
- **Username:** admin
- **Password:** Admin@123456

---

## ✅ TEST 1: Login & Authentication
- [ ] Navigate to production URL
- [ ] Enter username: `admin`
- [ ] Enter password: `Admin@123456`
- [ ] Click Login
- [ ] **Expected:** Successfully logged in, redirected to dashboard
- [ ] **Expected:** See user name "admin" in header
- [ ] **Expected:** See admin role indicator

---

## ✅ TEST 2: Dashboard Overview
- [ ] Check dashboard loads without errors
- [ ] **Expected:** See 4 stat cards (Total Revenue, Total Profit, Orders, Customers)
- [ ] **Expected:** Revenue shows UGX values (not 0)
- [ ] **Expected:** Profit shows calculated values
- [ ] **Expected:** Orders count shows 25
- [ ] **Expected:** Customers count shows 15

---

## ✅ TEST 3: Products Management
- [ ] Click "Products" in sidebar
- [ ] **Expected:** See 40 products in the table
- [ ] **Expected:** Products show: name, SKU, price, stock
- [ ] **Expected:** See "Phase Monitor 3-Phase PM3P-001" in list
- [ ] **Expected:** See low stock badge on products with stock ≤ 5
- [ ] Click "Low Stock" tab
- [ ] **Expected:** See 4-5 products with low stock
- [ ] Test search: Enter "LED"
- [ ] **Expected:** Filter to show only LED products
- [ ] Test "Add Product" button (admin should see it)
- [ ] **Expected:** Modal opens with form

---

## ✅ TEST 4: Customers Management  
- [ ] Click "Customers" in sidebar
- [ ] **Expected:** See 15 customers in table
- [ ] **Expected:** See "Kampala Construction Ltd" in list
- [ ] **Expected:** See phone numbers, emails, addresses
- [ ] Click on a customer row to view details
- [ ] Test search: Enter "Tech"
- [ ] **Expected:** Filter to "Tech Solutions Hub"
- [ ] Test "Add Customer" button
- [ ] **Expected:** Modal opens with form

---

## ✅ TEST 5: Sales Orders
- [ ] Click "Sales" in sidebar
- [ ] **Expected:** See 25 sales orders
- [ ] **Expected:** See different statuses (pending, processing, completed)
- [ ] **Expected:** See customer names, total amounts, dates
- [ ] Filter by status: Select "Completed"
- [ ] **Expected:** Show only completed orders
- [ ] Click on an order to view details
- [ ] **Expected:** See itemized list of products
- [ ] Test "Create Sales Order" button
- [ ] **Expected:** Modal opens with form

---

## ✅ TEST 6: Invoices
- [ ] Click "Invoices" in sidebar
- [ ] **Expected:** See 15 invoices
- [ ] **Expected:** See invoice numbers (INV-XXXXXX-X format)
- [ ] **Expected:** See payment statuses: Paid, Partial, Pending, Overdue
- [ ] **Expected:** Different colored tags for each status
- [ ] Filter by "Pending" status
- [ ] **Expected:** Show only pending invoices
- [ ] Click "Print" icon on an invoice
- [ ] **Expected:** Print preview opens
- [ ] Click "PDF" icon on an invoice
- [ ] **Expected:** PDF downloads

---

## ✅ TEST 7: Returns Management
- [ ] Click "Returns" in sidebar
- [ ] **Expected:** See 3 returns
- [ ] **Expected:** See return reasons displayed
- [ ] **Expected:** See statuses: Pending, Approved, Rejected
- [ ] **Expected:** See customer information
- [ ] Test status filter
- [ ] **Expected:** Filter works correctly
- [ ] For admin: Try approving/rejecting a return
- [ ] **Expected:** Status updates successfully

---

## ✅ TEST 8: Analytics Dashboard
- [ ] Click "Analytics" in sidebar
- [ ] **Expected:** Page loads with charts
- [ ] **Expected:** See daily sales chart (line graph)
- [ ] **Expected:** See profit analysis chart
- [ ] **Expected:** See top-selling products table
- [ ] Change period filter to "Month"
- [ ] **Expected:** Charts update with monthly data
- [ ] **Expected:** Revenue and profit values update
- [ ] Scroll down to check all charts load

---

## ✅ TEST 9: User Management (Admin Only)
- [ ] Click "Users" in sidebar
- [ ] **Expected:** See 3 users (Nume, Delvin, admin)
- [ ] **Expected:** See role badges (admin, sales)
- [ ] Try changing a user's role
- [ ] **Expected:** Role updates successfully
- [ ] Try to delete protected admin (admin@apexelectricals.com)
- [ ] **Expected:** Error message: "This is a protected system administrator account"
- [ ] Try to delete protected user (nbulasio38@gmail.com)
- [ ] **Expected:** Error message: "This is a protected system administrator account"

---

## ✅ TEST 10: Profile Management
- [ ] Click user avatar/name in header
- [ ] Select "Profile" from dropdown
- [ ] **Expected:** See profile page with avatar
- [ ] **Expected:** See username, email, role badge
- [ ] **Expected:** See 3 buttons: Upload Picture, Delete Picture, Change Password
- [ ] Click "Change Password"
- [ ] **Expected:** Modal opens with password form
- [ ] Try uploading a profile picture
- [ ] **Expected:** Upload works, avatar updates

---

## ✅ TEST 11: Search & Filters (Advanced)
- [ ] Go to Products page
- [ ] Click "Advanced Search" button
- [ ] **Expected:** Drawer opens on right side
- [ ] Apply multiple filters (category, stock status)
- [ ] **Expected:** Results filter correctly
- [ ] Clear filters
- [ ] **Expected:** All products shown again
- [ ] Test on Customers page
- [ ] **Expected:** Advanced search works there too

---

## ✅ TEST 12: Mobile Responsiveness
- [ ] Open on mobile device or resize browser to mobile size
- [ ] **Expected:** Hamburger menu appears
- [ ] Click hamburger menu
- [ ] **Expected:** Sidebar slides in from left
- [ ] Navigate to different pages
- [ ] **Expected:** All pages are readable and usable
- [ ] Check Profile page on mobile
- [ ] **Expected:** All buttons stack vertically and are visible
- [ ] Scroll down on any page
- [ ] **Expected:** Back button and "Back to Top" button appear (bottom right)
- [ ] Click "Back to Top" button
- [ ] **Expected:** Smooth scroll to top

---

## ✅ TEST 13: Print & Export Features
- [ ] Go to Products page
- [ ] Click "Print" button
- [ ] **Expected:** Print-friendly view opens
- [ ] Click "Export PDF" button
- [ ] **Expected:** PDF downloads with products table
- [ ] Click "Export CSV" button
- [ ] **Expected:** CSV file downloads
- [ ] Test same on Customers, Sales, Invoices pages
- [ ] **Expected:** All export features work

---

## ✅ TEST 14: Backup & Restore (Admin Only)
- [ ] Click "Backup" in sidebar
- [ ] **Expected:** See backup management page
- [ ] Click "Create Backup"
- [ ] **Expected:** Backup created successfully
- [ ] **Expected:** See backup in list with timestamp
- [ ] Try downloading a backup
- [ ] **Expected:** JSON file downloads

---

## ✅ TEST 15: Real-time Data Validation
- [ ] Go to Dashboard
- [ ] Note the total revenue value
- [ ] Create a new sales order with known value
- [ ] Return to Dashboard
- [ ] **Expected:** Revenue increases by sale amount
- [ ] Check Analytics page
- [ ] **Expected:** Charts reflect new data
- [ ] Go to Products page
- [ ] Note stock of a product
- [ ] Create sale with that product
- [ ] **Expected:** Product stock decreases

---

## ✅ TEST 16: Protected Routes & Permissions
- [ ] Logout
- [ ] Try to access: https://apex-electrical-electronics-center.vercel.app/dashboard
- [ ] **Expected:** Redirected to login page
- [ ] Login as "Delvin" (sales role) if you have password
- [ ] **Expected:** Cannot see "Users" menu item
- [ ] **Expected:** Cannot delete products (no delete button)
- [ ] **Expected:** Can create sales and invoices

---

## ✅ TEST 17: Footer Information
- [ ] Scroll to bottom of any page
- [ ] **Expected:** See "Apex Electrical & Electronics Center"
- [ ] **Expected:** See "Maya Nanziga, Kampala Uganda"
- [ ] **Expected:** See "Designed and powered by SAP Technologies Uganda"

---

## 📊 FINAL VERIFICATION

### Data Counts (Should Match)
- [ ] Products: 40
- [ ] Customers: 15
- [ ] Sales Orders: 25
- [ ] Invoices: 15
- [ ] Returns: 3
- [ ] Users: 3

### Low Stock Products (Should Have 4-5)
- [ ] Phase Failure Relay (3 units)
- [ ] Motor Starter 7.5HP (2 units)
- [ ] Time Delay Relay (4 units)
- [ ] Contactor 32A 3-Phase (5 units)
- [ ] Industrial Socket 32A (3 units)

---

## 🎯 SUCCESS CRITERIA
- All 17 test sections pass
- No console errors in browser
- All data displays correctly
- All calculations (profit, revenue) are accurate
- Mobile view works perfectly
- Protected routes work
- Role-based access control works
- All export features work

---

## 📝 NOTES SECTION
Use this space to note any issues found:

```
Issue 1:
Issue 2:
Issue 3:
```

---

**Test Date:** ___________
**Tester:** ___________
**Result:** ___________
