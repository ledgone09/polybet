import React, { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';

// Default styles for wallet modal (only needed for Phantom)
import '@solana/wallet-adapter-react-ui/styles.css';

// RPC endpoint provided by user
const RPC_ENDPOINT = 'https://magical-boldest-patina.solana-mainnet.quiknode.pro/a94255dcbb27e52b1d4cca35d10e899b82b6bdba/';

export function AppWalletProvider({ children }) {
    const endpoint = useMemo(() => RPC_ENDPOINT, []);

    // Only include Phantom wallet adapter - no other wallets
    const wallets = useMemo(() => [
        new PhantomWalletAdapter(),
    ], []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider 
                wallets={wallets} 
                autoConnect={false} // Disable auto-connect to prevent issues
                onError={(error) => {
                    console.error('Wallet provider error:', error);
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
}