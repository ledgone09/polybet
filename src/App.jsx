import './App.css'
import { useState, useEffect } from 'react'
import VoteDashboard from './VoteDashboard'
import { 
  getStoredVotes, 
  subscribeToVotes,
  CURRENT_QUESTION_ID, 
  NEXT_TOPIC_QUESTION_ID 
} from './voteService'

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

function App() {
  const [showDashboard, setShowDashboard] = useState(false)

  // Current prediction data (should match VoteDashboard)
  const [currentPrediction, setCurrentPrediction] = useState({
    question: "What will the SOL price be?",
    endTime: "2025-10-05T18:00:00Z",
    options: [
      { id: 'below_204', label: 'Below $204' },
      { id: 'price_206', label: '$206' },
      { id: 'price_208', label: '$208' },
      { id: 'price_210', label: '$210' },
      { id: 'above_210', label: 'Above $210' }
    ]
  });

  // Next prediction data (should match VoteDashboard)
  const [nextPrediction, setNextPrediction] = useState({
    question: "What should be the next prediction question?",
    startTime: "2025-10-05T18:00:00Z",
    options: [
      { id: 'btc_price', label: 'BTC Price Prediction' },
      { id: 'fomc_dissent', label: 'FOMC Dissenting Vote' },
      { id: 'congress_shutdown', label: 'Congress Funding Bill' },
      { id: 'sol_price', label: 'Solana Price Prediction' },
      { id: 'party_break', label: 'Senator Party Break' }
    ]
  });

  // Timer states
  const [timeRemaining, setTimeRemaining] = useState(() => calculateTimeRemaining(currentPrediction.endTime));
  const [votingTimeRemaining, setVotingTimeRemaining] = useState(() => {
    const endTime = new Date(currentPrediction.endTime);
    const votingEndTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000));
    return calculateTimeRemaining(votingEndTime.toISOString());
  });

  // Vote data state
  const [voteStats, setVoteStats] = useState({
    current: { total: 0, options: {} },
    next: { total: 0, options: {} }
  });

  // Pool data state
  const [poolData, setPoolData] = useState({
    currentPool: 0
  });

  // Calculate vote statistics
  const calculateVoteStats = async () => {
    const votes = await getStoredVotes();
    
    // Current prediction stats
    const currentVotes = votes[CURRENT_QUESTION_ID] || {};
    const currentTotal = Object.keys(currentVotes).length;
    const currentOptions = {};
    
    currentPrediction.options.forEach(option => {
      const voteCount = Object.values(currentVotes).filter(v => v.vote === option.id).length;
      currentOptions[option.id] = {
        votes: voteCount,
        percentage: currentTotal > 0 ? Math.round((voteCount / currentTotal) * 100) : 0
      };
    });

    // Next prediction stats
    const nextVotes = votes[NEXT_TOPIC_QUESTION_ID] || {};
    const nextTotal = Object.keys(nextVotes).length;
    const nextOptions = {};
    
    nextPrediction.options.forEach(option => {
      const voteCount = Object.values(nextVotes).filter(v => v.vote === option.id).length;
      nextOptions[option.id] = {
        votes: voteCount,
        percentage: nextTotal > 0 ? Math.round((voteCount / nextTotal) * 100) : 0
      };
    });

    setVoteStats({
      current: { total: currentTotal, options: currentOptions },
      next: { total: nextTotal, options: nextOptions }
    });
  };

  // Fetch pool data
  const fetchPoolData = async () => {
    try {
      // Import Solana web3.js only when needed
      const { Connection, PublicKey } = await import('@solana/web3.js');
      
      // Use the same RPC endpoint as dashboard
      const connection = new Connection(
        'https://magical-boldest-patina.solana-mainnet.quiknode.pro/a94255dcbb27e52b1d4cca35d10e899b82b6bdba/',
        'confirmed'
      );
      
      // Pool wallet address (same as dashboard)
      const POOL_WALLET_ADDRESS = '4dcfMsgfoXphUqspLCdv7PZQZd6nbtut5xQdqpnuAWNe';
      const poolWalletPubkey = new PublicKey(POOL_WALLET_ADDRESS);
      const poolBalance = await connection.getBalance(poolWalletPubkey);
      const poolBalanceSOL = poolBalance / 1e9; // Convert lamports to SOL
      
      setPoolData({
        currentPool: poolBalanceSOL
      });
    } catch (error) {
      console.error('Error fetching pool data:', error);
      // Set to 0 if unable to fetch
      setPoolData({
        currentPool: 0
      });
    }
  };

  // Update timers in real-time (every second)
  useEffect(() => {
    const updateTimers = () => {
      setTimeRemaining(calculateTimeRemaining(currentPrediction.endTime));
      const endTime = new Date(currentPrediction.endTime);
      const votingEndTime = new Date(endTime.getTime() - (24 * 60 * 60 * 1000));
      setVotingTimeRemaining(calculateTimeRemaining(votingEndTime.toISOString()));
    };

    // Update immediately
    updateTimers();

    // Update every second for real-time countdown
    const timerInterval = setInterval(updateTimers, 1000);

    return () => clearInterval(timerInterval);
  }, [currentPrediction.endTime]);

  // Update vote stats and pool data on component mount and with real-time updates
  useEffect(() => {
    const updateData = async () => {
      await calculateVoteStats();
      await fetchPoolData();
    };
    
    updateData();
    
    // Subscribe to real-time vote updates from Firebase
    const unsubscribe = subscribeToVotes(async (votes) => {
      console.log('Real-time vote update received:', votes);
      await calculateVoteStats();
    });
    
    // Also refresh pool data periodically
    const interval = setInterval(() => {
      fetchPoolData();
    }, 10000); // Update pool data every 10 seconds
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Helper to format time with seconds
  const formatTime = (timeObj) => {
    return `${timeObj.hours}h ${timeObj.minutes}m ${timeObj.seconds}s`;
  };

  if (showDashboard) {
    return <VoteDashboard setShowDashboard={setShowDashboard} />;
  }

  return (
    <div className="app">
      <section className="hero">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-top">
              <h1 className="hero-title">
                <span className="title-line">Market Intelligence</span>
                <span className="title-line">Powered by Collective Wisdom</span>
              </h1>
              <p className="hero-description">
                CoinVote revolutionizes prediction markets with a unique model where creator fees directly fund community rewards. 
                Participate in high-stakes market and geopolitical predictions with transparent voting every 72 hours.
              </p>
              <div className="how-it-works-brief">
                <h3 className="brief-title">How it works</h3>
                <p className="brief-text">
                  Hold 0.2% tokens → Vote in 48-hour windows → Win equal payouts from creator fees → Move to next prediction
                </p>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-value">{poolData.currentPool.toFixed(2)} SOL</span>
                  <span className="stat-label">Current Pool</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">3 Days</span>
                  <span className="stat-label">Voting Cycle</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{voteStats.current.total + voteStats.next.total}</span>
                  <span className="stat-label">Voters</span>
                </div>
              </div>
            </div>
            <div className="hero-bottom">
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={() => setShowDashboard(true)}>Enter App</button>
                <button className="btn btn-secondary">Whitepaper</button>
              </div>
              <div className="hero-socials">
              <a className="social-btn" href="https://x.com/" target="_blank" rel="noreferrer">
                <span className="social-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.5 7.43L22.5 22H15l-4.9-6.34L4 22H1.244l7.13-8.15L1.5 2H9l4.47 5.79L18.244 2Zm-2.46 18h1.78L7.28 4h-1.8l10.303 16Z"/></svg>
                </span>
                <span className="social-label">X</span>
              </a>
              <a className="social-btn" href="https://t.me/" target="_blank" rel="noreferrer">
                <span className="social-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.036 15.803 8.86 19.3c.36 0 .517-.154.704-.34l1.69-1.635 3.503 2.57c.643.355 1.104.168 1.283-.595l2.324-10.91h.001c.206-.967-.35-1.345-.978-1.11L3.39 10.04c-.946.367-.932.894-.161 1.127l3.757 1.17 8.725-5.507c.411-.266.786-.12.477.145l-7.152 6.83Z"/></svg>
                </span>
                <span className="social-label">Telegram</span>
              </a>
              <a className="social-btn" href="https://discord.com/" target="_blank" rel="noreferrer">
                <span className="social-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.21.38-.454.9-.623 1.311a18.27 18.27 0 0 0-3.871 0A10.96 10.96 0 0 0 11.44 3a19.79 19.79 0 0 0-3.759 1.369C3.492 9.023 2.69 13.557 3.058 18c1.583 1.175 3.122 1.894 4.611 2.369.372-.511.703-1.058.985-1.633-.545-.206-1.069-.46-1.566-.756.131-.095.26-.195.384-.299 3.006 1.406 6.253 1.406 9.211 0 .125.104.254.204.385.299-.498.296-1.022.55-1.567.756.282.575.613 1.122.985 1.633 1.489-.475 3.028-1.194 4.611-2.369.378-4.657-.607-9.146-2.4-13.631ZM9.51 15.5c-.895 0-1.628-.836-1.628-1.866 0-1.029.716-1.868 1.629-1.868.912 0 1.644.839 1.628 1.868 0 1.03-.716 1.866-1.63 1.866Zm5.006 0c-.895 0-1.628-.836-1.628-1.866 0-1.029.717-1.868 1.629-1.868.913 0 1.645.839 1.629 1.868 0 1.03-.717 1.866-1.63 1.866Z"/></svg>
                </span>
                <span className="social-label">Discord</span>
              </a>
              <a className="social-btn" href="https://github.com/" target="_blank" rel="noreferrer">
                <span className="social-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.648.5.5 5.648.5 12c0 5.083 3.292 9.383 7.868 10.9.575.1.787-.25.787-.556 0-.273-.01-1.173-.015-2.13-3.2.696-3.875-1.347-3.875-1.347-.523-1.328-1.277-1.682-1.277-1.682-1.044-.714.079-.699.079-.699 1.154.081 1.762 1.185 1.762 1.185 1.027 1.76 2.695 1.252 3.35.957.104-.756.402-1.252.73-1.54-2.555-.291-5.243-1.277-5.243-5.683 0-1.255.45-2.28 1.184-3.084-.119-.29-.513-1.463.113-3.051 0 0 .965-.309 3.164 1.178a10.96 10.96 0 0 1 2.88-.388c.977.005 1.962.132 2.88.388 2.199-1.487 3.162-1.178 3.162-1.178.628 1.588.234 2.761.115 3.051.736.805 1.182 1.829 1.182 3.084 0 4.417-2.692 5.387-5.256 5.673.413.356.78 1.057.78 2.131 0 1.54-.014 2.78-.014 3.158 0 .309.208.662.793.55C20.21 21.379 23.5 17.08 23.5 12 23.5 5.648 18.352.5 12 .5Z"/></svg>
                </span>
                <span className="social-label">GitHub</span>
              </a>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="prediction-card current">
              <div className="prediction-header">
                <h3>Current Prediction</h3>
                <span className="prediction-timer">{formatTime(timeRemaining)} remaining</span>
              </div>
              <div className="prediction-question">
                {currentPrediction.question}
              </div>
              <div className="prediction-options compact">
                {(() => {
                  // Show top 2 options with highest votes
                  const sortedOptions = currentPrediction.options
                    .map(option => ({
                      ...option,
                      ...voteStats.current.options[option.id]
                    }))
                    .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                    .slice(0, 2);

                  return sortedOptions.map(option => (
                    <div className="option-container" key={option.id}>
                      <div className="option compact">
                        <div className="option-label">{option.label}</div>
                        <div className="option-note">
                          {option.votes || 0} votes ({option.percentage || 0}%)
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div className="prediction-footer">
                <span className="total-votes">{voteStats.current.total} total votes</span>
                <button className="btn btn-small" onClick={() => setShowDashboard(true)}>Show Vote</button>
              </div>
            </div>
            <div className="prediction-card next">
              <div className="prediction-header small">
                <h3>Vote for Next Topic</h3>
                <span className="prediction-timer">Voting ends in {formatTime(votingTimeRemaining)}</span>
              </div>
              <div className="prediction-question">
                {nextPrediction.question}
              </div>
              <div className="next-options all-options">
                {(() => {
                  // Show all 5 next prediction options
                  const sortedOptions = nextPrediction.options
                    .map(option => ({
                      ...option,
                      ...voteStats.next.options[option.id]
                    }))
                    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

                  return sortedOptions.map((option, index) => (
                    <button 
                      className={`choice compact ${index === 0 ? 'leading' : ''}`} 
                      type="button" 
                      key={option.id}
                      onClick={() => setShowDashboard(true)}
                    >
                      <div className="choice-title">{option.label}</div>
                      <div className="choice-sub">
                        {option.votes || 0} votes ({option.percentage || 0}%)
                      </div>
                    </button>
                  ));
                })()}
              </div>
              <div className="prediction-footer">
                <span className="total-votes">{voteStats.next.total} topic votes</span>
                <button className="btn btn-small" onClick={() => setShowDashboard(true)}>Show Vote</button>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div className="how-container">
          <h2 className="how-title">How it works</h2>
          <p className="how-subtitle">
            Simple, transparent, and fair prediction markets powered by community participation
          </p>
          <div className="how-grid">
            <div className="how-card" tabIndex={0} role="group">
              <span className="how-badge">1</span>
              <span className="how-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="how-card-title">Voting window</h3>
              <p className="how-card-text">First 48 hours are open for votes. Voting then closes 24 hours before resolution for fairness.</p>
            </div>
            <div className="how-card" tabIndex={0} role="group">
              <span className="how-badge">2</span>
              <span className="how-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9h12M6 15h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="how-card-title">Equal odds</h3>
              <p className="how-card-text">Prize money is funded by creator fees, so odds don't adjust and remain equal throughout.</p>
            </div>
            <div className="how-card" tabIndex={0} role="group">
              <span className="how-badge">3</span>
              <span className="how-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="8.5" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="15.5" cy="15" r="1.5" fill="currentColor" />
                  <path d="M7 17L17 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="how-card-title">Minimum to vote</h3>
              <p className="how-card-text">You must hold at least 0.2% to be eligible to vote.</p>
            </div>
            <div className="how-card" tabIndex={0} role="group">
              <span className="how-badge">4</span>
              <span className="how-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" />
                  <path d="M8.5 12l2.2 2.2L15.5 9.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="how-card-title">Payouts</h3>
              <p className="how-card-text">Winnings are distributed evenly among all voters who chose the correct outcome.</p>
            </div>
            <div className="how-card" tabIndex={0} role="group">
              <span className="how-badge">5</span>
              <span className="how-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5l8 7-8 7" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 12h9" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                </svg>
              </span>
              <h3 className="how-card-title">Continuous markets</h3>
              <p className="how-card-text">After resolution, users can immediately vote on the next prediction.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="roadmap">
        <div className="roadmap-container">
          <div className="roadmap-header">
            <div className="roadmap-badge">
              <span className="badge-dot"></span>
              <span className="badge-text">ROADMAP</span>
            </div>
            <h2 className="roadmap-title">
              <span className="title-main">What's Next?</span>
              <span className="title-sub">Our vision for the future of prediction markets - expanding beyond simple voting to comprehensive market creation</span>
            </h2>
          </div>
          
          <div className="roadmap-grid">
            <div className="feature-card featured">
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 9h6v6H9z" fill="currentColor"/>
                    <path d="M9 3v6M15 3v6M21 9H15M21 15H15M9 15v6M15 15v6M3 9h6M3 15h6" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <h3 className="feature-title">Create Your Own Markets</h3>
              </div>
              <p className="feature-description">
                Launch your own prediction markets on any topic from crypto prices to political events. Set your own fees and earn from every trade.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Tech</h3>
              </div>
              <p className="feature-description">
                Use your tokens to bet on hundreds of markets. Trade on everything from sports to elections using the token.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="feature-title">Current App</h3>
              </div>
              <p className="feature-description">
                The current app will evolve into a full betting platform where users can create, trade, and profit from unlimited prediction markets.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="social-banner">
        <div className="social-banner-container">
          <h3 className="social-banner-title">Join the community</h3>
          <div className="social-row">
            <a className="social-btn" href="https://x.com/" target="_blank" rel="noreferrer">
              <span className="social-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2H21l-6.5 7.43L22.5 22H15l-4.9-6.34L4 22H1.244l7.13-8.15L1.5 2H9l4.47 5.79L18.244 2Zm-2.46 18h1.78L7.28 4h-1.8l10.303 16Z"/></svg>
              </span>
              <span className="social-label">X</span>
            </a>
            <a className="social-btn" href="https://t.me/" target="_blank" rel="noreferrer">
              <span className="social-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9.036 15.803 8.86 19.3c.36 0 .517-.154.704-.34l1.69-1.635 3.503 2.57c.643.355 1.104.168 1.283-.595l2.324-10.91h.001c.206-.967-.35-1.345-.978-1.11L3.39 10.04c-.946.367-.932.894-.161 1.127l3.757 1.17 8.725-5.507c.411-.266.786-.12.477.145l-7.152 6.83Z"/></svg>
              </span>
              <span className="social-label">Telegram</span>
            </a>
            <a className="social-btn" href="https://discord.com/" target="_blank" rel="noreferrer">
              <span className="social-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.21.38-.454.9-.623 1.311a18.27 18.27 0 0 0-3.871 0A10.96 10.96 0 0 0 11.44 3a19.79 19.79 0 0 0-3.759 1.369C3.492 9.023 2.69 13.557 3.058 18c1.583 1.175 3.122 1.894 4.611 2.369.372-.511.703-1.058.985-1.633-.545-.206-1.069-.46-1.566-.756.131-.095.26-.195.384-.299 3.006 1.406 6.253 1.406 9.211 0 .125.104.254.204.385.299-.498.296-1.022.55-1.567.756.282.575.613 1.122.985 1.633 1.489-.475 3.028-1.194 4.611-2.369.378-4.657-.607-9.146-2.4-13.631ZM9.51 15.5c-.895 0-1.628-.836-1.628-1.866 0-1.029.716-1.868 1.629-1.868.912 0 1.644.839 1.628 1.868 0 1.03-.716 1.866-1.63 1.866Zm5.006 0c-.895 0-1.628-.836-1.628-1.866 0-1.029.717-1.868 1.629-1.868.913 0 1.645.839 1.629 1.868 0 1.03-.717 1.866-1.63 1.866Z"/></svg>
              </span>
              <span className="social-label">Discord</span>
            </a>
            <a className="social-btn" href="https://github.com/" target="_blank" rel="noreferrer">
              <span className="social-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.648.5.5 5.648.5 12c0 5.083 3.292 9.383 7.868 10.9.575.1.787-.25.787-.556 0-.273-.01-1.173-.015-2.13-3.2.696-3.875-1.347-3.875-1.347-.523-1.328-1.277-1.682-1.277-1.682-1.044-.714.079-.699.079-.699 1.154.081 1.762 1.185 1.762 1.185 1.027 1.76 2.695 1.252 3.35.957.104-.756.402-1.252.73-1.54-2.555-.291-5.243-1.277-5.243-5.683 0-1.255.45-2.28 1.184-3.084-.119-.29-.513-1.463.113-3.051 0 0 .965-.309 3.164 1.178a10.96 10.96 0 0 1 2.88-.388c.977.005 1.962.132 2.88.388 2.199-1.487 3.162-1.178 3.162-1.178.628 1.588.234 2.761.115 3.051.736.805 1.182 1.829 1.182 3.084 0 4.417-2.692 5.387-5.256 5.673.413.356.78 1.057.78 2.131 0 1.54-.014 2.78-.014 3.158 0 .309.208.662.793.55C20.21 21.379 23.5 17.08 23.5 12 23.5 5.648 18.352.5 12 .5Z"/></svg>
              </span>
              <span className="social-label">GitHub</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;