# Polybet - Solana Coin Voting App

A decentralized voting application built with React, Solana blockchain, and Firebase. Users can connect their Phantom wallet and vote on different cryptocurrencies.

## 🚀 Features

- 🦊 Phantom Wallet Integration
- ⛓️ Solana Blockchain Support
- 🔥 Firebase Realtime Database
- 📊 Real-time Vote Tracking
- 🎨 Modern, Responsive UI

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Blockchain**: Solana Web3.js
- **Wallet**: Phantom Wallet Adapter
- **Database**: Firebase Realtime Database
- **Deployment**: Vercel

## 📦 Prerequisites

- Node.js 16+ and npm
- A Phantom wallet browser extension
- Firebase account with Realtime Database configured
- Vercel account (for deployment)

## 🔧 Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ledgone09/polybet.git
   cd polybet/coin-vote-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `coin-vote-app` directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Deployment to Vercel

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ledgone09/polybet)

### Manual Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from the coin-vote-app directory**
   ```bash
   cd coin-vote-app
   vercel
   ```

4. **Set up environment variables in Vercel Dashboard**
   - Go to your project settings
   - Add all `VITE_*` environment variables
   - Redeploy

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📁 Project Structure

```
coin-vote-app/
├── src/
│   ├── App.jsx              # Main application component
│   ├── VoteDashboard.jsx    # Voting interface
│   ├── WalletProvider.jsx   # Solana wallet integration
│   ├── firebase.js          # Firebase configuration
│   ├── voteService.js       # Vote management logic
│   └── solanaService.js     # Solana blockchain interaction
├── public/
├── .env                     # Environment variables (not in git)
├── .env.example            # Example env file
├── vercel.json             # Vercel configuration
└── package.json
```

## 🔐 Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the Vite app:

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Firebase Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

## 🔥 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Realtime Database
3. Configure database security rules
4. Copy your config values to `.env`

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

## 🏗️ Build for Production

```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🐛 Troubleshooting

**Wallet won't connect:**
- Ensure Phantom wallet is installed
- Check that you're on a supported network
- Verify the site is using HTTPS (required for wallet connections)

**Firebase errors:**
- Verify all environment variables are set correctly
- Check Firebase security rules
- Ensure Realtime Database is enabled

**Build errors:**
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions

## 🙏 Acknowledgments

- Solana Foundation
- Phantom Wallet team
- React and Vite communities
