# Vercel Deployment Guide - Apex Electricals & Electronics

## 🚀 Deploy Frontend to Vercel + Backend to Render

### Step 1: Deploy Backend to Render (API Server)

1. **Go to https://render.com** and sign in with GitHub

2. **Click "New +" → "Web Service"**

3. **Connect Repository:**
   - Select: `saphaniox/apex-electrical-electronics-center`
   - Click "Connect"

4. **Configure Service:**
   ```
   Name: apex-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

5. **Add Environment Variables:**
   Click "Environment" tab or "Advanced" → Add these:
   
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URL=mongodb+srv://muganzas80_db_user:L5bqBT7oPfsPFnAP@apex-electricals.b9taqtq.mongodb.net/electronics_shop?retryWrites=true&w=majority&appName=apex-electricals
   JWT_SECRET=b6a9393541008626a183be049751d8aaacaa6ec73e0caf85e29ba1ca92a66ecebfbe963e13d804f848de8b282a69f5c362e5f9a876710e570da17a99596b2fee
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```
   
   (You'll update ALLOWED_ORIGINS after deploying frontend)

6. **Click "Create Web Service"**

7. **Wait for deployment** (5-10 minutes)

8. **Copy your backend URL:**
   - Example: `https://apex-backend.onrender.com`
   - Save this! You'll need it for Vercel

---

### Step 2: Deploy Frontend to Vercel

#### Option A: Using Vercel CLI (Fastest)

1. **Install Vercel CLI:**
   ```powershell
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```powershell
   vercel login
   ```

3. **Deploy:**
   ```powershell
   cd "c:\Users\SAP\OneDrive\Desktop\Apex-electrical&electronics"
   vercel
   ```

4. **Follow prompts:**
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? **apex-electronics** (or your choice)
   - In which directory is your code? **./client**
   - Override settings? **Y**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Development Command: `npm run dev`

5. **Add Environment Variable:**
   ```powershell
   vercel env add VITE_API_URL
   ```
   - What's the value? `https://apex-backend.onrender.com/api`
   - Which environments? **Production, Preview, Development**

6. **Redeploy with env variable:**
   ```powershell
   vercel --prod
   ```

#### Option B: Using Vercel Dashboard (Easier)

1. **Go to https://vercel.com** and sign in with GitHub

2. **Click "Add New..." → "Project"**

3. **Import Repository:**
   - Find: `saphaniox/apex-electrical-electronics-center`
   - Click "Import"

4. **Configure Project:**
   ```
   Project Name: apex-electronics
   Framework Preset: Vite
   Root Directory: client
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

5. **Add Environment Variable:**
   - Click "Environment Variables"
   - Name: `VITE_API_URL`
   - Value: `https://apex-backend.onrender.com/api`
   - (Use your actual backend URL from Render)
   - Environments: Production, Preview, Development

6. **Click "Deploy"**

7. **Wait for deployment** (2-5 minutes)

8. **Your app will be live!**
   - Example: `https://apex-electronics.vercel.app`

---

### Step 3: Update Backend CORS

1. Go back to **Render dashboard**
2. Open your backend service
3. Click **"Environment"** tab
4. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS=https://apex-electronics.vercel.app
   ```
   (Use your actual Vercel URL)
5. Save - Render will auto-redeploy

---

### Step 4: Create Admin User

1. In **Render backend service dashboard**
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run seed
   ```

4. **Default Admin Credentials:**
   - Username: `admin`
   - Password: `Admin@123456`
   
5. **⚠️ IMPORTANT:** Login immediately and change password!

---

### Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Login with admin credentials
3. Test features:
   - ✅ Products management
   - ✅ Sales creation
   - ✅ Customer management
   - ✅ Reports
   - ✅ User management

---

## 🎉 Deployment Complete!

**Your URLs:**
- 🌐 Frontend: `https://your-app.vercel.app`
- 🔧 Backend: `https://apex-backend.onrender.com`
- 🗄️ Database: MongoDB Atlas

---

## 📝 Quick Commands Reference

### Vercel CLI Commands:
```powershell
# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Add environment variable
vercel env add VARIABLE_NAME

# Remove deployment
vercel remove project-name
```

---

## 🔧 Troubleshooting

### Frontend can't connect to backend:
1. Check VITE_API_URL in Vercel environment variables
2. Verify backend URL is correct
3. Check CORS settings in backend

### Backend deployment fails:
1. Check Render logs
2. Verify MongoDB Atlas IP whitelist: `0.0.0.0/0`
3. Check environment variables are set correctly

### 404 errors on page refresh:
- ✅ Already handled by vercel.json rewrites configuration

---

## 🚨 Important Notes

1. **Free Tier Limitations:**
   - Render: Sleeps after 15 min inactivity
   - First request may take 30-60 seconds
   - Consider upgrading for production use

2. **Security:**
   - Change default admin password immediately
   - Keep JWT_SECRET secure
   - Never commit .env files

3. **Monitoring:**
   - Check Vercel Analytics for frontend
   - Check Render logs for backend issues
   - Monitor MongoDB Atlas usage

---

## 🎯 Next Steps

1. Set up custom domain (optional)
2. Configure email notifications
3. Set up backup automation
4. Monitor application performance
5. Plan for scaling

**Need help?** Check Vercel and Render documentation or logs!
