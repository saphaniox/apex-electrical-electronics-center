# Deployment Guide - Apex Electricals & Electronics

## Quick Deployment Steps

### 1. Set Up MongoDB Atlas (Free Database)
1. Go to https://mongodb.com/cloud/atlas
2. Create account and cluster (free tier)
3. Create database user
4. Whitelist IP: `0.0.0.0/0` (all IPs)
5. Get connection string

### 2. Deploy to Render

#### Backend:
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo: `saphaniox/datatabase-test`
4. Settings:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Environment Variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URL=<your-mongodb-atlas-url>
   JWT_SECRET=b6a9393541008626a183be049751d8aaacaa6ec73e0caf85e29ba1ca92a66ecebfbe963e13d804f848de8b282a69f5c362e5f9a876710e570da17a99596b2fee
   ALLOWED_ORIGINS=<your-frontend-url>
   ```
6. Deploy and save backend URL

#### Frontend:
1. Create `client/.env.production`:
   ```
   VITE_API_URL=<your-backend-url>/api
   ```
2. Commit and push
3. Render → New Static Site
4. Settings:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Deploy

### 3. Update Backend CORS
Update `ALLOWED_ORIGINS` in backend with frontend URL and redeploy

### 4. Create Admin User
In backend shell: `npm run seed`

Default credentials:
- Username: `admin`
- Password: `admin123`

**Change password immediately after first login!**

## Alternative: Deploy to VPS

See detailed VPS deployment guide in README.md

## Support
For issues, check logs in deployment platform dashboard
