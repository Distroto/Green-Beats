const { 
  generateUserSuggestions, 
  getConcertSuggestions, 
  getUserProgress,
  getUserLeaderboard,
  getTopUsersByCategory
} = require('../services/userSuggestionService');

/**
 * Generate personalized suggestions for a user
 */
exports.getUserSuggestions = async (req, res) => {
  try {
    const { userId } = req.params;

    const suggestions = await generateUserSuggestions(userId);

    res.json(suggestions);

  } catch (err) {
    console.error('Error generating user suggestions:', err);
    res.status(500).json({ 
      error: 'Failed to generate user suggestions', 
      details: err.message 
    });
  }
};

/**
 * Get travel suggestions for a specific concert
 */
exports.getConcertSuggestions = async (req, res) => {
  try {
    const { userId, concertId } = req.params;
    const { originLat, originLng } = req.query;

    if (!originLat || !originLng) {
      return res.status(400).json({ 
        error: 'Origin coordinates required (originLat, originLng)' 
      });
    }

    const suggestions = await getConcertSuggestions(
      userId, 
      concertId, 
      parseFloat(originLat), 
      parseFloat(originLng)
    );

    res.json(suggestions);

  } catch (err) {
    console.error('Error getting concert suggestions:', err);
    res.status(500).json({ 
      error: 'Failed to get concert suggestions', 
      details: err.message 
    });
  }
};

/**
 * Get user's sustainability progress
 */
exports.getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;

    const progress = await getUserProgress(userId);

    res.json(progress);

  } catch (err) {
    console.error('Error getting user progress:', err);
    res.status(500).json({ 
      error: 'Failed to get user progress', 
      details: err.message 
    });
  }
}; 

/**
 * Get user sustainability leaderboard
 */
exports.getUserLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const leaderboard = await getUserLeaderboard(parseInt(limit));

    res.json(leaderboard);

  } catch (err) {
    console.error('Error getting user leaderboard:', err);
    res.status(500).json({ 
      error: 'Failed to get user leaderboard', 
      details: err.message 
    });
  }
};

/**
 * Get top users by category
 */
exports.getUserCategoryRankings = async (req, res) => {
  try {
    const categoryRankings = await getTopUsersByCategory();

    res.json({
      categoryRankings,
      generatedAt: new Date()
    });

  } catch (err) {
    console.error('Error getting user category rankings:', err);
    res.status(500).json({ 
      error: 'Failed to get user category rankings', 
      details: err.message 
    });
  }
}; 