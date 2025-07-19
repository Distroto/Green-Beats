const { 
  analyzeArtistSustainability, 
  getArtistRanking, 
  getSustainabilityLeaderboard, 
  getTopArtistsByCategory 
} = require('../services/artistRankingService');

/**
 * Analyze and rank an artist's sustainability
 */
exports.analyzeArtist = async (req, res) => {
  try {
    const { artistName } = req.body;

    if (!artistName) {
      return res.status(400).json({ error: 'Artist name is required' });
    }

    const analysis = await analyzeArtistSustainability(artistName);
    const artist = await getArtistRanking(artistName);

    res.json({
      message: 'Artist sustainability analysis completed',
      artist: {
        id: artist._id,
        name: artist.name,
        greenScore: artist.greenScore,
        ecoInitiatives: artist.ecoInitiatives,
        bio: artist.bio
      },
      analysis: {
        sustainabilityScore: analysis.sustainabilityScore,
        touringScore: analysis.touringScore,
        merchandiseScore: analysis.merchandiseScore,
        energyScore: analysis.energyScore,
        activismScore: analysis.activismScore,
        lifestyleScore: analysis.lifestyleScore,
        summary: analysis.summary,
        keyInitiatives: analysis.keyInitiatives,
        areasForImprovement: analysis.areasForImprovement
      }
    });

  } catch (err) {
    console.error('Error analyzing artist:', err);
    res.status(500).json({ 
      error: 'Failed to analyze artist sustainability', 
      details: err.message 
    });
  }
};

/**
 * Get sustainability leaderboard
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const leaderboard = await getSustainabilityLeaderboard(parseInt(limit));

    res.json({
      leaderboard,
      totalArtists: leaderboard.length,
      generatedAt: new Date()
    });

  } catch (err) {
    console.error('Error getting leaderboard:', err);
    res.status(500).json({ 
      error: 'Failed to get sustainability leaderboard', 
      details: err.message 
    });
  }
};

/**
 * Get top artists by category
 */
exports.getCategoryRankings = async (req, res) => {
  try {
    const categoryRankings = await getTopArtistsByCategory();

    res.json({
      categoryRankings,
      generatedAt: new Date()
    });

  } catch (err) {
    console.error('Error getting category rankings:', err);
    res.status(500).json({ 
      error: 'Failed to get category rankings', 
      details: err.message 
    });
  }
};

/**
 * Get artist ranking by name
 */
exports.getArtistRanking = async (req, res) => {
  try {
    const { artistName } = req.params;

    const artist = await getArtistRanking(artistName);

    res.json({
      artist: {
        id: artist._id,
        name: artist.name,
        greenScore: artist.greenScore,
        ecoInitiatives: artist.ecoInitiatives || [],
        bio: artist.bio || 'No sustainability data available',
        genre: artist.genre
      },
      generatedAt: new Date()
    });

  } catch (err) {
    console.error('Error getting artist ranking:', err);
    res.status(500).json({ 
      error: 'Failed to get artist ranking', 
      details: err.message 
    });
  }
}; 