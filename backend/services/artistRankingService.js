const OpenAI = require('openai');
const Artist = require('../models/artistModel');

let openai;
if (process.env.OPENAI_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY
    });
  } catch (error) {
    console.warn('OpenAI configuration error - Artist ranking will be disabled');
    openai = null;
  }
} else {
  console.warn('OpenAI not configured - Artist ranking will be disabled');
  openai = null;
}

/**
 * Analyze artist sustainability and return a score
 */
async function analyzeArtistSustainability(artistName) {
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const prompt = `
Analyze the sustainability practices of the artist "${artistName}" and provide a score from 0-100.

Consider these factors:
- Touring practices (carbon footprint, transportation methods)
- Merchandise sustainability (materials, production)
- Energy usage (renewable energy, efficiency)
- Environmental activism and advocacy
- Personal lifestyle choices
- Carbon offsetting initiatives

Respond with ONLY a JSON object in this format:
{
  "artistName": "${artistName}",
  "sustainabilityScore": 75,
  "touringScore": 20,
  "merchandiseScore": 15,
  "energyScore": 15,
  "activismScore": 15,
  "lifestyleScore": 10,
  "summary": "Brief 2-3 sentence summary of their sustainability practices",
  "keyInitiatives": ["Initiative 1", "Initiative 2", "Initiative 3"],
  "areasForImprovement": ["Area 1", "Area 2"]
}

Use 0-100 for all scores. If you don't have enough information, use 50 as default and note it in summary.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    });

    const rawResponse = response.choices[0].message.content;
    const cleanedResponse = rawResponse.replace(/```json\n|```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('OpenAI analysis failed:', error);
    throw new Error('Failed to analyze artist sustainability');
  }
}

/**
 * Get or create artist ranking
 */
async function getArtistRanking(artistName) {
  try {
    // Check if artist exists in database
    let artist = await Artist.findOne({ 
      name: { $regex: new RegExp(`^${artistName}$`, 'i') } 
    });

    if (!artist) {
      // Create new artist entry
      artist = await Artist.create({
        name: artistName,
        genre: 'Unknown',
        greenScore: 50 // Default score
      });
    }

    // If artist doesn't have a recent green score, analyze them
    if (!artist.greenScore || artist.greenScore === 50) {
      const analysis = await analyzeArtistSustainability(artistName);
      
      // Update artist with analysis results
      artist.greenScore = analysis.sustainabilityScore;
      artist.ecoInitiatives = analysis.keyInitiatives;
      artist.bio = analysis.summary;
      await artist.save();
    }

    return artist;
  } catch (error) {
    console.error('Error getting artist ranking:', error);
    throw error;
  }
}

/**
 * Get sustainability leaderboard
 */
async function getSustainabilityLeaderboard(limit = 20) {
  try {
    const artists = await Artist.find({ greenScore: { $exists: true } })
      .sort({ greenScore: -1 })
      .limit(limit)
      .select('name greenScore ecoInitiatives bio');

    return artists.map((artist, index) => ({
      rank: index + 1,
      name: artist.name,
      greenScore: artist.greenScore,
      ecoInitiatives: artist.ecoInitiatives || [],
      summary: artist.bio || 'No sustainability data available'
    }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}

/**
 * Get top sustainable artists by category
 */
async function getTopArtistsByCategory() {
  try {
    const categories = [
      { name: 'Touring', field: 'touringScore' },
      { name: 'Merchandise', field: 'merchandiseScore' },
      { name: 'Energy', field: 'energyScore' },
      { name: 'Activism', field: 'activismScore' }
    ];

    const results = {};
    
    for (const category of categories) {
      const artists = await Artist.find({ 
        [category.field]: { $exists: true, $gt: 0 } 
      })
        .sort({ [category.field]: -1 })
        .limit(5)
        .select(`name ${category.field} greenScore`);

      results[category.name] = artists.map(artist => ({
        name: artist.name,
        score: artist[category.field],
        overallScore: artist.greenScore
      }));
    }

    return results;
  } catch (error) {
    console.error('Error getting category rankings:', error);
    throw error;
  }
}

module.exports = {
  analyzeArtistSustainability,
  getArtistRanking,
  getSustainabilityLeaderboard,
  getTopArtistsByCategory
}; 