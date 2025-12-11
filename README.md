# Apex Electricals & Electronics Center ⚡

Complete Inventory Management & Point of Sale System

## 🚀 Quick Start

### Development Mode

1. **Install Dependencies:**
   ```bash
   # Server
   cd server
   npm install
   
   # Client
   cd client
   npm install
   ```

2. **Set Up Environment:**
   ```bash
   # Server - Copy and configure
   cd server
   cp .env.example .env
   # Edit .env with your MongoDB URL
   
   # Client - Copy and configure
   cd client
   cp .env.example .env
   ```

3. **Start MongoDB:**
   ```bash
   # Make sure MongoDB is running
   # Windows: mongod
   # Linux/Mac: sudo systemctl start mongod
   ```

4. **Seed Database (Optional):**
   ```bash
   cd server
   npm run seed
   ```

5. **Run Application:**
   ```bash
   # Terminal 1 - Backend
   cd server
   npm run dev
   
   # Terminal 2 - Frontend
   cd client
   npm run dev
   ```

6. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📦 Features

### ✅ User Management
- Admin and User roles
- JWT authentication
- Profile management with picture upload

### ✅ Product Management
- Add, edit, delete products
- Stock tracking
- Cost price & selling price
- Profit calculation
- Low stock alerts

### ✅ Customer Management
- Customer database
- Contact information
- Purchase history

### ✅ Sales Orders
- Multi-item sales
- Custom pricing per item
- Stock deduction
- Profit tracking

### ✅ Invoices
- Generate from sales orders
- Direct invoice creation
- Custom pricing
- PDF export
- Multiple currencies (UGX/USD)

### ✅ Analytics Dashboard
- Sales trends
- Profit analysis
- Revenue tracking
- Top products
- Interactive charts

### ✅ Security Features
- Strong JWT encryption
- Password hashing (bcrypt)
- Rate limiting (brute force protection)
- CORS protection
- Input sanitization (NoSQL injection prevention)
- Security headers (Helmet.js)

### ✅ Responsive Design
- Mobile-first approach
- Works on phones, tablets, desktops
- Adaptive layouts

## 🛠️ Technology Stack

### Frontend
- React 18.2.0
- Ant Design 5.11.2
- Chart.js & Recharts
- Vite 5.0.8
- Axios

### Backend
- Node.js
- Express 4.18.2
- MongoDB 6.3.0
- JWT Authentication
- Helmet.js Security
- Rate Limiting

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - How to deploy to production
- **[Security Audit](SECURITY_AUDIT.md)** - Security analysis
- **[Security Fixes](SECURITY_FIXES_APPLIED.md)** - Applied security improvements
- **[System Status](SYSTEM_STATUS.md)** - Complete feature list

## 🔐 Default Login

After running seed:
- **Username:** admin
- **Password:** Admin@123456

**⚠️ Change default password immediately in production!**

## 🌐 Network Access

Access from other devices on your network:
1. Find your IP: Check SYSTEM_STATUS.md
2. Use: http://YOUR_IP:5173

## 📝 Environment Variables

### Server (.env)
```env
PORT=5000
MONGODB_URL=mongodb://localhost:27017/electronics_shop
JWT_SECRET=your-secret-key
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173
```

### Client (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Production Build

```bash
# Build frontend
cd client
npm run build

# Serve with static server or deploy to hosting
```

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## 🧪 Testing

```bash
# Run system check
node system-check.js
```

## 📊 Project Structure

```
stock-sales-tracking-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   └── dist/              # Production build
│
├── server/                # Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── db/           # Database connection
│   │   └── utils/        # Server utilities
│   └── uploads/          # User uploads
│
└── docs/                 # Documentation
```

## 🤝 Contributing

This is a private business management system. For support:
- Check documentation files
- Review code comments
- Contact system administrator

## 📄 License

Proprietary - Apex Electricals & Electronics Center

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess
Stop-Process -Id [PID]

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check MONGODB_URL in .env
- Verify database permissions

### Frontend Can't Connect to Backend
- Verify backend is running on port 5000
- Check CORS settings in server
- Update ALLOWED_ORIGINS in .env

### Build Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📞 Support

For production deployment assistance, see DEPLOYMENT_GUIDE.md

---

**Built with ❤️ for Apex Electricals & Electronics Center**
