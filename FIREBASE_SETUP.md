# Firebase Setup Guide

Follow these steps to connect your Firebase project to the voting app:

## Step 1: Install Firebase SDK

Run this command in the `coin-vote-app` folder:

```bash
npm install firebase --legacy-peer-deps
```

## Step 2: Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one if you haven't)
3. Click on the **gear icon** (⚙️) next to "Project Overview"
4. Click on **"Project settings"**
5. Scroll down to **"Your apps"** section
6. If you haven't added a web app yet:
   - Click the **Web icon** (`</>`)
   - Register your app with a nickname (e.g., "CoinVote App")
   - You DON'T need Firebase Hosting for now
7. Copy the `firebaseConfig` object

## Step 3: Enable Realtime Database

1. In Firebase Console, click on **"Realtime Database"** in the left menu
2. Click **"Create Database"**
3. Choose a location (e.g., United States)
4. Start in **"Test mode"** for now (we'll secure it later)
5. Click **"Enable"**

## Step 4: Configure Database Rules (Important for Security)

1. In Realtime Database, go to the **"Rules"** tab
2. Replace the rules with these (they allow anyone to read votes but only write their own):

```json
{
  "rules": {
    "votes": {
      ".read": true,
      "$questionId": {
        "$walletAddress": {
          ".write": "$walletAddress === auth.uid || $walletAddress.length > 0"
        }
      }
    }
  }
}
```

3. Click **"Publish"**

## Step 5: Update Firebase Configuration in Your Code

1. Open `coin-vote-app/src/firebase.js`
2. Replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBnm2R1y9ZDQJueWtuM8LfZz7k8cL4buak",              // Replace with your actual apiKey
  authDomain: "newone-f8c3d.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "newone-f8c3d",
  storageBucket: "newone-f8c3d.firebasestorage.app",
  messagingSenderId: "620228823453",
  appId: "1:620228823453:web:a2943cccda58ca72160774"
};
```

**Example** (these are fake values, use YOUR actual values):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyB1x2y3z4a5b6c7d8e9f0g1h2i3j4k5l6m",
  authDomain: "coinvote-app-12345.firebaseapp.com",
  databaseURL: "https://coinvote-app-12345-default-rtdb.firebaseio.com",
  projectId: "coinvote-app-12345",
  storageBucket: "coinvote-app-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Step 6: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Open the app in your browser
3. Try voting (you'll need to connect a Phantom wallet with tokens)
4. Check Firebase Console > Realtime Database to see votes appearing in real-time!

## Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Double-check your `apiKey` in the config

### Error: "PERMISSION_DENIED"
- Make sure you published the database rules in Step 4
- Check that your `databaseURL` is correct

### Votes not syncing
- Open browser console (F12) and check for Firebase errors
- Verify your internet connection
- Make sure the database rules allow reads and writes

## Security Tips

Once you're ready for production:
1. Restrict database rules to only allow authenticated users
2. Add rate limiting to prevent spam
3. Implement proper wallet verification
4. Never commit your `firebase.js` file with real credentials to public repos (add it to `.gitignore`)

## Need Help?

If you encounter issues, check:
- Firebase Console > Realtime Database > Data (to see if votes are being saved)
- Browser Console (F12) for error messages
- Firebase Console > Realtime Database > Rules (make sure they're published)

