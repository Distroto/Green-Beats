const TravelLog = require('../models/travelLogModel');
const User = require('../models/userModel');
const { getEmissionFactor } = require('./emissionCalculator');

/**
 * Generate simple, actionable suggestions for users
 */
async function generateUserSuggestions(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const travelLogs = await TravelLog.find({ userId }).sort({ timestamp: -1 }).limit(10);
    
    const suggestions = [];
    
    // Analyze travel patterns
    if (travelLogs.length > 0) {
      const totalEmissions = travelLogs.reduce((sum, log) => sum + log.emissionsKgCO2, 0);
      const averageEmissions = totalEmissions / travelLogs.length;
      
      // High emissions suggestion
      if (averageEmissions > 5) {
        suggestions.push({
          type: 'travel',
          priority: 'high',
          title: 'Reduce Your Travel Emissions',
          message: `Your average trip produces ${averageEmissions.toFixed(1)}kg CO2. Consider public transport or cycling for shorter distances.`,
          action: 'Try walking or cycling for trips under 3km',
          potentialSavings: `${(averageEmissions * 0.7).toFixed(1)}kg CO2 per trip`
        });
      }

      // Mode preference analysis
      const modeCounts = {};
      travelLogs.forEach(log => {
        modeCounts[log.travelMode] = (modeCounts[log.travelMode] || 0) + 1;
      });

      const mostUsedMode = Object.entries(modeCounts)
        .sort(([,a], [,b]) => b - a)[0][0];

      if (mostUsedMode === 'car') {
        suggestions.push({
          type: 'transport',
          priority: 'medium',
          title: 'Consider Alternative Transport',
          message: 'You frequently use a car. Public transport can reduce your emissions by up to 80%.',
          action: 'Check bus/train routes for your next concert',
          potentialSavings: '2-5kg CO2 per trip'
        });
      }
    }

    // Reward points suggestions
    if (user.rewardPoints < 50) {
      suggestions.push({
        type: 'engagement',
        priority: 'medium',
        title: 'Earn More Green Points',
        message: 'You have few reward points. Upload travel proofs to earn points and badges!',
        action: 'Upload proof of your next green travel',
        potentialSavings: '5-10 points per trip'
      });
    }

    // Badge suggestions
    const earnedBadges = user.badges || [];
    if (!earnedBadges.includes('Green Traveler')) {
      suggestions.push({
        type: 'achievement',
        priority: 'low',
        title: 'Unlock Green Traveler Badge',
        message: 'Complete 5 green travel trips to earn the Green Traveler badge!',
        action: 'Use public transport, walk, or cycle for your next 5 trips',
        potentialSavings: 'Green Traveler badge + 25 points'
      });
    }

    // General suggestions
    suggestions.push({
      type: 'general',
      priority: 'low',
      title: 'Plan Ahead for Concerts',
      message: 'Planning your route in advance helps you choose the greenest option.',
      action: 'Check transport options before attending concerts',
      potentialSavings: 'Time and emissions saved'
    });

    return {
      userId: user._id,
      userName: user.name,
      suggestions: suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error generating user suggestions:', error);
    throw error;
  }
}

/**
 * Get personalized travel recommendations for a specific concert
 */
async function getConcertSuggestions(userId, concertId, originLat, originLng) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const suggestions = [];
    
    // Get emission factors for comparison
    const emissionFactors = getEmissionFactor.all();
    
    // Simple distance-based suggestions
    const distance = calculateDistance(originLat, originLng, 51.5074, -0.1278); // Example coordinates
    
    if (distance < 3) {
      suggestions.push({
        type: 'optimal',
        mode: 'walking',
        title: 'Perfect for Walking!',
        message: `The venue is only ${distance.toFixed(1)}km away. Walking is the greenest option.`,
        emissions: 0,
        time: `${Math.round(distance * 12)} minutes`,
        points: 10
      });
    } else if (distance < 10) {
      suggestions.push({
        type: 'optimal',
        mode: 'cycling',
        title: 'Great Cycling Distance',
        message: `At ${distance.toFixed(1)}km, cycling is fast and emission-free.`,
        emissions: 0,
        time: `${Math.round(distance * 4)} minutes`,
        points: 8
      });
    }

    // Always suggest public transport
    suggestions.push({
      type: 'recommended',
      mode: 'public_transport',
      title: 'Public Transport Option',
      message: 'Buses and trains are much greener than driving.',
      emissions: +(distance * emissionFactors.train).toFixed(2),
      time: `${Math.round(distance * 3)} minutes`,
      points: 6
    });

    // Compare with car
    const carEmissions = +(distance * emissionFactors.car).toFixed(2);
    suggestions.push({
      type: 'avoid',
      mode: 'car',
      title: 'Avoid Driving',
      message: `Driving would produce ${carEmissions}kg CO2. Choose a greener option!`,
      emissions: carEmissions,
      time: `${Math.round(distance * 2)} minutes`,
      points: 0
    });

    return {
      concertId,
      userLocation: { lat: originLat, lng: originLng },
      distance: distance,
      suggestions: suggestions.sort((a, b) => a.emissions - b.emissions),
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error getting concert suggestions:', error);
    throw error;
  }
}

/**
 * Get user's sustainability progress
 */
async function getUserProgress(userId) {
  try {
    const user = await User.findById(userId);
    const travelLogs = await TravelLog.find({ userId });

    if (travelLogs.length === 0) {
      return {
        totalTrips: 0,
        totalEmissions: 0,
        greenTrips: 0,
        greenPercentage: 0,
        averageEmissions: 0,
        level: 'Beginner',
        nextMilestone: 'Complete your first green trip!'
      };
    }

    const totalTrips = travelLogs.length;
    const totalEmissions = travelLogs.reduce((sum, log) => sum + log.emissionsKgCO2, 0);
    const greenTrips = travelLogs.filter(log => 
      ['walk', 'bike', 'train', 'bus'].includes(log.travelMode)
    ).length;
    const greenPercentage = (greenTrips / totalTrips) * 100;
    const averageEmissions = totalEmissions / totalTrips;

    // Determine level
    let level = 'Beginner';
    let nextMilestone = 'Complete 5 green trips';

    if (greenPercentage >= 80) {
      level = 'Eco Champion';
      nextMilestone = 'Maintain your excellent green travel record!';
    } else if (greenPercentage >= 60) {
      level = 'Green Traveler';
      nextMilestone = 'Aim for 80% green trips to become an Eco Champion';
    } else if (greenPercentage >= 40) {
      level = 'Getting Greener';
      nextMilestone = 'Aim for 60% green trips to become a Green Traveler';
    } else if (greenPercentage >= 20) {
      level = 'Starting Out';
      nextMilestone = 'Aim for 40% green trips to become Getting Greener';
    }

    return {
      totalTrips,
      totalEmissions: +totalEmissions.toFixed(2),
      greenTrips,
      greenPercentage: +greenPercentage.toFixed(1),
      averageEmissions: +averageEmissions.toFixed(2),
      level,
      nextMilestone,
      rewardPoints: user.rewardPoints,
      badges: user.badges || []
    };

  } catch (error) {
    console.error('Error getting user progress:', error);
    throw error;
  }
}

/**
 * Get user sustainability leaderboard
 */
async function getUserLeaderboard(limit = 20) {
  try {
    // Aggregate user data with travel statistics
    const userStats = await TravelLog.aggregate([
      {
        $group: {
          _id: '$userId',
          totalTrips: { $sum: 1 },
          totalEmissions: { $sum: '$emissionsKgCO2' },
          totalDistance: { $sum: '$distanceKm' },
          greenTrips: {
            $sum: {
              $cond: [
                { $in: ['$travelMode', ['walk', 'bike', 'train', 'bus']] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $unwind: '$userInfo'
      },
      {
        $addFields: {
          greenPercentage: {
            $cond: [
              { $eq: ['$totalTrips', 0] },
              0,
              { $multiply: [{ $divide: ['$greenTrips', '$totalTrips'] }, 100] }
            ]
          },
          averageEmissions: {
            $cond: [
              { $eq: ['$totalTrips', 0] },
              0,
              { $divide: ['$totalEmissions', '$totalTrips'] }
            ]
          },
          sustainabilityScore: {
            $add: [
              { $multiply: [{ $divide: ['$greenTrips', { $max: ['$totalTrips', 1] }] }, 50] }, // 50% weight for green trips
              { $multiply: [{ $max: [0, { $subtract: [10, { $divide: ['$totalEmissions', { $max: ['$totalTrips', 1] }] }] }] }, 5] }, // 50% weight for low emissions
              { $multiply: ['$userInfo.rewardPoints', 0.1] } // Bonus for reward points
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          totalTrips: 1,
          totalEmissions: { $round: ['$totalEmissions', 2] },
          totalDistance: { $round: ['$totalDistance', 2] },
          greenTrips: 1,
          greenPercentage: { $round: ['$greenPercentage', 1] },
          averageEmissions: { $round: ['$averageEmissions', 2] },
          sustainabilityScore: { $round: ['$sustainabilityScore', 1] },
          rewardPoints: '$userInfo.rewardPoints',
          badges: '$userInfo.badges'
        }
      },
      {
        $sort: { sustainabilityScore: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Add rank to each user
    const leaderboard = userStats.map((user, index) => ({
      rank: index + 1,
      ...user
    }));

    return {
      leaderboard,
      totalUsers: leaderboard.length,
      generatedAt: new Date()
    };

  } catch (error) {
    console.error('Error getting user leaderboard:', error);
    throw error;
  }
}

/**
 * Get top users by category
 */
async function getTopUsersByCategory() {
  try {
    const categories = [
      { name: 'Most Green Trips', field: 'greenTrips', sort: -1 },
      { name: 'Lowest Emissions', field: 'averageEmissions', sort: 1 },
      { name: 'Highest Green Percentage', field: 'greenPercentage', sort: -1 },
      { name: 'Most Reward Points', field: 'rewardPoints', sort: -1 },
      { name: 'Most Distance Traveled Green', field: 'totalDistance', sort: -1 }
    ];

    const results = {};
    
    for (const category of categories) {
      const users = await TravelLog.aggregate([
        {
          $group: {
            _id: '$userId',
            totalTrips: { $sum: 1 },
            totalEmissions: { $sum: '$emissionsKgCO2' },
            totalDistance: { $sum: '$distanceKm' },
            greenTrips: {
              $sum: {
                $cond: [
                  { $in: ['$travelMode', ['walk', 'bike', 'train', 'bus']] },
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $unwind: '$userInfo'
        },
        {
          $addFields: {
            greenPercentage: {
              $cond: [
                { $eq: ['$totalTrips', 0] },
                0,
                { $multiply: [{ $divide: ['$greenTrips', '$totalTrips'] }, 100] }
              ]
            },
            averageEmissions: {
              $cond: [
                { $eq: ['$totalTrips', 0] },
                0,
                { $divide: ['$totalEmissions', '$totalTrips'] }
              ]
            }
          }
        },
        {
          $project: {
            _id: 1,
            name: '$userInfo.name',
            totalTrips: 1,
            totalEmissions: { $round: ['$totalEmissions', 2] },
            totalDistance: { $round: ['$totalDistance', 2] },
            greenTrips: 1,
            greenPercentage: { $round: ['$greenPercentage', 1] },
            averageEmissions: { $round: ['$averageEmissions', 2] },
            rewardPoints: '$userInfo.rewardPoints'
          }
        },
        {
          $sort: { [category.field]: category.sort }
        },
        {
          $limit: 5
        }
      ]);

      results[category.name] = users.map((user, index) => ({
        rank: index + 1,
        name: user.name,
        value: user[category.field],
        totalTrips: user.totalTrips,
        greenTrips: user.greenTrips
      }));
    }

    return results;

  } catch (error) {
    console.error('Error getting user category rankings:', error);
    throw error;
  }
}

// Utility function
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

module.exports = {
  generateUserSuggestions,
  getConcertSuggestions,
  getUserProgress,
  getUserLeaderboard,
  getTopUsersByCategory
}; 