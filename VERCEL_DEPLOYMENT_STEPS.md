# Vercel Frontend Deployment - Quick Start Guide

## ✅ Backend Status
- Backend is LIVE at: https://docuquery-api.onrender.com
- Health check: https://docuquery-api.onrender.com/health
- API docs: https://docuquery-api.onrender.com/docs

---

## 🚀 Deploy Frontend to Vercel

### Step 1: Go to Vercel
1. Visit: https://vercel.com
2. Sign in with GitHub (if not already signed in)

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find **"satvik-sharma-05/DocuQuery"** in the list
3. Click **"Import"**

### Step 3: Configure Project Settings

**Root Directory**:
- Click **"Edit"** next to Root Directory
- Enter: `frontend`
- Click **"Continue"**

**Framework**: Next.js (should be auto-detected)

**Build Settings** (leave as default):
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

### Step 4: Add Environment Variables

Click **"Environment Variables"** and add these THREE variables:

```
NEXT_PUBLIC_API_URL=https://docuquery-api.onrender.com
```

```
NEXT_PUBLIC_SUPABASE_URL=https://jkmbsojaevgtuenzkimp.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbWJzb2phZXZndHVlbnpraW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMzU5NDIsImV4cCI6MjA4ODcxMTk0Mn0.3JjxukDb9Dw5IYUph7o9ccrrfS13Tns2d9l84VI5CYg
```

**How to add each variable**:
1. Paste the variable name (e.g., `NEXT_PUBLIC_API_URL`)
2. Paste the value
3. Click **"Add"**
4. Repeat for all three variables

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 2-4 minutes for build to complete
3. You'll see: **"Congratulations! Your project has been deployed"**

### Step 6: Get Your Frontend URL
1. Copy the URL shown (e.g., `https://docu-query-xxxxx.vercel.app`)
2. Click **"Visit"** to test your app

---

## 🔄 Update Backend CORS

After getting your Vercel URL, update the backend:

### Step 1: Go to Render
1. Visit: https://dashboard.render.com
2. Click on **"docuquery-api"** service

### Step 2: Update Environment Variable
1. Click **"Environment"** tab
2. Find `FRONTEND_URL` variable
3. Click **"Edit"**
4. Update value to your Vercel URL: `https://docu-query-xxxxx.vercel.app`
5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes 1-2 minutes)

---

## ✅ Test Your Deployment

### 1. Visit Your Frontend
Go to: `https://your-vercel-url.vercel.app`

### 2. Test Registration
1. Click **"Register"**
2. Enter email and password
3. Should redirect to dashboard
4. Default workspace created automatically

### 3. Test Document Upload
1. Go to **"Documents"** page
2. Click **"Upload Document"**
3. Select a PDF or DOCX file
4. Enter description
5. Click **"Upload"**
6. Document should appear in list

### 4. Test Chat
1. Go to **"Chat"** page
2. Click **"New Chat"**
3. Type a question about your document
4. Wait 5-15 seconds for AI response
5. Should see answer with sources

---

## 🎉 Deployment Complete!

Your DocuQuery application is now fully deployed:

- **Frontend**: https://your-vercel-url.vercel.app
- **Backend**: https://docuquery-api.onrender.com
- **Database**: Supabase (hosted)

---

## 🔧 Troubleshooting

### Frontend Build Fails
- Check Vercel build logs
- Verify all environment variables are set
- Ensure root directory is set to `frontend`

### API Requests Fail
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend is running: https://docuquery-api.onrender.com/health
- Check browser console for CORS errors

### Authentication Doesn't Work
- Verify Supabase credentials are correct
- Clear browser localStorage
- Try incognito mode

### CORS Errors
- Ensure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Include `https://` protocol
- Wait for backend to redeploy after changing

---

## 📝 Important Notes

1. **Free Tier Limitations**:
   - Render free tier sleeps after 15 min inactivity
   - First request after sleep takes 30-60 seconds
   - Consider upgrading to Starter ($7/month) for production

2. **Environment Variables**:
   - Never commit `.env.local` to git
   - Always use `NEXT_PUBLIC_` prefix for client-side variables
   - Keep service role keys secret (not in frontend!)

3. **Monitoring**:
   - Vercel Dashboard: https://vercel.com/dashboard
   - Render Dashboard: https://dashboard.render.com
   - Supabase Dashboard: https://supabase.com/dashboard

---

## 🎯 Next Steps

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Enable Vercel Analytics
4. ✅ Configure monitoring alerts
5. ✅ Share with users!

---

**Need help?** Check the full deployment guide: `DEPLOYMENT_GUIDE.md`
