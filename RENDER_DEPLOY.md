# Render Deployment Instructions

## Step 1: MongoDB Atlas - ✅ Already Configured!
Your MongoDB Atlas is ready:
- Database: `electronics_shop`
- Cluster: `apex-electricals`

## Step 2: Push to GitHub

```powershell
cd "C:\Users\SAP\OneDrive\Desktop\Apex-electrical&electronics"

# Check git status
git status

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Push to GitHub
git push origin saphaniox
```

## Step 3: Deploy Backend on Render

1. **Go to https://render.com** and sign in (or create account with GitHub)

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository:**
   - Repository: `saphaniox/datatabase-test`
   - Branch: `saphaniox` (or `main` if merged)

4. **Configure the service:**
   ```
   Name: apex-electronics-backend
   Region: Choose closest to you
   Branch: saphaniox
   Root Directory: server
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   ```

5. **Select plan:** Free (or paid for better performance)

6. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable"
   
   ```
   NODE_ENV = production
   PORT = 5000
   MONGODB_URL = mongodb+srv://muganzas80_db_user:L5bqBT7oPfsPFnAP@apex-electricals.b9taqtq.mongodb.net/electronics_shop?retryWrites=true&w=majority&appName=apex-electricals
   JWT_SECRET = b6a9393541008626a183be049751d8aaacaa6ec73e0caf85e29ba1ca92a66ecebfbe963e13d804f848de8b282a69f5c362e5f9a876710e570da17a99596b2fee
   ALLOWED_ORIGINS = (will add after frontend deployment)
   ```

7. **Click "Create Web Service"**

8. **Wait for deployment** (5-10 minutes)

9. **Copy your backend URL:** `https://apex-electronics-backend.onrender.com`

## Step 4: Deploy Frontend on Render

1. **Click "New +" → "Static Site"**

2. **Connect same repository:** `saphaniox/datatabase-test`

3. **Configure the static site:**
   ```
   Name: apex-electronics-frontend
   Branch: saphaniox
   Root Directory: client
   Build Command: npm install && npm run build
   Publish Directory: dist
   ```

4. **Add Environment Variable:**
   ```
   VITE_API_URL = https://apex-electronics-backend.onrender.com/api
   ```
   (Replace with your actual backend URL from Step 3)

5. **Click "Create Static Site"**

6. **Wait for deployment** (3-5 minutes)

7. **Copy your frontend URL:** `https://apex-electronics-frontend.onrender.com`

## Step 5: Update Backend CORS

1. Go back to your **backend service** on Render
2. Click "Environment" tab
3. Update `ALLOWED_ORIGINS`:
   ```
   ALLOWED_ORIGINS = https://apex-electronics-frontend.onrender.com
   ```
4. Save changes (will auto-redeploy)

## Step 6: Create Admin User

1. In backend service dashboard, click **"Shell"** tab
2. Run this command:
   ```bash
   npm run seed
   ```

3. **Default Admin Credentials:**
   - Username: `admin`
   - Password: `admin123`

4. **⚠️ IMPORTANT:** Login and change password immediately!

## Step 7: Test Your Deployment

1. Visit your frontend URL
2. Login with admin credentials
3. Test key features:
   - [ ] Product management
   - [ ] Sales
   - [ ] Customers
   - [ ] Reports
   - [ ] User management

## Deployment Complete! 🎉

**Your URLs:**
- Frontend: `https://apex-electronics-frontend.onrender.com`
- Backend: `https://apex-electronics-backend.onrender.com`

## Important Notes:

- **Free tier sleeps after 15 mins of inactivity** - first request may take 30-60 seconds
- Upgrade to paid plan ($7/month) for always-on service
- Monitor logs in Render dashboard if issues occur
- Database is production-ready on MongoDB Atlas

## Troubleshooting:

If deployment fails:
1. Check logs in Render dashboard
2. Verify environment variables
3. Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`
4. Check that all dependencies are in package.json

## Need Help?
Check Render logs or contact support
