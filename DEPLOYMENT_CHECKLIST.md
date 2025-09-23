# 🚀 CraftConnect Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup
- [ ] Get Gemini API Key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Have MongoDB connection string ready
- [ ] Generate a secure JWT secret (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] Update `backend/app.yaml` with your actual values

### 2. Google Cloud Setup
- [ ] Google Cloud project created
- [ ] App Engine enabled
- [ ] `gcloud` CLI installed and authenticated
- [ ] Billing enabled (required for App Engine)

### 3. Code Verification
- [ ] All files committed to git
- [ ] Backend tests pass locally
- [ ] Frontend builds successfully (`npm run build`)

## 🔧 Deployment Steps

### Step 1: Deploy Backend
```bash
cd backend
gcloud app deploy app.yaml --quiet
```

### Step 2: Test Backend Health
Visit: `https://backend-dot-YOUR-PROJECT-ID.uc.r.appspot.com/api/health`
- [ ] Status shows "healthy"
- [ ] `geminiConfigured` is `true`

### Step 3: Deploy Frontend
```bash
cd ..
npm run build
gcloud app deploy frontend-app.yaml --quiet
```

### Step 4: Final Testing
- [ ] Frontend loads properly
- [ ] User registration works
- [ ] User login works
- [ ] Story generation works (main fix!)
- [ ] Product creation works
- [ ] Image upload works

## 🐛 Troubleshooting

### Story Generation Not Working?
1. Check health endpoint: `/api/health`
2. Verify `geminiConfigured: true`
3. Check Google Cloud logs: `gcloud app logs tail -s default`
4. Ensure GEMINI_API_KEY is set in app.yaml

### CORS Issues?
- Verify FRONTEND_ORIGIN in backend app.yaml matches your frontend URL

### Database Connection Issues?
- Check MONGO_URI format
- Ensure MongoDB Atlas allows connections from Google Cloud IPs (0.0.0.0/0)

## 📋 Post-Deployment

- [ ] Test all major features
- [ ] Monitor logs for errors
- [ ] Share demo links
- [ ] Document any issues

## 🎯 Demo URLs
- Frontend: `https://YOUR-PROJECT-ID.uc.r.appspot.com`
- Backend: `https://backend-dot-YOUR-PROJECT-ID.uc.r.appspot.com`
- Health Check: `https://backend-dot-YOUR-PROJECT-ID.uc.r.appspot.com/api/health`

## 🚨 Emergency Rollback
If deployment fails:
```bash
gcloud app versions list
gcloud app versions migrate PREVIOUS_VERSION
```

---
**Time Estimate**: 15-30 minutes total deployment time
**Status**: ✅ Story Generation Issue FIXED
