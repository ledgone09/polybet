# Deployment Guide

## Deploying to Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Git repository pushed to GitHub

### Steps

#### 1. Push to GitHub
```bash
cd coin-vote-app
git init
git add .
git commit -m "Initial commit - Solana voting app"
git branch -M main
git remote add origin https://github.com/ledgone09/polybet.git
git push -u origin main
```

#### 2. Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (run from coin-vote-app directory)
vercel

# For production deployment
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/new
2. Import your GitHub repository: `ledgone09/polybet`
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `coin-vote-app`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variables (see below)
5. Click "Deploy"

#### 3. Configure Environment Variables in Vercel

In your Vercel project settings, add these environment variables with your Firebase credentials from the Firebase Console:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**How to add them:**
1. Go to your project in Vercel Dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in the sidebar
4. Add each variable above (Name and Value)
5. Select "Production", "Preview", and "Development" for each
6. Click "Save"

#### 4. Redeploy
After adding environment variables, trigger a new deployment:
- Push a new commit to GitHub, or
- Go to Deployments tab in Vercel and click "Redeploy"

### Automatic Deployments

Once connected to GitHub, Vercel will automatically:
- Deploy every push to `main` branch to production
- Deploy pull requests as preview deployments

### Local Development

To run locally:
```bash
npm install
npm run dev
```

### Build Locally (Test Production Build)
```bash
npm run build
npm run preview
```

### Troubleshooting

**Build fails:**
- Check that all environment variables are set in Vercel
- Verify the root directory is set to `coin-vote-app`
- Check build logs in Vercel dashboard

**App loads but doesn't work:**
- Verify Firebase environment variables are correct
- Check Firebase security rules allow web access
- Check browser console for errors

**Solana wallet issues:**
- Ensure you're using HTTPS (Vercel provides this automatically)
- Phantom wallet requires secure connection

### Custom Domain (Optional)

To add a custom domain:
1. Go to your project in Vercel
2. Click "Settings" > "Domains"
3. Add your domain and follow DNS configuration instructions

## Security Notes

⚠️ **Important**: 
- Never commit `.env` file to Git (it's in `.gitignore`)
- Keep Firebase API keys secure
- Configure Firebase security rules properly
- The `.env.example` file shows what variables are needed without exposing actual values

