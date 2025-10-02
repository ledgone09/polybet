import React, { useState, useEffect, useCallback } from 'react';
import './VoteDashboard.css';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
  getStoredVotes,
  storeVote,
  getUserVote,
  getQuestionVoteCount,
  subscribeToVotes,
  CURRENT_QUESTION_ID,
  NEXT_TOPIC_QUESTION_ID
} from './voteService';

// Pool wallet address
const POOL_WALLET_ADDRESS = '4dcfMsgfoXphUqspLCdv7PZQZd6nbtut5xQdqpnuAWNe';
// Token contract address
const TOKEN_CONTRACT_ADDRESS = '8HiyARcUe6MQro3iRwbUn8e8B4PMgXjaTL9D3bb3w59f';
// Minimum tokens required to vote (20 million)
const MIN_TOKENS_TO_VOTE = 20000000;

// Helper function to calculate time remaining from a target timestamp
// Real-time countdown synchronized across all users
const calculateTimeRemaining = (targetTime) => {
  const now = new Date().getTime();
  const target = new Date(targetTime).getTime();
  const diff = Math.max(0, target - now);
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
};

function VoteDashboard({ setShowDashboard }) {
  // Pool data state
  const [poolData, setPoolData] = useState({
    currentPool: 0,
    participants: 0, // Will be calculated from actual votes
    yourTokens: 0
  });

  // UI state
  const [loading, setLoading] = useState(false);

  // Voting eligibility state
  const [votingEligible, setVotingEligible] = useState(false);
  
  // Vote statistics state - initialize with empty structure
  const [voteStats, setVoteStats] = useState({
    below_204: { votes: 0, percentage: 0 },
    price_206: { votes: 0, percentage: 0 },
    price_208: { votes: 0, percentage: 0 },
    price_210: { votes: 0, percentage: 0 },
    above_210: { votes: 0, percentage: 0 },
    total: 0
  });
  const [nextTopicStats, setNextTopicStats] = useState({
    btc_price: { votes: 0, percentage: 0 },
    fomc_dissent: { votes: 0, percentage: 0 },
    congress_shutdown: { votes: 0, percentage: 0 },
    sol_price: { votes: 0, percentage: 0 },
    party_break: { votes: 0, percentage: 0 },
    total: 0
  });

  // Update participants count based on actual votes
  const updateParticipantsCount = async () => {
    const actualParticipants = await getQuestionVoteCount(CURRENT_QUESTION_ID);
    setPoolData(prev => ({
      ...prev,
      participants: actualParticipants
    }));
    return actualParticipants;
  };

  // Voting state - dynamic based on actual votes
  const [currentVote, setCurrentVote] = useState({
    id: CURRENT_QUESTION_ID,
    question: "What will the SOL price be?",
    endTime: "2025-10-02T18:00:00Z",
    options: [
      { id: 'below_204', label: 'Below $204' },
      { id: 'price_206', label: '$206' },
      { id: 'price_208', label: '$208' },
      { id: 'price_210', label: '$210' },
      { id: 'above_210', label: 'Above $210' }
    ],
    userVote: null
  });

  // Calculate vote percentages and counts dynamically
  const calculateVoteStats = async () => {
    const votes = await getStoredVotes();
    const questionVotes = votes[CURRENT_QUESTION_ID] || {};
    const totalVotes = Object.keys(questionVotes).length;
    
    console.log('Calculating current vote stats:', {
      allVotes: votes,
      questionVotes,
      totalVotes,
      questionId: CURRENT_QUESTION_ID
    });
    
    // Count votes for each option
    const optionVotes = {};
    currentVote.options.forEach(option => {
      const voteCount = Object.values(questionVotes).filter(v => v.vote === option.id).length;
      optionVotes[option.id] = {
        votes: voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
      };
    });
    
    return {
      ...optionVotes,
      total: totalVotes
    };
  };

  // Calculate vote stats for next topic selection
  const calculateNextTopicStats = async () => {
    const votes = await getStoredVotes();
    const questionVotes = votes[NEXT_TOPIC_QUESTION_ID] || {};
    const totalVotes = Object.keys(questionVotes).length;
    
    // Count votes for each topic option
    const optionVotes = {};
    nextVote.options.forEach(option => {
      const voteCount = Object.values(questionVotes).filter(v => v.vote === option.id).length;
      optionVotes[option.id] = {
        votes: voteCount,
        percentage: totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
      };
    });
    
    return {
      ...optionVotes,
      total: totalVotes
    };
  };

  const [nextVote, setNextVote] = useState({
    id: NEXT_TOPIC_QUESTION_ID,
    question: "What should be the next prediction question?",
    startTime: "2025-10-03T18:00:00Z",
    options: [
      { id: 'btc_price', label: 'BTC Price Prediction', subLabel: 'What will Bitcoin reach?' },
      { id: 'fomc_dissent', label: 'FOMC Dissenting Vote', subLabel: 'Will minutes include dissent?' },
      { id: 'congress_shutdown', label: 'Congress Funding Bill', subLabel: 'Will they avert shutdown?' },
      { id: 'sol_price', label: 'Solana Price Prediction', subLabel: 'Where will SOL go?' },
      { id: 'party_break', label: 'Senator Party Break', subLabel: 'Public break on fiscal policy?' }
    ],
    userVote: null
  });

  // Initialize timers with calculated values based on actual timestamps
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(currentVote.endTime));
  const [votingTimeRemaining, setVotingTimeRemaining] = useState(() => {
    // Voting ends 24 hours before the prediction ends
    const endTime = new Date(currentVote.endTime);
    const votingEndTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000));
    return calculateTimeRemaining(votingEndTime.toISOString());
  });
  const [timeUntilNext, setTimeUntilNext] = useState(() => calculateTimeRemaining(nextVote.startTime));

  const { connected, connect, disconnect, publicKey, wallets, wallet, select } = useWallet();

  // Auto-select Phantom wallet when wallets are available
  useEffect(() => {
    if (wallets.length > 0 && (!wallet || wallet.adapter.name !== 'Phantom')) {
      const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
      if (phantomWallet) {
        console.log('Auto-selecting Phantom wallet');
        select(phantomWallet.adapter.name);
      }
    }
  }, [wallets, wallet, select]);

  // Update vote statistics
  const updateVoteStatistics = async () => {
    try {
      const currentStats = await calculateVoteStats();
      const nextStats = await calculateNextTopicStats();
      
      console.log('Updated vote statistics:', {
        current: currentStats,
        next: nextStats
      });
      
      setVoteStats(currentStats);
      setNextTopicStats(nextStats);
    } catch (error) {
      console.error('Error updating vote statistics:', error);
    }
  };

  // Update participants count on component mount
  useEffect(() => {
    const updateData = async () => {
      await updateParticipantsCount();
      await updateVoteStatistics();
    };
    updateData();
  }, []);

  // Check voting eligibility and load existing vote
  useEffect(() => {
    const loadVotingData = async () => {
      if (connected && publicKey && poolData.yourTokens > 0) {
        // Check if user meets minimum token requirement
        const isEligible = poolData.yourTokens >= MIN_TOKENS_TO_VOTE;
        setVotingEligible(isEligible);

        // Load existing votes
        const userWallet = publicKey.toString();
        const existingVote = await getUserVote(CURRENT_QUESTION_ID, userWallet);
        const existingNextTopicVote = await getUserVote(NEXT_TOPIC_QUESTION_ID, userWallet);
        
        setCurrentVote(prev => ({
          ...prev,
          userVote: existingVote
        }));
        
        setNextVote(prev => ({
          ...prev,
          userVote: existingNextTopicVote
        }));

        console.log('Voting eligibility check:', {
          tokens: poolData.yourTokens,
          required: MIN_TOKENS_TO_VOTE,
          eligible: isEligible,
          existingVote
        });
      } else {
        setVotingEligible(false);
        setCurrentVote(prev => ({
          ...prev,
          userVote: null
        }));
      }
    };
    
    loadVotingData();
  }, [connected, publicKey, poolData.yourTokens]);

  // Function to connect specifically to Phantom wallet
  const connectPhantom = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if Phantom is installed
      if (!window.solana || !window.solana.isPhantom) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        setLoading(false);
        return;
      }

      console.log('Attempting to connect to Phantom wallet...');
      console.log('Current wallet:', wallet?.adapter?.name);

      // Ensure Phantom wallet is selected (should be auto-selected by useEffect)
      if (!wallet || wallet.adapter.name !== 'Phantom') {
        const phantomWallet = wallets.find(w => w.adapter.name === 'Phantom');
        if (phantomWallet) {
          console.log('Selecting Phantom wallet...');
          select(phantomWallet.adapter.name);
          // Wait for selection to take effect
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          throw new Error('Phantom wallet adapter not found');
        }
      }

      // Connect to the wallet
      console.log('Connecting to wallet...');
      await connect();
      console.log('Successfully connected to Phantom wallet');
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error';
      if (error.message) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Connection was cancelled by user';
        } else if (error.message.includes('No wallet adapter')) {
          errorMessage = 'Phantom wallet not found. Make sure Phantom is installed.';
        } else if (error.message.includes('WalletNotReadyError')) {
          errorMessage = 'Phantom wallet is not ready. Please unlock your wallet and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`Failed to connect to Phantom wallet: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [connect, wallets, wallet, select, setLoading]);

  // Fetch pool balance and user token balance
  const fetchSolanaData = async () => {
    setLoading(true);
    try {
      // Import Solana web3.js and spl-token only when needed
      const { Connection, PublicKey } = await import('@solana/web3.js');
      const { getAssociatedTokenAddress, getAccount } = await import('@solana/spl-token');
      
      // Use the RPC endpoint from WalletProvider
      const connection = new Connection(
        'https://magical-boldest-patina.solana-mainnet.quiknode.pro/a94255dcbb27e52b1d4cca35d10e899b82b6bdba/',
        'confirmed'
      );
      
      // Fetch pool SOL balance
      const poolWalletPubkey = new PublicKey(POOL_WALLET_ADDRESS);
      const poolBalance = await connection.getBalance(poolWalletPubkey);
      const poolBalanceSOL = poolBalance / 1e9; // Convert lamports to SOL
      
      setPoolData(prev => ({
        ...prev,
        currentPool: poolBalanceSOL
      }));
      
      // Fetch user token balance if wallet is connected
      if (connected && publicKey) {
        try {
          const tokenMint = new PublicKey(TOKEN_CONTRACT_ADDRESS);
          console.log('Fetching token balance for:', publicKey.toString());
          console.log('Token contract:', TOKEN_CONTRACT_ADDRESS);
          
          const associatedTokenAddress = await getAssociatedTokenAddress(tokenMint, publicKey);
          console.log('Associated token address:', associatedTokenAddress.toString());
          
          // Check if the associated token account exists
          const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
          console.log('Token account exists:', !!accountInfo);
          
          if (accountInfo) {
            // Get token account info
            const tokenAccount = await getAccount(connection, associatedTokenAddress);
            console.log('Raw token amount:', tokenAccount.amount.toString());
            
            // Get mint info to determine correct decimals
            const { getMint } = await import('@solana/spl-token');
            const mintInfo = await getMint(connection, tokenMint);
            console.log('Token decimals:', mintInfo.decimals);
            
            // Calculate token balance with correct decimals
            const tokenBalance = Number(tokenAccount.amount) / Math.pow(10, mintInfo.decimals);
            console.log('Calculated token balance:', tokenBalance);
            
            setPoolData(prev => ({
              ...prev,
              yourTokens: tokenBalance
            }));
          } else {
            // User doesn't have tokens or token account doesn't exist
            console.log('No token account found for user');
            setPoolData(prev => ({
              ...prev,
              yourTokens: 0
            }));
          }
        } catch (tokenError) {
          console.error('Error fetching token balance:', tokenError);
          console.error('Token error details:', {
            message: tokenError.message,
            code: tokenError.code,
            stack: tokenError.stack
          });
          // Fallback to 0 tokens
          setPoolData(prev => ({
            ...prev,
            yourTokens: 0
          }));
        }
      } else {
        // Wallet not connected, reset token balance
        setPoolData(prev => ({
          ...prev,
          yourTokens: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching Solana data:', error);
      // Set to 0 if unable to fetch
      setPoolData(prev => ({
        ...prev,
        currentPool: 0,
        yourTokens: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when wallet connection changes
  useEffect(() => {
    console.log('📊 Fetching Solana data...');
    fetchSolanaData();
    
    // Subscribe to real-time vote updates from Firebase
    const unsubscribe = subscribeToVotes(async (votes) => {
      console.log('Real-time vote update received in dashboard:', votes);
      await updateParticipantsCount();
      await updateVoteStatistics();
    });
    
    // Refresh pool data periodically
    const interval = setInterval(async () => {
      await fetchSolanaData();
    }, 10000); // Update every 10 seconds
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [connected, publicKey]); // Refetch when wallet connection state changes

  // Real countdown timer that recalculates based on actual time (every second)
  useEffect(() => {
    // Function to update all timers
    const updateTimers = () => {
      // Recalculate time remaining for total prediction time
      setTimeRemaining(calculateTimeRemaining(currentVote.endTime));
      
      // Recalculate voting period time remaining (ends 24 hours before prediction ends)
      const endTime = new Date(currentVote.endTime);
      const votingEndTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000));
      setVotingTimeRemaining(calculateTimeRemaining(votingEndTime.toISOString()));
      
      // Recalculate time until next prediction voting
      setTimeUntilNext(calculateTimeRemaining(nextVote.startTime));
    };

    // Update immediately on mount
    updateTimers();

    // Then update every second for real-time countdown
    const timer = setInterval(updateTimers, 1000);

    return () => clearInterval(timer);
  }, [currentVote.endTime, nextVote.startTime]);

  // Check if voting is still open (48 hours out of 72 hours total)
  const isVotingOpen = votingTimeRemaining.hours > 0 || votingTimeRemaining.minutes > 0 || votingTimeRemaining.seconds > 0;

  // Real voting function
  const handleVote = async (optionId) => {
    // Check if voting period is still open
    if (!isVotingOpen) {
      alert('Voting period has ended. We are now in the 24-hour decision period.');
      return;
    }

    // Check if wallet is connected
    if (!connected || !publicKey) {
      alert('Please connect your wallet to vote');
      return;
    }

    // Check token balance requirement
    if (poolData.yourTokens < MIN_TOKENS_TO_VOTE) {
      alert(`You need at least ${MIN_TOKENS_TO_VOTE.toLocaleString()} tokens to vote. You currently have ${poolData.yourTokens.toLocaleString()} tokens.`);
      return;
    }

    // Check if user already voted
    const userWallet = publicKey.toString();
    const existingVote = await getUserVote(CURRENT_QUESTION_ID, userWallet);
    if (existingVote) {
      alert('You have already voted on this question!');
      return;
    }

    try {
      setLoading(true);
      
      // Store the vote
      const voteStored = await storeVote(CURRENT_QUESTION_ID, userWallet, optionId, poolData.yourTokens);
      
      if (voteStored) {
        // Update local state
        setCurrentVote(prev => ({
          ...prev,
          userVote: optionId
        }));

        // Update participant count with actual voters
        await updateParticipantsCount();
        // Update vote statistics
        await updateVoteStatistics();

        console.log(`Vote cast: ${optionId} by ${userWallet}`);
        alert(`Your vote for "${optionId.toUpperCase()}" has been recorded!`);
      } else {
        alert('Failed to record your vote. Please try again.');
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      alert('An error occurred while casting your vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Voting function for next topic selection
  const handleNextTopicVote = async (optionId) => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      alert('Please connect your wallet to vote');
      return;
    }

    // Check token balance requirement
    if (poolData.yourTokens < MIN_TOKENS_TO_VOTE) {
      alert(`You need at least ${MIN_TOKENS_TO_VOTE.toLocaleString()} tokens to vote. You currently have ${poolData.yourTokens.toLocaleString()} tokens.`);
      return;
    }

    // Check if user already voted
    const userWallet = publicKey.toString();
    const existingVote = await getUserVote(NEXT_TOPIC_QUESTION_ID, userWallet);
    if (existingVote) {
      alert('You have already voted for the next topic!');
      return;
    }

    try {
      setLoading(true);
      
      // Store the vote
      const voteStored = await storeVote(NEXT_TOPIC_QUESTION_ID, userWallet, optionId, poolData.yourTokens);
      
      if (voteStored) {
        // Update local state
        setNextVote(prev => ({
          ...prev,
          userVote: optionId
        }));

        // Update vote statistics
        await updateVoteStatistics();

        console.log(`Next topic vote cast: ${optionId} by ${userWallet}`);
        alert(`Your vote for "${nextVote.options.find(o => o.id === optionId)?.label}" has been recorded!`);
      } else {
        alert('Failed to record your vote. Please try again.');
      }
    } catch (error) {
      console.error('Error casting next topic vote:', error);
      alert('An error occurred while casting your vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeObj) => {
    return `${timeObj.hours}h ${timeObj.minutes}m ${timeObj.seconds}s`;
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Prediction Dashboard</h1>
        <button className="back-button" onClick={() => setShowDashboard && setShowDashboard(false)}>Back to Home</button>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            {loading ? 'Loading...' : `${poolData.currentPool.toFixed(2)} SOL`}
          </div>
          <div className="stat-label">Current Pool</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{poolData.participants.toLocaleString()}</div>
          <div className="stat-label">Voters</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {loading ? 'Loading...' : `${poolData.yourTokens.toLocaleString()} Tokens`}
          </div>
          <div className="stat-label">Your Tokens</div>
        </div>
      </div>
      
      {/* Wallet connection section */}
      <div className="wallet-section">
        <div className="wallet-connection-container">
          <div className="wallet-info">
            <h3>Connect Your Wallet</h3>
            <p>Connect your Phantom wallet to view your token balance and participate in voting</p>
          </div>
          <div className="wallet-buttons">
            {connected ? (
              <div className="wallet-status">
                <div className="connected-info">
                  <span className="connection-icon">✅</span>
                  <span className="connected-address">
                    Connected: {publicKey?.toString().substring(0, 6)}...{publicKey?.toString().substring(publicKey.toString().length - 4)}
                  </span>
                </div>
                <button onClick={disconnect} className="disconnect-button">
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectPhantom} 
                className="phantom-connect-btn"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Connect Phantom Wallet'}
              </button>
            )}
            <button 
              onClick={fetchSolanaData} 
              className="refresh-button"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="votes-container">
        <div className="vote-card current">
          <div className="vote-header">
            <h2 className="vote-title">Current Prediction</h2>
            <span className="vote-timer">{formatTime(timeRemaining)} until resolution</span>
          </div>
          <div className="vote-question">
            {currentVote.question}
          </div>
          
          {/* Voting period status */}
          <div className="voting-period-status" style={{
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '8px',
            backgroundColor: isVotingOpen ? '#1a472a' : '#472a1a',
            border: `1px solid ${isVotingOpen ? '#2d7a4a' : '#7a4a2d'}`,
            textAlign: 'center'
          }}>
            {isVotingOpen ? (
              <span style={{color: '#4ade80', fontSize: '0.9rem', fontWeight: 'bold'}}>
                🗳️ Voting Open: {formatTime(votingTimeRemaining)} remaining
              </span>
            ) : (
              <span style={{color: '#fb923c', fontSize: '0.9rem', fontWeight: 'bold'}}>
                ⏱️ Decision Period: Voting closed, awaiting resolution in {formatTime(timeRemaining)}
              </span>
            )}
          </div>
          
          {/* Voting eligibility status */}
          {connected && isVotingOpen && (
            <div className={`eligibility-status ${votingEligible ? 'eligible' : 'not-eligible'}`}>
              {votingEligible ? (
                <span>✅ Eligible to vote ({poolData.yourTokens.toLocaleString()} tokens)</span>
              ) : (
                <span>❌ Need {MIN_TOKENS_TO_VOTE.toLocaleString()} tokens to vote (you have {poolData.yourTokens.toLocaleString()})</span>
              )}
            </div>
          )}
          
          <div className="vote-options">
            {currentVote.options.map(option => (
              <div 
                className={`vote-option ${currentVote.userVote === option.id ? 'selected' : ''} ${!votingEligible || currentVote.userVote || !isVotingOpen ? 'disabled' : ''}`}
                key={option.id}
                onClick={() => votingEligible && !currentVote.userVote && isVotingOpen ? handleVote(option.id) : null}
              >
                <div className="option-info">
                  <div className="option-label">{option.label}</div>
                  <div className="option-votes">{voteStats[option.id]?.votes || 0} votes</div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${option.id}`}
                      style={{width: `${voteStats[option.id]?.percentage || 0}%`}}
                    ></div>
                  </div>
                </div>
                <div className="option-percent">{voteStats[option.id]?.percentage || 0}%</div>
              </div>
            ))}
          </div>
          
          <div className="vote-actions">
            {!isVotingOpen ? (
              <button className="vote-button disabled">⏱️ Voting Closed - Decision Period Active</button>
            ) : !connected ? (
              <button className="vote-button secondary">Connect Wallet to Vote</button>
            ) : currentVote.userVote ? (
              <button className="vote-button primary">✅ Vote Submitted: {currentVote.userVote.toUpperCase()}</button>
            ) : !votingEligible ? (
              <button className="vote-button disabled">Need More Tokens to Vote</button>
            ) : (
              <button className="vote-button secondary">Select an Option Above</button>
            )}
          </div>
        </div>
        
        <div className="vote-card next">
          <div className="vote-header">
            <h2 className="vote-title">Vote for Next Prediction</h2>
            <span className="vote-timer">{formatTime(timeUntilNext)} to vote</span>
          </div>
          <div className="vote-question">
            {nextVote.question}
          </div>
          
          {/* Show voting eligibility for next topic too */}
          {connected && (
            <div className={`eligibility-status ${votingEligible ? 'eligible' : 'not-eligible'}`} style={{fontSize: '0.8rem', padding: '0.5rem'}}>
              {votingEligible ? (
                nextVote.userVote ? (
                  <span>✅ You voted: {nextVote.options.find(o => o.id === nextVote.userVote)?.label}</span>
                ) : (
                  <span>✅ Eligible to vote for next prediction</span>
                )
              ) : (
                <span>❌ Need {MIN_TOKENS_TO_VOTE.toLocaleString()} tokens to vote</span>
              )}
            </div>
          )}
          
          <div className="next-options">
            {nextVote.options.map(option => (
              <div 
                className={`next-option ${nextVote.userVote === option.id ? 'selected' : ''} ${!votingEligible || nextVote.userVote ? 'disabled' : ''}`}
                key={option.id}
                onClick={() => votingEligible && !nextVote.userVote ? handleNextTopicVote(option.id) : null}
              >
                <div className="next-option-content">
                  <div className="next-option-title">{option.label}</div>
                  <div className="next-option-sub">{option.subLabel}</div>
                  <div className="next-option-stats">
                    {nextTopicStats[option.id]?.votes || 0} votes ({nextTopicStats[option.id]?.percentage || 0}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="vote-actions">
            {!connected ? (
              <button className="vote-button secondary">Connect Wallet to Vote</button>
            ) : nextVote.userVote ? (
              <button className="vote-button primary">✅ Prediction Vote Submitted</button>
            ) : !votingEligible ? (
              <button className="vote-button disabled">Need More Tokens to Vote</button>
            ) : (
              <button className="vote-button secondary">Select a Prediction Above</button>
            )}
          </div>
        </div>
      </div>
      
      <div className="info-section">
        <h2 className="info-title">Voting Information</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-badge">1</div>
            <h3 className="info-card-title">Voting Period</h3>
            <p className="info-card-text">Each prediction runs for 72 hours total. Voting is open for the first 48 hours, followed by a 24-hour decision period before resolution.</p>
          </div>
          
          <div className="info-card">
            <div className="info-badge">2</div>
            <h3 className="info-card-title">Reward Distribution</h3>
            <p className="info-card-text">Rewards are distributed equally among all voters who chose the correct outcome.</p>
          </div>
          
          <div className="info-card">
            <div className="info-badge">3</div>
            <h3 className="info-card-title">Minimum Requirement</h3>
            <p className="info-card-text">You must hold at least 0.2% of tokens to be eligible to vote.</p>
          </div>
          
          <div className="info-card">
            <div className="info-badge">4</div>
            <h3 className="info-card-title">Continuous Predictions</h3>
            <p className="info-card-text">After resolution, users can immediately vote on the next prediction.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VoteDashboard;