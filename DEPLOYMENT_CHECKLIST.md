# DocuQuery Deployment Checklist

Quick reference checklist for deploying DocuQuery to production.

---

## 📋 Pre-Deployment Checklist

### Accounts & Services
- [ ] GitHub account with DocuQuery repository
- [ ] Supabase account created
- [ ] Cohere API key obtained
- [ ] Render account created
- [ ] Vercel account created
- [ ] Domain name purchased (optional)

### Credentials Collected
- [ ] Supabase Project URL
- [ ] Supabase Anon Key
- [ ] Supabase Service Role Key
- [ ] Supabase Database URL
- [ ] Cohere API Key

---

## 🗄️ Database Setup (Supabase)

- [ ] Create Supabase project
- [ ] Wait for provisioning (2-3 minutes)
- [ ] Run `database/production_schema.sql` in SQL Editor
- [ ] Verify all 10 tables created
- [ ] Create "documents" storage bucket
- [ ] Set bucket to private
- [ ] Configure 20MB file size limit
- [ ] Set allowed MIME types
- [ ] Copy Project URL
- [ ] Copy anon/public key
- [ ] Copy service_role key
- [ ] Copy database connection string

---

## 🚀 Backend Deployment (Render)

### Initial Setup
- [ ] Sign up/login to Render
- [ ] Connect GitHub account
- [ ] Grant access to DocuQuery repository

### Service Configuration
- [ ] Create new Web Service
- [ ] Connect DocuQuery repository
- [ ] Set name: `docuquery-api`
- [ ] Set region (closest to users)
- [ ] Set branch: `main`
- [ ] Set root directory: `backend`
- [ ] Set runtime: `Python 3`
- [ ] Set build command: `pip install -r requirements.txt`
- [ ] Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Choose instance type (Free or Starter)

### Environment Variables
- [ ] Add `APP_NAME=DocuQuery`
- [ ] Add `APP_ENV=production`
- [ ] Add `APP_PORT=8000`
- [ ] Add `FRONTEND_URL` (update after Vercel deployment)
- [ ] Add `SUPABASE_URL`
- [ ] Add `SUPABASE_ANON_KEY`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add `SUPABASE_DB_URL`
- [ ] Add `SUPABASE_STORAGE_BUCKET=documents`
- [ ] Add `COHERE_API_KEY`
- [ ] Add `LLM_MODEL=command-a-03-2025`
- [ ] Add `EMBEDDING_MODEL=embed-english-v3.0`
- [ ] Add `EMBEDDING_DIMENSION=1024`
- [ ] Add `CHUNK_SIZE=1000`
- [ ] Add `CHUNK_OVERLAP=200`
- [ ] Add `TOP_K_RESULTS=5`
- [ ] Add `MAX_TOKENS=2000`
- [ ] Add `MAX_FILE_SIZE_MB=20`
- [ ] Add `ALLOWED_FILE_TYPES=pdf,docx,txt,md`
- [ ] Add `LOG_LEVEL=INFO`

### Deployment
- [ ] Click "Create Web Service"
- [ ] Wait for build (3-5 minutes)
- [ ] Verify deployment successful
- [ ] Copy Render URL
- [ ] Test `/health` endpoint
- [ ] Test `/docs` endpoint
- [ ] Test root `/` endpoint

---

## 🌐 Frontend Deployment (Vercel)

### Initial Setup
- [ ] Sign up/login to Vercel
- [ ] Connect GitHub account
- [ ] Grant access to DocuQuery repository

### Project Configuration
- [ ] Import DocuQuery repository
- [ ] Set framework: Next.js (auto-detected)
- [ ] Set root directory: `frontend`
- [ ] Keep build command: `npm run build`
- [ ] Keep output directory: `.next`
- [ ] Keep install command: `npm install`

### Environment Variables
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `NEXT_PUBLIC_API_URL` (your Render URL)

### Deployment
- [ ] Click "Deploy"
- [ ] Wait for build (2-4 minutes)
- [ ] Verify deployment successful
- [ ] Copy Vercel URL
- [ ] Test landing page
- [ ] Test login page
- [ ] Test register page

### Update Backend CORS
- [ ] Go back to Render
- [ ] Update `FRONTEND_URL` with Vercel URL
- [ ] Save changes
- [ ] Wait for automatic redeploy

---

## ✅ Post-Deployment Testing

### User Registration
- [ ] Visit frontend URL
- [ ] Click "Register"
- [ ] Enter email and password
- [ ] Verify redirect to dashboard
- [ ] Verify default workspace created

### Document Upload
- [ ] Go to Documents page
- [ ] Click "Upload Document"
- [ ] Select PDF/DOCX file
- [ ] Enter description
- [ ] Click "Upload"
- [ ] Verify document appears in list
- [ ] Check Render logs for processing
- [ ] Wait for processing to complete

### Chat Functionality
- [ ] Go to Chat page
- [ ] Click "New Chat"
- [ ] Type question about document
- [ ] Wait for response (5-15 seconds)
- [ ] Verify answer appears
- [ ] Verify sources are cited
- [ ] Test follow-up question

### Workspace Features
- [ ] Create new workspace
- [ ] Switch between workspaces
- [ ] Invite team member (if available)
- [ ] Test workspace isolation

### Analytics
- [ ] Go to Analytics page
- [ ] Verify document count
- [ ] Verify query count
- [ ] Verify member count
- [ ] Check trends chart

---

## 🔧 Optional Configuration

### Custom Domains

#### Backend (Render)
- [ ] Go to Render service settings
- [ ] Add custom domain: `api.yourdomain.com`
- [ ] Add CNAME record at DNS provider
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate generated

#### Frontend (Vercel)
- [ ] Go to Vercel project settings
- [ ] Add custom domain: `yourdomain.com`
- [ ] Add DNS records (A and CNAME)
- [ ] Wait for DNS propagation
- [ ] Verify SSL certificate generated

### Monitoring Setup
- [ ] Enable Render monitoring
- [ ] Set up Render alerts
- [ ] Enable Vercel Analytics
- [ ] Configure Supabase monitoring
- [ ] Set up error tracking (optional)

### Backup Configuration
- [ ] Enable Supabase automatic backups
- [ ] Configure backup retention
- [ ] Verify GitHub repository is backed up
- [ ] Document recovery procedures

---

## 🔒 Security Verification

- [ ] All environment variables set correctly
- [ ] Service role key kept secret (not in frontend)
- [ ] CORS configured properly
- [ ] HTTPS enabled (automatic)
- [ ] Database RLS policies active
- [ ] File upload limits enforced
- [ ] No sensitive data in repository
- [ ] `.gitignore` properly configured

---

## 📊 Performance Checks

- [ ] Backend health endpoint responds
- [ ] Frontend loads in <3 seconds
- [ ] API responses in <200ms (avg)
- [ ] Chat queries complete in <20 seconds
- [ ] Document upload works smoothly
- [ ] No console errors in browser
- [ ] No 500 errors in backend logs

---

## 📝 Documentation Updates

- [ ] Update README with production URLs
- [ ] Document any custom configurations
- [ ] Update API documentation if needed
- [ ] Create user guide (optional)
- [ ] Document deployment process

---

## 🎉 Launch Checklist

- [ ] All features tested and working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Team members notified
- [ ] Documentation complete
- [ ] Ready for users!

---

## 📞 Emergency Contacts

**Service Status Pages**:
- Render: https://status.render.com
- Vercel: https://vercel-status.com
- Supabase: https://status.supabase.com
- Cohere: https://status.cohere.com

**Support**:
- Render: https://render.com/docs
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support

---

## 🔄 Rollback Plan

If deployment fails:

1. **Backend Issues**:
   - [ ] Check Render logs
   - [ ] Verify environment variables
   - [ ] Rollback to previous deployment
   - [ ] Test locally first

2. **Frontend Issues**:
   - [ ] Check Vercel logs
   - [ ] Verify environment variables
   - [ ] Rollback to previous deployment
   - [ ] Test build locally

3. **Database Issues**:
   - [ ] Check Supabase logs
   - [ ] Verify schema is correct
   - [ ] Restore from backup if needed
   - [ ] Re-run migrations

---

**Deployment Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete

**Last Updated**: [Date]
**Deployed By**: [Your Name]
**Production URLs**:
- Frontend: ___________________________
- Backend: ___________________________
- Database: ___________________________
