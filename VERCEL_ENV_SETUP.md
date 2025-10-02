# 🚨 URGENT: Set Up Environment Variables in Vercel

Your app is showing a black screen because **Firebase environment variables are not configured in Vercel**.

## Quick Fix (5 minutes)

### Step 1: Go to Vercel Dashboard
1. Open https://vercel.com/dashboard
2. Click on your **polybet** project
3. Click **Settings** tab
4. Click **Environment Variables** in the left sidebar

### Step 2: Add Each Variable

**CRITICAL:** You must add ALL 8 variables below:

| Variable Name | Value |
|---------------|-------|
| `VITE_FIREBASE_API_KEY` | `AIzaSyBnm2R1y9ZDQJueWtuM8LfZz7k8cL4buak` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `newone-f8c3d.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | `https://newone-f8c3d-default-rtdb.firebaseio.com` |
| `VITE_FIREBASE_PROJECT_ID` | `newone-f8c3d` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `newone-f8c3d.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `620228823453` |
| `VITE_FIREBASE_APP_ID` | `1:620228823453:web:ae1b25857bcbb5ae160774` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-MBKHCTXR9F` |

### Step 3: For Each Variable:
1. Click **Add New** button
2. Enter the **Name** (e.g., `VITE_FIREBASE_API_KEY`)
3. Enter the **Value** from the table above
4. ✅ Check **Production**
5. ✅ Check **Preview**
6. ✅ Check **Development**
7. Click **Save**

**Repeat for all 8 variables!**

### Step 4: Redeploy
After adding all variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for deployment to complete

## Visual Guide

```
Vercel Dashboard
├── Your Project (polybet)
    ├── Settings
        └── Environment Variables
            ├── Add Variable: VITE_FIREBASE_API_KEY = AIzaSyBnm2R1y9ZDQJueWtuM8LfZz7k8cL4buak
            ├── Add Variable: VITE_FIREBASE_AUTH_DOMAIN = newone-f8c3d.firebaseapp.com
            ├── Add Variable: VITE_FIREBASE_DATABASE_URL = https://newone-f8c3d-default-rtdb.firebaseio.com
            ├── Add Variable: VITE_FIREBASE_PROJECT_ID = newone-f8c3d
            ├── Add Variable: VITE_FIREBASE_STORAGE_BUCKET = newone-f8c3d.firebasestorage.app
            ├── Add Variable: VITE_FIREBASE_MESSAGING_SENDER_ID = 620228823453
            ├── Add Variable: VITE_FIREBASE_APP_ID = 1:620228823453:web:ae1b25857bcbb5ae160774
            └── Add Variable: VITE_FIREBASE_MEASUREMENT_ID = G-MBKHCTXR9F
```

## Common Mistakes to Avoid

❌ **Don't forget the `VITE_` prefix** - All variable names MUST start with `VITE_`
❌ **Don't skip any variables** - All 8 are required
❌ **Don't forget to check Production/Preview/Development** boxes
❌ **Don't forget to redeploy** after adding variables

## Why This Happened

Vite requires environment variables to:
1. Be prefixed with `VITE_` to be accessible in the app
2. Be explicitly set in Vercel (they don't auto-copy from your local `.env`)

## Verify It Works

After redeploying:
1. Visit your Vercel URL
2. Open browser DevTools (F12)
3. Check Console - should NOT see Firebase errors
4. App should load with wallet connection option

## Still Not Working?

1. **Double-check spelling** - Variable names are case-sensitive
2. **Check for trailing spaces** in values
3. **Verify all 8 variables** are added
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R)
5. **Wait a few minutes** - Vercel deployments can take 2-3 minutes

## Screenshot Checklist

When adding a variable, you should see:
- ✅ Name field filled (with `VITE_` prefix)
- ✅ Value field filled
- ✅ Production checked
- ✅ Preview checked  
- ✅ Development checked
- ✅ Save button clicked

After adding all 8, you should see them listed in the Environment Variables section.

