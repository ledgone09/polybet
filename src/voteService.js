// Vote Service - Handles all voting operations with Firebase
import { database, ref, set, get, onValue, update } from './firebase';

// Question IDs
export const CURRENT_QUESTION_ID = 'sol_price_prediction';
export const NEXT_TOPIC_QUESTION_ID = 'next_topic_vote';

/**
 * Get all votes from Firebase
 * @returns {Promise<Object>} All votes organized by question ID
 */
export const getStoredVotes = async () => {
  try {
    console.log('Fetching votes from Firebase...');
    const votesRef = ref(database, 'votes');
    const snapshot = await get(votesRef);
    
    if (snapshot.exists()) {
      const votes = snapshot.val();
      console.log('Fetched votes from Firebase:', votes);
      
      // Ensure structure exists
      if (!votes[CURRENT_QUESTION_ID]) {
        votes[CURRENT_QUESTION_ID] = {};
      }
      if (!votes[NEXT_TOPIC_QUESTION_ID]) {
        votes[NEXT_TOPIC_QUESTION_ID] = {};
      }
      
      return votes;
    } else {
      console.log('No votes found, initializing...');
      const initialVotes = {
        [CURRENT_QUESTION_ID]: {},
        [NEXT_TOPIC_QUESTION_ID]: {}
      };
      await set(votesRef, initialVotes);
      return initialVotes;
    }
  } catch (error) {
    console.error('Error reading votes from Firebase:', error);
    // Fallback to localStorage
    const stored = localStorage.getItem('polybet_votes_backup');
    return stored ? JSON.parse(stored) : {
      [CURRENT_QUESTION_ID]: {},
      [NEXT_TOPIC_QUESTION_ID]: {}
    };
  }
};

/**
 * Store a vote in Firebase
 * @param {string} questionId - The question ID
 * @param {string} userWallet - User's wallet address
 * @param {string} vote - The vote option ID
 * @param {number} tokenBalance - User's token balance at time of vote
 * @returns {Promise<boolean>} Success status
 */
export const storeVote = async (questionId, userWallet, vote, tokenBalance) => {
  try {
    const voteData = {
      vote,
      timestamp: Date.now(),
      tokenBalance
    };
    
    console.log('Storing vote to Firebase:', { questionId, userWallet, vote });
    
    // Reference to specific vote location
    const voteRef = ref(database, `votes/${questionId}/${userWallet}`);
    await set(voteRef, voteData);
    
    console.log('Successfully saved vote to Firebase');
    
    // Also save to localStorage as backup
    const allVotes = await getStoredVotes();
    localStorage.setItem('polybet_votes_backup', JSON.stringify(allVotes));
    
    return true;
  } catch (error) {
    console.error('Error storing vote to Firebase:', error);
    
    // Fallback to localStorage
    try {
      const votes = JSON.parse(localStorage.getItem('polybet_votes_backup') || '{}');
      if (!votes[questionId]) {
        votes[questionId] = {};
      }
      votes[questionId][userWallet] = {
        vote,
        timestamp: Date.now(),
        tokenBalance
      };
      localStorage.setItem('polybet_votes_backup', JSON.stringify(votes));
      return true;
    } catch (localError) {
      console.error('Error with localStorage fallback:', localError);
      return false;
    }
  }
};

/**
 * Get a specific user's vote for a question
 * @param {string} questionId - The question ID
 * @param {string} userWallet - User's wallet address
 * @returns {Promise<string|null>} The vote option ID or null
 */
export const getUserVote = async (questionId, userWallet) => {
  const votes = await getStoredVotes();
  return votes[questionId]?.[userWallet]?.vote || null;
};

/**
 * Get total vote count for a question
 * @param {string} questionId - The question ID
 * @returns {Promise<number>} Total number of votes
 */
export const getQuestionVoteCount = async (questionId) => {
  const votes = await getStoredVotes();
  return Object.keys(votes[questionId] || {}).length;
};

/**
 * Subscribe to real-time vote updates
 * @param {Function} callback - Called whenever votes change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToVotes = (callback) => {
  const votesRef = ref(database, 'votes');
  return onValue(votesRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({
        [CURRENT_QUESTION_ID]: {},
        [NEXT_TOPIC_QUESTION_ID]: {}
      });
    }
  }, (error) => {
    console.error('Error subscribing to votes:', error);
  });
};

/**
 * Clear all votes (admin function)
 * @returns {Promise<boolean>} Success status
 */
export const clearAllVotes = async () => {
  try {
    const votesRef = ref(database, 'votes');
    await set(votesRef, {
      [CURRENT_QUESTION_ID]: {},
      [NEXT_TOPIC_QUESTION_ID]: {}
    });
    localStorage.removeItem('polybet_votes_backup');
    return true;
  } catch (error) {
    console.error('Error clearing votes:', error);
    return false;
  }
};

