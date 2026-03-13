# DocuQuery Deployment Guide

Complete step-by-step guide to deploy DocuQuery to production using Render (backend) and Vercel (frontend).

---

## 📋 Prerequisites

Before starting deployment, ensure you have:

- ✅ GitHub account with DocuQuery repository
- ✅ Supabase account (free tier works)
- ✅ Cohere API key (free tier available)
- ✅ Render account (sign up at https://render.com)
- ✅ Vercel account (sign up at https://vercel.com)
- ✅ Domain name (optional, but recommended)

---

## 🗄️ Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Fill in project details:
   - **Organization**: Select or create
   - **Name**: `docuquery-prod`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)
   - **Pricing Plan**: Free tier is sufficient to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning

### 1.2 Run Database Schema

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open your local `database/production_schema.sql` file
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter)
7. Verify success message: "Success. No rows returned"

### 1.3 Verify Tables Created

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `workspaces`
   - `workspace_members`
   - `documents`
   - `document_chunks`
   - `conversations`
   - `messages`
   - `query_logs`
   - `workspace_invitations`
   - `notifications`
   - `user_settings`

### 1.4 Create Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Configure bucket:
   - **Name**: `documents`
   - **Public bucket**: ❌ No (keep private)
   - **File size limit**: `20971520` (20MB in bytes)
   - **Allowed MIME types**: 
     ```
     application/pdf
     application/vnd.openxmlformats-officedocument.wordprocessingml.document
     text/plain
     text/markdown
     ```
4. Click **"Create bucket"**

### 1.5 Get API Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (⚠️ Keep this secret!)

3. Go to **Settings** → **Database**
4. Scroll to **Connection string** → **URI**
5. Copy the connection string:
   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password

---

## 🚀 Step 2: Backend Deployment (Render)

### 2.1 Create Render Account

1. Go to https://render.com
2. Click **"Get Started"**
3. Sign up with GitHub (recommended for easy deployment)
4. Authorize Render to access your GitHub repositories

### 2.2 Create New Web Service

1. From Render Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect a repository"**
3. If you don't see your repository:
   - Click **"Configure account"**
   - Grant access to your DocuQuery repository
4. Select **"satvik-sharma-05/DocuQuery"** repository
5. Click **"Connect"**

### 2.3 Configure Web Service

Fill in the configuration:

**Basic Settings**:
- **Name**: `docuquery-api` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  uvicorn main:app --host 0.0.0.0 --port $PORT
  ```

**Instance Type**:
- Select **"Free"** (for testing) or **"Starter"** (for production)
- Free tier: 750 hours/month, sleeps after 15 min inactivity
- Starter: $7/month, always on, better performance

### 2.4 Add Environment Variables

Scroll down to **"Environment Variables"** section and add these:

Click **"Add Environment Variable"** for each:

```bash
# App Configuration
APP_NAME=DocuQuery
APP_ENV=production
APP_PORT=8000
FRONTEND_URL=https://your-app.vercel.app

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
SUPABASE_STORAGE_BUCKET=documents

# Cohere API
COHERE_API_KEY=your-cohere-api-key
LLM_MODEL=command-a-03-2025
EMBEDDING_MODEL=embed-english-v3.0
EMBEDDING_DIMENSION=1024

# RAG Settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
MAX_TOKENS=2000

# File Upload
MAX_FILE_SIZE_MB=20
ALLOWED_FILE_TYPES=pdf,docx,txt,md

# Logging
LOG_LEVEL=INFO
```

**⚠️ Important Notes**:
- Replace `FRONTEND_URL` with your actual Vercel URL (update after frontend deployment)
- Use your actual Supabase credentials
- Use your actual Cohere API key
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret!

### 2.5 Deploy Backend

1. Click **"Create Web Service"**
2. Render will start building your application
3. Watch the build logs in real-time
4. Wait for deployment to complete (3-5 minutes)
5. Look for: **"Your service is live 🎉"**

### 2.6 Verify Backend Deployment

1. Copy your Render URL: `https://docuquery-api.onrender.com`
2. Test these endpoints in your browser:
   - Health check: `https://docuquery-api.onrender.com/health`
     - Should return: `{"status":"healthy","app":"DocuQuery"}`
   - API docs: `https://docuquery-api.onrender.com/docs`
     - Should show FastAPI Swagger UI
   - Root: `https://docuquery-api.onrender.com/`
     - Should return: `{"message":"Welcome to DocuQuery API"}`

### 2.7 Configure Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter your domain: `api.yourdomain.com`
6. Add CNAME record at your DNS provider:
   - **Type**: CNAME
   - **Name**: api
   - **Value**: `docuquery-api.onrender.com`
7. Wait for DNS propagation (up to 24 hours)
8. SSL certificate will be auto-generated

---

## 🌐 Step 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

### 3.2 Import Project

1. From Vercel Dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find **"satvik-sharma-05/DocuQuery"**
4. Click **"Import"**

### 3.3 Configure Project

**Configure Project Settings**:

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `frontend`
  - Click **"Edit"** next to Root Directory
  - Enter: `frontend`
  - Click **"Continue"**
- **Build Command**: `npm run build` (default, leave as is)
- **Output Directory**: `.next` (default, leave as is)
- **Install Command**: `npm install` (default, leave as is)

### 3.4 Add Environment Variables

Click **"Environment Variables"** section and add:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://docuquery-api.onrender.com
```

**⚠️ Important**:
- Use your actual Supabase URL and anon key
- Use your actual Render backend URL
- These are public variables (safe to expose)
- Don't use `SUPABASE_SERVICE_ROLE_KEY` in frontend!

### 3.5 Deploy Frontend

1. Click **"Deploy"**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build your Next.js app
   - Deploy to global CDN
3. Wait for deployment (2-4 minutes)
4. Look for: **"Congratulations! Your project has been deployed"**

### 3.6 Get Deployment URL

1. Copy your Vercel URL: `https://docu-query-xxxxx.vercel.app`
2. This is your production URL!

### 3.7 Update Backend CORS

Now that you have your frontend URL, update backend:

1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://docu-query-xxxxx.vercel.app
   ```
5. Click **"Save Changes"**
6. Service will automatically redeploy

### 3.8 Verify Frontend Deployment

1. Visit your Vercel URL: `https://docu-query-xxxxx.vercel.app`
2. You should see the DocuQuery landing page
3. Test navigation:
   - Click **"Login"** → Should show login page
   - Click **"Register"** → Should show registration page

### 3.9 Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Click **"Add"**
4. Enter your domain: `docuquery.com` or `app.yourdomain.com`
5. Vercel will provide DNS instructions
6. Add DNS records at your domain registrar:

**For root domain (docuquery.com)**:
```
Type: A
Name: @
Value: 76.76.21.21
```

**For www subdomain**:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

7. Click **"Verify"**
8. Wait for DNS propagation (up to 24 hours)
9. SSL certificate auto-generated by Vercel

---

## ✅ Step 4: Post-Deployment Configuration

### 4.1 Test Complete Flow

1. **Register a new user**:
   - Go to your frontend URL
   - Click "Register"
   - Enter email and password
   - Should redirect to dashboard
   - Default workspace created automatically

2. **Upload a document**:
   - Go to Documents page
   - Click "Upload Document"
   - Select a PDF or DOCX file
   - Enter description
   - Click "Upload"
   - Document should appear in list
   - Wait for processing (check Render logs)

3. **Test chat**:
   - Go to Chat page
   - Click "New Chat"
   - Type a question about your document
   - Wait for AI response (5-15 seconds)
   - Should see answer with sources

4. **Test workspace features**:
   - Create new workspace
   - Invite team member
   - Switch between workspaces

### 4.2 Monitor Deployments

**Render (Backend)**:
- Dashboard: https://dashboard.render.com
- View logs: Click service → "Logs" tab
- Monitor metrics: "Metrics" tab
- Check health: `https://your-api.onrender.com/health`

**Vercel (Frontend)**:
- Dashboard: https://vercel.com/dashboard
- View deployments: Click project → "Deployments"
- View logs: Click deployment → "Logs"
- Analytics: "Analytics" tab

### 4.3 Set Up Monitoring (Recommended)

**Backend Monitoring**:
1. Enable Render's built-in monitoring
2. Set up alerts for:
   - Service downtime
   - High error rates
   - Memory/CPU usage

**Frontend Monitoring**:
1. Enable Vercel Analytics (free)
2. Monitor:
   - Page load times
   - Core Web Vitals
   - Error rates

**Database Monitoring**:
1. Supabase Dashboard → "Database" → "Monitoring"
2. Watch:
   - Connection count
   - Query performance
   - Storage usage

### 4.4 Configure Backups

**Database Backups** (Supabase):
1. Go to Supabase Dashboard
2. Settings → Database → Backups
3. Enable automatic daily backups
4. Configure retention period

**Code Backups**:
- Already handled by GitHub
- Ensure you push changes regularly

---

## 🔧 Step 5: Troubleshooting

### Common Issues

#### Backend Issues

**Problem**: Build fails on Render
```
Solution:
1. Check requirements.txt is correct
2. Verify Python version compatibility
3. Check Render logs for specific error
4. Ensure all dependencies are listed
```

**Problem**: Backend returns 500 errors
```
Solution:
1. Check Render logs for error details
2. Verify all environment variables are set
3. Test database connection
4. Check Supabase credentials
5. Verify Cohere API key is valid
```

**Problem**: CORS errors in browser
```
Solution:
1. Verify FRONTEND_URL in backend env vars
2. Check it matches your Vercel URL exactly
3. Include protocol (https://)
4. Redeploy backend after changing
```

#### Frontend Issues

**Problem**: Build fails on Vercel
```
Solution:
1. Check package.json is correct
2. Verify all dependencies are installed
3. Check Vercel build logs
4. Ensure TypeScript has no errors
```

**Problem**: API requests fail
```
Solution:
1. Verify NEXT_PUBLIC_API_URL is correct
2. Check backend is running (visit /health)
3. Check browser console for errors
4. Verify CORS is configured correctly
```

**Problem**: Authentication doesn't work
```
Solution:
1. Verify Supabase credentials in frontend
2. Check NEXT_PUBLIC_SUPABASE_URL
3. Check NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Clear browser localStorage
5. Try incognito mode
```

#### Database Issues

**Problem**: Tables not found
```
Solution:
1. Verify schema was run successfully
2. Check Supabase SQL Editor for errors
3. Re-run production_schema.sql
4. Check table names match code
```

**Problem**: RLS policy errors
```
Solution:
1. Verify user is authenticated
2. Check user is workspace member
3. Review RLS policies in Supabase
4. Check workspace_id in requests
```

### Getting Help

1. **Check Logs**:
   - Render: Service → Logs tab
   - Vercel: Deployment → Logs
   - Supabase: Dashboard → Logs

2. **Test Endpoints**:
   - Backend health: `/health`
   - API docs: `/docs`
   - Frontend: Visit in browser

3. **Verify Environment Variables**:
   - Render: Settings → Environment
   - Vercel: Settings → Environment Variables
   - Check for typos and missing values

---

## 🎉 Deployment Complete!

Your DocuQuery application is now live in production!

### Your URLs

- **Frontend**: https://your-app.vercel.app
- **Backend API**: https://your-api.onrender.com
- **API Docs**: https://your-api.onrender.com/docs
- **Database**: Supabase Dashboard

### Next Steps

1. ✅ Test all features thoroughly
2. ✅ Set up custom domains (optional)
3. ✅ Configure monitoring and alerts
4. ✅ Enable automatic backups
5. ✅ Share with users!

### Performance Tips

**Free Tier Limitations**:
- Render free tier sleeps after 15 min inactivity
- First request after sleep takes 30-60 seconds
- Consider upgrading to Starter ($7/month) for production

**Optimization**:
- Enable Vercel Analytics
- Monitor Render metrics
- Optimize database queries
- Add caching layer (future)

### Security Checklist

- ✅ Environment variables are set correctly
- ✅ Service role key is kept secret
- ✅ CORS is configured properly
- ✅ HTTPS is enabled (automatic)
- ✅ Database RLS policies are active
- ✅ File upload limits are enforced

---

## 📞 Support

If you encounter issues:

1. Check this deployment guide
2. Review application logs
3. Test individual components
4. Verify environment variables
5. Check service status pages:
   - Render: https://status.render.com
   - Vercel: https://vercel-status.com
   - Supabase: https://status.supabase.com

---

**Congratulations! Your DocuQuery application is now deployed and ready for production use! 🚀**
