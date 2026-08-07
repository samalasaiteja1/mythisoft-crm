# Railway Deployment Guide for MYTHISOFT CRM

## Prerequisites
- GitHub account with your code pushed
- Railway account (free tier available)
- MongoDB Atlas account (for database)

## Step 1: Push Code to GitHub
```bash
git push origin main
```

## Step 2: Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username/password
4. Get your connection string (MongoDB URI)
5. Whitelist Railway IP addresses (0.0.0.0/0 for development)

## Step 3: Deploy Backend on Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `mythisoft-crm` repository
4. Railway will detect the `railway.json` configuration

### Configure Backend Service
1. Click on the "server" service
2. Go to "Variables" tab
3. Add these environment variables:
```
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mythisoft-crm?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number
```

## Step 4: Deploy Frontend on Railway
1. In the same Railway project, click "New Service"
2. Select "GitHub Repo" again
3. Select the same repository
4. Root directory: `client`
5. Build command: `npm install && npm run build`
6. Start command: `npm run preview`

### Configure Frontend Service
1. Click on the "client" service
2. Go to "Variables" tab
3. Add these environment variables:
```
NODE_ENV=production
VITE_API_URL=https://your-backend-service.railway.app
```

## Step 5: Update Client API Configuration
In `client/src/services/api.js`, update the base URL to use the environment variable:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

## Step 6: Generate Railway Domain
1. Railway will automatically generate domains for both services
2. Backend: `https://your-backend-service.railway.app`
3. Frontend: `https://your-frontend-service.railway.app`

## Step 7: Test Deployment
1. Access your frontend Railway URL
2. Test login functionality
3. Verify API calls are working
4. Check Railway logs for any errors

## Alternative: Single Service Deployment
If you prefer a single service, modify the `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Then configure Railway to:
1. Build: `npm install && npm run build`
2. Start: `npm run start` (this will start both server and client using concurrently)

## Important Notes
- Railway free tier has limits (500 hours/month, 512MB RAM)
- For production, consider upgrading to paid plans
- Always use environment variables for sensitive data
- Enable Railway's automatic deployments for continuous integration
- Monitor Railway logs for debugging deployment issues

## Troubleshooting
- **Build fails**: Check Railway logs, ensure all dependencies are in package.json
- **Database connection fails**: Verify MongoDB URI and IP whitelist
- **CORS errors**: Ensure backend CORS settings allow Railway frontend domain
- **Environment variables not loading**: Check variable names match exactly
