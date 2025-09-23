# CraftConnect Deployment Guide

## Issue Fixed: Story Generation Not Working

The story generation feature was failing because the **GEMINI_API_KEY** environment variable was not configured in Google Cloud App Engine.

## Quick Fix Steps

### 1. Set Environment Variables in Google Cloud

You need to update your `backend/app.yaml` file with the correct environment variables:

```yaml
env_variables:
  NODE_ENV: production
  MONGO_URI: "your-mongodb-connection-string-here"
  JWT_SECRET: "your-jwt-secret-here"
  GEMINI_API_KEY: "your-gemini-api-key-here"
  FRONTEND_ORIGIN: "https://craftconnect-hackathon-2025.uc.r.appspot.com"
```

### 2. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 3. Deploy Backend

```bash
cd backend
gcloud app deploy app.yaml
```

### 4. Deploy Frontend

```bash
# Build the frontend
npm run build

# Deploy frontend
gcloud app deploy frontend-app.yaml
```

## Environment Variables You Need

1. **GEMINI_API_KEY**: Get from Google AI Studio
2. **MONGO_URI**: Your MongoDB connection string
3. **JWT_SECRET**: A secure random string for JWT tokens
4. **FRONTEND_ORIGIN**: Your frontend URL

## Testing

After deployment, test the story generation by:
1. Going to your deployed frontend
2. Logging in as an artisan
3. Going to Dashboard
4. Entering a product name
5. Clicking "Generate Story"

## Health Check

Your backend now has a health check endpoint at `/api/health` that shows if Gemini is configured properly.

## Troubleshooting

If story generation still doesn't work:
1. Check the health endpoint: `https://backend-dot-craftconnect-hackathon-2025.uc.r.appspot.com/api/health`
2. Verify `geminiConfigured` is `true`
3. Check Google Cloud logs for any errors
