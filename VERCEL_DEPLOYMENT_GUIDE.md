# Vercel Deployment Guide - Apex Electrical & Electronics Center

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository pushed (✅ Already done!)

## Option 1: Deploy via Vercel Dashboard (RECOMMENDED - Easiest)

### Step 1: Go to Vercel Dashboard
1. Visit https://vercel.com/login
2. Sign in with your GitHub account

### Step 2: Import Project
1. Click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Find and select: `saphaniox/apex-electrical-electronics-center`
4. Click "Import"

### Step 3: Configure Project
When the configuration screen appears:

**Framework Preset:** Vite
**Root Directory:** `client` (IMPORTANT - click "Edit" and set this!)
**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `dist` (auto-detected)
**Install Command:** `npm install` (auto-detected)

### Step 4: Add Environment Variables
Click "Environment Variables" section and add:

**Name:** `VITE_API_URL`
**Value:** `https://apex-electrical-electronics-center.onrender.com/api`
**Environment:** Production, Preview, Development (select all)

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## Option 2: Deploy via Vercel CLI (Advanced)

### Step 1: Install Vercel CLI
```powershell
npm install -g vercel
```

### Step 2: Navigate to Client Folder
```powershell
cd client
```

### Step 3: Login to Vercel
```powershell
vercel login
```
Follow the prompts to authenticate

### Step 4: Deploy
```powershell
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No**
- Project name? Press Enter (use default) or type custom name
- In which directory is your code located? **'./'**
- Auto-detected settings? **Yes**

### Step 5: Add Environment Variable
```powershell
vercel env add VITE_API_URL production
```
When prompted, enter: `https://apex-electrical-electronics-center.onrender.com/api`

### Step 6: Deploy to Production
```powershell
vercel --prod
```

---

## Post-Deployment

### Verify Deployment
1. Visit your Vercel URL
2. Try logging in with:
   - Username: `admin`
   - Password: `Admin@123456`

### Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### Troubleshooting

**Build fails?**
- Make sure Root Directory is set to `client`
- Check that `VITE_API_URL` is set correctly

**404 on routes?**
- vercel.json is already configured ✅

**API calls fail?**
- Verify environment variable is set
- Check browser console for CORS errors
- Ensure Render API is running

---

## Your Configuration (Already Set Up ✅)

- ✅ vercel.json configured for SPA routing
- ✅ API URL ready: https://apex-electrical-electronics-center.onrender.com/api
- ✅ Build scripts working
- ✅ All features tested

## Next Steps

1. Choose Option 1 (Dashboard) or Option 2 (CLI)
2. Deploy following the steps above
3. Test your live application
4. Share your Vercel URL!

---

**Recommended:** Use Option 1 (Dashboard) - it's easier and provides better visibility of deployment status.
